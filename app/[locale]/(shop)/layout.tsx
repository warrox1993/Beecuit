import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("a11y");
  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip-to-content link — visible on focus only */}
      <a
        href="#main"
        className="bg-honey-dark text-cream focus:ring-honey-dark/50 sr-only fixed top-3 left-3 z-[60] rounded-full px-4 py-2 text-sm font-medium focus:not-sr-only focus:ring-4 focus:outline-none"
      >
        {t("skipToContent")}
      </a>
      <Header locale={locale} />
      <main id="main" tabIndex={-1} className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      <Footer locale={locale} />
      <MobileBottomNav />
    </div>
  );
}
