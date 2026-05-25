"use client";
import { useState, useTransition } from "react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter.actions";

/**
 * Refined newsletter form variant — Phase 4B.
 *
 * Single underline input + integrated arrow submit.  Designed for the
 * editorial NewsletterCTA oval block. The legacy NewsletterForm (boxed
 * input + button) remains for the Footer.
 */
export function NewsletterFormRefined({
  placeholder = "ton@email.com",
  submitLabel = "S'inscrire",
}: {
  placeholder?: string;
  submitLabel?: string;
}) {
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await subscribeToNewsletter({ email });
          setMsg({ ok: r.success, text: r.message });
          if (r.success) setEmail("");
        });
      }}
      className="w-full"
    >
      <div className="border-warm-brown/30 focus-within:border-honey-dark relative flex items-center border-b transition-colors">
        <label htmlFor="newsletter-refined-email" className="sr-only">
          {placeholder}
        </label>
        <input
          id="newsletter-refined-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          className="text-warm-brown placeholder:text-warm-brown/40 flex-1 bg-transparent py-3 text-base focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={submitLabel}
          className="text-honey-dark hover:text-cta-primary-hover ml-3 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:opacity-50"
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
      {msg && (
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
