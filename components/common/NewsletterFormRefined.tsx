"use client";
import { useId, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { subscribeToNewsletter } from "@/lib/actions/newsletter.actions";

/**
 * Refined newsletter form variant — Phase 4B + 4G validation + journal opt-in.
 *
 * Single underline input + integrated arrow submit + inline email validation
 * (Phase 4G item 27). The legacy NewsletterForm (boxed input + button) remains
 * for the Footer.
 *
 * Variant:
 * - `home` (default): primary signup, journal opt-in unchecked by default.
 * - `journal_inline`: in-article signup, journal opt-in pre-checked.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterFormRefined({
  placeholder = "ton@email.com",
  submitLabel = "S'inscrire",
  variant = "home",
}: {
  placeholder?: string;
  submitLabel?: string;
  variant?: "home" | "journal_inline";
}) {
  const locale = useLocale() as "fr" | "nl" | "en" | "de";
  const t = useTranslations("journal.newsletter");
  const optInId = useId();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [optIn, setOptIn] = useState(variant === "journal_inline");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isValidFormat = EMAIL_RE.test(email);
  const showError = touched && email.length > 0 && !isValidFormat;
  const showSuccess = touched && isValidFormat && !pending && !msg;

  const borderClass = showError
    ? "border-terracotta"
    : showSuccess
      ? "border-leaf"
      : "border-warm-brown/30 focus-within:border-honey-dark";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!isValidFormat) return;
        setMsg(null);
        start(async () => {
          const r = await subscribeToNewsletter({
            email,
            locale,
            journalOptIn: optIn,
            source: variant,
          });
          setMsg({ ok: r.success, text: r.message });
          if (r.success) {
            setEmail("");
            setTouched(false);
            setOptIn(variant === "journal_inline");
            toast.success(r.message);
          } else {
            toast.error(r.message);
          }
        });
      }}
      className="w-full"
      noValidate
    >
      <div
        className={`relative flex items-center border-b transition-colors ${borderClass}`}
      >
        <label htmlFor="newsletter-refined-email" className="sr-only">
          {placeholder}
        </label>
        <input
          id="newsletter-refined-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          aria-required="true"
          aria-invalid={showError}
          aria-describedby={showError ? "newsletter-refined-email-error" : undefined}
          className="text-warm-brown placeholder:text-warm-brown/60 flex-1 bg-transparent py-3 text-base focus:outline-none"
        />
        {/* Inline validation icon */}
        {showSuccess && (
          <svg
            viewBox="0 0 24 24"
            className="text-leaf mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden
          >
            <path d="M5 12 L 10 17 L 19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {showError && (
          <svg
            viewBox="0 0 24 24"
            className="text-terracotta mr-2 h-5 w-5 animate-[afds-shake_0.4s_ease-in-out_1]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden
          >
            <path d="M6 6 L 18 18 M 18 6 L 6 18" strokeLinecap="round" />
          </svg>
        )}
        <button
          type="submit"
          disabled={pending}
          aria-label={submitLabel}
          className="text-honey-dark hover:text-cta-primary-hover ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:opacity-50"
        >
          {pending ? (
            <span className="border-honey-dark/40 border-t-honey-dark h-4 w-4 animate-spin rounded-full border-2" />
          ) : (
            <span aria-hidden className="text-xl">
              →
            </span>
          )}
        </button>
      </div>
      <label
        htmlFor={optInId}
        className="text-warm-brown/80 mt-3 flex items-start gap-2 text-sm"
      >
        <input
          id={optInId}
          type="checkbox"
          checked={optIn}
          onChange={(e) => setOptIn(e.target.checked)}
          className="accent-honey-dark mt-1"
        />
        <span>
          {t("optInLabel")}
          <span className="text-warm-brown/60 mt-0.5 block text-xs">
            {t("optInHelp")}
          </span>
        </span>
      </label>
      {showError && (
        <p
          id="newsletter-refined-email-error"
          role="alert"
          className="text-terracotta mt-2 text-xs"
        >
          Adresse email invalide
        </p>
      )}
      {msg && !showError && (
        <p
          role={msg.ok ? "status" : "alert"}
          className={`mt-2 text-xs ${msg.ok ? "text-leaf" : "text-terracotta"}`}
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}
