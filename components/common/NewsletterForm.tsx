"use client";
import { useId, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { subscribeToNewsletter } from "@/lib/actions/newsletter.actions";

export function NewsletterForm() {
  const locale = useLocale() as "fr" | "nl" | "en" | "de";
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await subscribeToNewsletter({
            email,
            locale,
            journalOptIn: false,
            source: "home",
          });
          setMsg({ ok: r.success, text: r.message });
          if (r.success) {
            setEmail("");
            toast.success(r.message);
          } else {
            toast.error(r.message);
          }
        });
      }}
      className="flex flex-col gap-2"
      aria-busy={pending || undefined}
    >
      <label htmlFor={inputId} className="sr-only">
        Adresse email
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="email"
          required
          aria-required="true"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          className="border-warm-brown/20 focus-visible:border-honey-dark focus-visible:ring-honey-dark/30 flex-1 rounded-md border bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <Button
          type="submit"
          disabled={pending}
          aria-busy={pending || undefined}
          className="bg-honey text-cream hover:bg-honey-dark focus-visible:ring-2 focus-visible:ring-honey-dark/40"
        >
          {pending ? "..." : "S'inscrire"}
        </Button>
      </div>
      {msg && (
        <p
          role={msg.ok ? "status" : "alert"}
          className={`text-xs ${msg.ok ? "text-leaf" : "text-terracotta"}`}
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}
