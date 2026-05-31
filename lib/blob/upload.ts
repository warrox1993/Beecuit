import "server-only";
import { put } from "@vercel/blob";
import { env } from "@/lib/env";

// Server-side allow-list — never trust the client's `accept` attribute. SVG is
// deliberately excluded: an SVG served from the public blob origin can carry
// inline scripts (stored XSS). The extension is derived from the validated MIME,
// not the user-supplied filename, and `contentType` is forced so the blob is
// never served as text/html or image/svg+xml.
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    throw new Error(`Type d'image non autorisé : ${file.type || "inconnu"}`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image trop volumineuse (max ${MAX_IMAGE_BYTES / 1024 / 1024} Mo)`);
  }
  const key = `products/${productId}/${Date.now()}.${ext}`;
  const blob = await put(key, file, {
    access: "public",
    contentType: file.type,
    token: env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}
