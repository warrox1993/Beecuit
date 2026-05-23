"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { subscribeToNewsletter } from "@/lib/actions/newsletter.actions";

export function NewsletterForm() {
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
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 flex-1 rounded-md border bg-white px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        />
        <Button
          type="submit"
          disabled={pending}
          className="bg-honey text-cream hover:bg-honey-dark"
        >
          {pending ? "..." : "S'inscrire"}
        </Button>
      </div>
      {msg && <p className={`text-xs ${msg.ok ? "text-leaf" : "text-terracotta"}`}>{msg.text}</p>}
    </form>
  );
}
