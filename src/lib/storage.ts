import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Local-disk image storage for the MVP: files land in public/uploads/<userId>/
// and are served directly by Next.js's static file handling. Swap this out
// for a cloud provider (Vercel Blob, S3, Cloudinary) by replacing this one
// function — every caller just awaits `saveImage()` and stores the URL it
// returns, so the rest of the app doesn't need to change.
export async function saveImage(userId: string, file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", userId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${userId}/${filename}`;
}

export function fileToBase64(bytes: Buffer): string {
  return bytes.toString("base64");
}
