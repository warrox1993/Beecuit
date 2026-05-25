"use server";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";

const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const MAX_SIZE = {
  image: 10 * 1024 * 1024, // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
};

export async function uploadToBlob(
  formData: FormData,
): Promise<{ url: string; pathname: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Forbidden");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file");
  if (!ALLOWED_MIMES.has(file.type)) {
    throw new Error(`Mime not allowed: ${file.type}`);
  }
  const limit = file.type.startsWith("image/") ? MAX_SIZE.image : MAX_SIZE.video;
  if (file.size > limit) {
    throw new Error(`File too large (max ${limit / 1024 / 1024} MB)`);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = `${Date.now()}-${randomUUID()}.${ext}`;
  const blob = await put(`journal/${safeName}`, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });
  return { url: blob.url, pathname: blob.pathname };
}
