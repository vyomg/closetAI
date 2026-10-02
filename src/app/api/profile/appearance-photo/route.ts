import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveImage, deleteImage } from "@/lib/storage";
import { analyzePersonalAppearance } from "@/lib/prompts/personalAppearanceAnalyzer";
import { analysisToAppearanceProfileFields, personalAppearanceProfileToJSON } from "@/lib/serializers";
import { AIConfigError } from "@/lib/anthropic";

// GET returns the current user's own profile, INCLUDING the private photo
// URL — this is the one and only place that URL is ever returned. Every
// other serializer/route in the app must omit it.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.personalAppearanceProfile.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json(personalAppearanceProfileToJSON(profile, /* includePhotoUrl */ true));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "A photo is required." }, { status: 400 });
  }
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "A photo is required." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are supported." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Photo must be under 10MB." }, { status: 400 });
  }

  const existing = await db.personalAppearanceProfile.findUnique({ where: { userId: session.user.id } });

  // Replacing a photo: clean up the previous one so we don't accumulate
  // orphaned uploads every time someone re-analyzes.
  if (existing?.photoUrl) {
    await deleteImage(existing.photoUrl);
  }

  let photoUrl: string;
  try {
    photoUrl = await saveImage(session.user.id, file, "profile-photos");
  } catch (err) {
    console.error("Personal photo upload failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Photo upload failed — our storage service couldn't accept the file. Please try again shortly.", code: "IMAGE_UPLOAD_FAILED" },
      { status: 502 }
    );
  }

  await db.personalAppearanceProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, status: "ANALYZING", photoUrl },
    update: { status: "ANALYZING", photoUrl, errorMessage: null },
  });

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const analysis = await analyzePersonalAppearance(bytes.toString("base64"), file.type);
    const fields = analysisToAppearanceProfileFields(analysis);

    const profile = await db.personalAppearanceProfile.update({
      where: { userId: session.user.id },
      data: { ...fields, status: "COMPLETE", analyzedAt: new Date(), errorMessage: null },
    });

    return NextResponse.json(personalAppearanceProfileToJSON(profile, true));
  } catch (err) {
    const isConfigError = err instanceof AIConfigError;
    if (!isConfigError) console.error("Personal appearance analysis failed", err);

    await db.personalAppearanceProfile.update({
      where: { userId: session.user.id },
      data: {
        status: "FAILED",
        errorMessage: isConfigError
          ? "AI styling analysis isn't available right now."
          : "We couldn't analyze that photo. You can try again or skip this step for now.",
      },
    });

    return NextResponse.json(
      {
        error: isConfigError
          ? "AI styling analysis isn't available right now."
          : "We couldn't analyze that photo. You can try again or skip this step for now.",
        code: "APPEARANCE_ANALYSIS_FAILED",
      },
      { status: 502 }
    );
  }
}

// Deletes only the original photo, keeping the structured styling profile —
// the point of this feature is the derived recommendations, not the image.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.personalAppearanceProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile?.photoUrl) return NextResponse.json({ ok: true });

  await deleteImage(profile.photoUrl);
  await db.personalAppearanceProfile.update({
    where: { userId: session.user.id },
    data: { photoUrl: null },
  });

  return NextResponse.json({ ok: true });
}
