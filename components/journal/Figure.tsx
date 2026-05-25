import Image from "next/image";

export function Figure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  return (
    <figure className="my-6">
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={900}
        className="rounded"
        sizes="(min-width: 768px) 720px, 100vw"
      />
      {caption && (
        <figcaption className="text-warm-brown/60 mt-2 text-center text-sm italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
