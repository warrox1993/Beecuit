import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";

const TILES = [
  {
    src: "https://images.unsplash.com/photo-1568271675068-f76a83a1e2d6?fm=jpg&q=75&w=800&auto=format&fit=crop",
    alt: "Tasse de thé et biscuits sur table en bois",
  },
  {
    src: "https://images.unsplash.com/photo-1449049607083-e29383d58423?fm=jpg&q=75&w=800&auto=format&fit=crop",
    alt: "Boîte de biscuits cadeau ouverte",
  },
  {
    src: "https://images.unsplash.com/photo-1486893732792-ab0085cb2d43?fm=jpg&q=75&w=800&auto=format&fit=crop",
    alt: "Biscuits artisanaux dorés en gros plan",
  },
  {
    src: "https://images.unsplash.com/photo-1623334044303-241021148842?fm=jpg&q=75&w=800&auto=format&fit=crop",
    alt: "Pâtisserie artisanale belge",
  },
] as const;

export async function InstagramGrid() {
  const t = await getTranslations("home");
  return (
    <Section py="md">
      <Container>
        <div className="mb-12 text-center">
          <Eyebrow>{t("instagramEyebrow")}</Eyebrow>
          <Heading as="h2" size="h2" className="mt-3">
            {t("instagramTitle")}{" "}
            <a
              href="https://instagram.com/aufildessaveurs"
              className="text-honey-dark underline underline-offset-4"
            >
              {t("instagramHandle")}
            </a>
          </Heading>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {TILES.map((tile, i) => (
            <a
              key={i}
              href="https://instagram.com/aufildessaveurs"
              className="relative aspect-square overflow-hidden rounded-lg bg-cookie/40 transition-opacity hover:opacity-80"
              aria-label={`Instagram post ${i + 1}`}
            >
              <Image
                src={tile.src}
                alt={tile.alt}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            </a>
          ))}
        </div>
      </Container>
    </Section>
  );
}
