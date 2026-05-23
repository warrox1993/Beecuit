import "server-only";
import { put } from "@vercel/blob";
import { env } from "@/lib/env";

export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `products/${productId}/${Date.now()}.${ext}`;
  const blob = await put(key, file, { access: "public", token: env.BLOB_READ_WRITE_TOKEN });
  return blob.url;
}
