import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { StoryTeaser } from "@/components/home/StoryTeaser";
import { CoffretsTeaser } from "@/components/home/CoffretsTeaser";
import { JournalFeatured } from "@/components/journal/JournalFeatured";
import { InstagramGrid } from "@/components/home/InstagramGrid";
import { NewsletterCTA } from "@/components/home/NewsletterCTA";
import { Reveal } from "@/components/motion/Reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.home" });
  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "",
    locale,
  });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      {/* Hero rendered without Reveal — above the fold should not flicker */}
      <Hero locale={locale} />
      <Reveal>
        <FeaturedProducts locale={locale} />
      </Reveal>
      <Reveal delay={0.05}>
        <StoryTeaser />
      </Reveal>
      <Reveal delay={0.08}>
        <JournalFeatured locale={locale} />
      </Reveal>
      <Reveal delay={0.1}>
        <CoffretsTeaser />
      </Reveal>
      <Reveal delay={0.05}>
        <InstagramGrid />
      </Reveal>
      <Reveal delay={0.05}>
        <NewsletterCTA />
      </Reveal>
    </>
  );
}
