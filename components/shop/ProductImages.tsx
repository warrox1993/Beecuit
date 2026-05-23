"use client";
import { useState } from "react";

type Img = { url: string; altText: string | null };

export function ProductImages({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return <div className="bg-soft-rose aspect-square w-full" />;
  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[active]?.url}
        alt={images[active]?.altText ?? name}
        className="aspect-square w-full rounded-lg object-cover"
      />
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={`aspect-square overflow-hidden rounded ${i === active ? "ring-honey ring-2" : ""}`}
              aria-label={`Image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
