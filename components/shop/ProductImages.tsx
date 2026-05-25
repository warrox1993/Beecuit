"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

type Img = { url: string; altText: string | null };

/**
 * ProductImages — Au Fil des Saveurs (Phase 4G).
 *
 * Main image + thumbnails grid + lightbox modal (Radix Dialog via Sheet)
 * for the zoomed view. Click the main image to open the lightbox.
 */
export function ProductImages({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="bg-cookie/40 aspect-square w-full overflow-hidden rounded-2xl">
        <div className="flex h-full w-full items-center justify-center text-9xl opacity-30">🍪</div>
      </div>
    );
  }

  const activeImg = images[active];

  return (
    <div className="space-y-4">
      <Sheet open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Agrandir l'image"
            className="bg-cookie/30 group relative block aspect-square w-full overflow-hidden rounded-2xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImg?.url}
              alt={activeImg?.altText ?? name}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            />
            <span
              aria-hidden
              className="bg-cream-light/85 text-warm-brown absolute right-3 bottom-3 inline-flex h-9 w-9 items-center justify-center rounded-full opacity-0 shadow-md transition-opacity group-hover:opacity-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
                <path d="M11 8 V14 M8 11 H14" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="bg-brand-chocolate/95 !w-full !max-w-none !border-0 p-0 backdrop-blur-md"
        >
          <SheetTitle className="sr-only">Photo de {name}</SheetTitle>
          <div className="flex h-full w-full items-center justify-center p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImg?.url}
              alt={activeImg?.altText ?? name}
              className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </SheetContent>
      </Sheet>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              className={`bg-cookie/30 aspect-square overflow-hidden rounded-lg transition-all ${i === active ? "ring-honey-dark ring-2 ring-offset-2" : "opacity-70 hover:opacity-100"}`}
              aria-label={`Image ${i + 1}`}
              aria-pressed={i === active}
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
