import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import dynamic from "next/dynamic";
import { PageTransition } from "@/components/motion/PageTransition";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { organizationJsonLd } from "@/lib/seo/structured-data";
import { serializeJsonLd } from "@/lib/seo/json-ld";

// FlyToCart and ToastProvider are non-critical client widgets — load after hydration.
const FlyToCart = dynamic(() =>
  import("@/components/motion/FlyToCart").then((m) => ({ default: m.FlyToCart })),
);
const ToastProvider = dynamic(() =>
  import("@/components/motion/ToastProvider").then((m) => ({ default: m.ToastProvider })),
);
const CookieConsentBanner = dynamic(() =>
  import("@/components/consent/CookieConsentBanner").then((m) => ({ default: m.CookieConsentBanner })),
);
const ConsentScripts = dynamic(() =>
  import("@/components/consent/ConsentScripts").then((m) => ({ default: m.ConsentScripts })),
);

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* Sitewide Organization JSON-LD for Google Knowledge Graph. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(organizationJsonLd()),
        }}
      />
      <ConsentProvider>
        <PageTransition>{children}</PageTransition>
        <FlyToCart />
        <ToastProvider />
        <CookieConsentBanner />
        <ConsentScripts />
      </ConsentProvider>
    </NextIntlClientProvider>
  );
}
