import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

export async function saveImage(
  userId: string,
  file: File
): Promise<string> {
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const filename = `${randomUUID()}.${ext}`;

  const blob = await put(
    `uploads/${userId}/${filename}`,
    file,
{
  access: "public",
  addRandomSuffix: false,
  oidcToken: process.env.VERCEL_OIDC_TOKEN,
  storeId: process.env.BLOB_STORE_ID,
}
  );

  return blob.url;
}

export function fileToBase64(bytes: Buffer): string {
  return bytes.toString("base64");
}