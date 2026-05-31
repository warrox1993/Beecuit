import { getTranslations } from "next-intl/server";

export async function ContactFaq() {
  const t = await getTranslations("contact");
  const items = ["order", "b2b", "press", "delivery"] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((k) => (
        <div key={k} className="border-warm-brown/10 rounded-xl border bg-white p-5">
          <h3 className="text-warm-brown text-sm font-semibold">{t(`faq_${k}_title` as Parameters<typeof t>[0])}</h3>
          <p className="text-warm-brown/70 mt-1.5 text-sm leading-relaxed">{t(`faq_${k}_body` as Parameters<typeof t>[0])}</p>
        </div>
      ))}
    </div>
  );
}
