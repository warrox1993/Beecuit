import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { StoryTeaser } from "@/components/home/StoryTeaser";
import { CoffretsTeaser } from "@/components/home/CoffretsTeaser";
import { InstagramGrid } from "@/components/home/InstagramGrid";
import { NewsletterCTA } from "@/components/home/NewsletterCTA";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero locale={locale} />
      <FeaturedProducts locale={locale} />
      <StoryTeaser />
      <CoffretsTeaser />
      <InstagramGrid />
      <NewsletterCTA />
    </>
  );
}
