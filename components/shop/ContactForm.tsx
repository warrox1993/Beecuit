"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { submitContactMessage } from "@/lib/actions/contact.actions";
import { Button } from "@/components/ui/button";

const REASONS = ["order", "b2b", "press", "delivery", "other"] as const;

export function ContactForm({ locale }: { locale: string }) {
  const t = useTranslations("contact");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark rounded-xl border p-6 text-sm" role="status">
        {t("formSuccess")}
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        start(async () => {
          const res = await submitContactMessage(fd);
          if (res.ok) setDone(true);
          else setError(t(`formError_${res.error}` as Parameters<typeof t>[0]));
        });
      }}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot anti-spam : cache, jamais rempli par un humain */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label>
          Societe
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="block">
        <span className="text-warm-brown text-sm">{t("formName")}</span>
        <input
          type="text" name="name" required minLength={2} maxLength={100} autoComplete="name"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("formEmail")}</span>
        <input
          type="email" name="email" required maxLength={254} autoComplete="email"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("formReason")}</span>
        <select
          name="reason" required defaultValue="order"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>{t(`reason_${r}` as Parameters<typeof t>[0])}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("formMessage")}</span>
        <textarea
          name="message" required minLength={10} maxLength={2000} rows={5}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>

      {error && <p role="alert" className="text-terracotta text-sm">{error}</p>}
      <Button type="submit" disabled={pending}>{t("formSubmit")}</Button>
    </form>
  );
}
