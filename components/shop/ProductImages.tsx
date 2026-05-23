"use client";
import { useState } from "react";

type Img = { url: string; altText: string | null };

export function ProductImages({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="bg-cookie/40 aspect-square w-full overflow-hidden rounded-xl">
        <div className="flex h-full w-full items-center justify-center text-9xl opacity-30">🍪</div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="bg-cookie/30 aspect-square w-full overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]?.url}
          alt={images[active]?.altText ?? name}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={`bg-cookie/30 aspect-square overflow-hidden rounded-lg transition-all ${i === active ? "ring-2 ring-honey ring-offset-2" : "opacity-70 hover:opacity-100"}`}
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
