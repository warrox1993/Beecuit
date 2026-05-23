"use client";
import { useTransition } from "react";
import { uploadImage, deleteImage, setPrimaryImage } from "@/lib/actions/admin/images.actions";
import { Button } from "@/components/ui/button";

type Img = { id: string; url: string; isPrimary: boolean };

export function ImageUploader({ productId, images }: { productId: string; images: Img[] }) {
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {images.map((img) => (
          <div
            key={img.id}
            className={`group relative overflow-hidden rounded border ${img.isPrimary ? "border-honey ring-honey ring-2" : "border-warm-brown/20"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="aspect-square w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/50 p-1 text-xs text-white opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    await setPrimaryImage(img.id, productId);
                  })
                }
                disabled={pending || img.isPrimary}
              >
                ★
              </button>
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    await deleteImage(img.id, productId);
                  })
                }
                disabled={pending}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
      <form
        action={(fd) =>
          start(async () => {
            await uploadImage(productId, fd);
          })
        }
        encType="multipart/form-data"
      >
        <input type="file" name="file" accept="image/*" required className="text-sm" />
        <Button
          type="submit"
          disabled={pending}
          size="sm"
          className="bg-honey text-cream hover:bg-honey-dark ml-2"
        >
          Upload
        </Button>
      </form>
    </div>
  );
}
