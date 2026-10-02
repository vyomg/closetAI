import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";

// Vercel Blob auth: prefer a static BLOB_READ_WRITE_TOKEN when one is
// configured (Vercel's standard, non-expiring token for a Blob store —
// generated once from the dashboard and never rotates on its own). Fall back
// to the OIDC identity-token path (VERCEL_OIDC_TOKEN + BLOB_STORE_ID) when no
// static token is present, which is exactly the previous/existing behavior.
// This is purely additive: nothing changes for anyone not using a static
// token, and it fixes the recurring "Access denied" failures caused by the
// OIDC token's short lifespan once a static token is added to .env.local.
function blobAuthOptions() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return { token: process.env.BLOB_READ_WRITE_TOKEN };
  }
  return {
    oidcToken: process.env.VERCEL_OIDC_TOKEN,
    storeId: process.env.BLOB_STORE_ID,
  };
}

// `pathPrefix` defaults to "uploads" (wardrobe clothing images, unchanged
// behavior for every existing call site). The personal appearance photo uses
// a distinct "profile-photos" prefix — see src/app/api/profile/appearance-photo/route.ts —
// so it's trivially distinguishable from shareable wardrobe images even
// though both are technically public Blob URLs (Vercel Blob has no private/
// signed-URL mode as of the installed SDK version); real privacy for that
// path comes from never including its URL in any non-owner-facing response.
export async function saveImage(
  userId: string,
  file: File,
  pathPrefix: string = "uploads"
): Promise<string> {
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const filename = `${randomUUID()}.${ext}`;

  const blob = await put(`${pathPrefix}/${userId}/${filename}`, file, {
    access: "public",
    addRandomSuffix: false,
    ...blobAuthOptions(),
  });

  return blob.url;
}

export function fileToBase64(bytes: Buffer): string {
  return bytes.toString("base64");
}

// Turns a base64 image (e.g. Gemini's inlineData image output) into a File
// so it can go through the same saveImage() path as a user upload.
export function base64ToFile(base64: string, mimeType: string, filename: string): File {
  const bytes = Buffer.from(base64, "base64");
  return new File([new Uint8Array(bytes)], filename, { type: mimeType });
}

// Cleanup for partial upload failures — e.g. the Blob upload succeeds but a
// later step (AI analysis, database save) genuinely fails, which would
// otherwise leave an orphaned file in storage with no wardrobe record
// pointing at it. Best-effort: if the delete itself fails, we log and move
// on rather than throwing over a cleanup step during error handling.
export async function deleteImage(url: string): Promise<void> {
  try {
    await del(url, blobAuthOptions());
  } catch (err) {
    console.error("Failed to clean up orphaned Blob upload:", err instanceof Error ? err.message : err);
  }
}