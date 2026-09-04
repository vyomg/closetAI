import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userToStyleProfile, userToLearnedPreferences } from "@/lib/serializers";

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().nullable().optional(),
  preferredStyles: z.array(z.string()).optional(),
  usualClothing: z.string().optional(),
  occasions: z.array(z.string()).optional(),
  fitPreference: z.string().optional(),
  colorsLove: z.array(z.string()).optional(),
  colorsAvoid: z.array(z.string()).optional(),
  shoePreference: z.array(z.string()).optional(),
  adventurousness: z.number().min(1).max(5).optional(),
  comfortImportance: z.number().min(1).max(5).optional(),
  fashionImportance: z.number().min(1).max(5).optional(),
  formalImportance: z.number().min(1).max(5).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    name: user.name,
    email: user.email,
    onboarded: user.onboarded,
    ...userToStyleProfile(user),
    learnedPreferences: userToLearnedPreferences(user),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile update." }, { status: 400 });
  const d = parsed.data;

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(d.name !== undefined ? { name: d.name } : {}),
      ...(d.city !== undefined ? { city: d.city } : {}),
      ...(d.preferredStyles !== undefined ? { preferredStyles: JSON.stringify(d.preferredStyles) } : {}),
      ...(d.usualClothing !== undefined ? { usualClothing: d.usualClothing } : {}),
      ...(d.occasions !== undefined ? { occasions: JSON.stringify(d.occasions) } : {}),
      ...(d.fitPreference !== undefined ? { fitPreference: d.fitPreference } : {}),
      ...(d.colorsLove !== undefined ? { colorsLove: JSON.stringify(d.colorsLove) } : {}),
      ...(d.colorsAvoid !== undefined ? { colorsAvoid: JSON.stringify(d.colorsAvoid) } : {}),
      ...(d.shoePreference !== undefined ? { shoePreference: JSON.stringify(d.shoePreference) } : {}),
      ...(d.adventurousness !== undefined ? { adventurousness: d.adventurousness } : {}),
      ...(d.comfortImportance !== undefined ? { comfortImportance: d.comfortImportance } : {}),
      ...(d.fashionImportance !== undefined ? { fashionImportance: d.fashionImportance } : {}),
      ...(d.formalImportance !== undefined ? { formalImportance: d.formalImportance } : {}),
    },
  });

  return NextResponse.json({ ...userToStyleProfile(user), name: user.name });
}
