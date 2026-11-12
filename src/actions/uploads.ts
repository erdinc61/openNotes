"use server";

import { randomUUID } from "crypto";
import { db } from "@/db";
import { upload } from "@/db/schema";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export async function uploadImage(formData: FormData): Promise<{ url: string }> {
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new Error("No file provided");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`File type not allowed: ${file.type}`);
  }

  const id = randomUUID();
  const arrayBuffer = await file.arrayBuffer();
  const data = Buffer.from(arrayBuffer);

  await db.insert(upload).values({
    id,
    userId: "", // filled by auth in a real scenario, but images are public by URL
    data,
    mimeType: file.type,
    createdAt: new Date(),
  });

  return { url: `/api/uploads/${id}` };
}
