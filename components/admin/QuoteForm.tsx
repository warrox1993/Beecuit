"use client";

import { useState, useTransition } from "react";
import { adminSetQuote } from "@/lib/actions/b2b.actions";

export function QuoteForm({
  quoteId,
  defaultEmail,
}: {
  quoteId: string;
  defaultEmail: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amountEuros = Number(fd.get("amount") ?? 0);
    if (!amountEuros || amountEuros <= 0) {
      setError("Montant invalide");
      return;
    }
    if (
      !confirm(
        `Envoyer un devis de ${amountEuros.toLocaleString("fr-BE", {
          style: "currency",
          currency: "EUR",
        })} à ${defaultEmail} ?`,
      )
    ) {
      return;
    }
    setError(null);
    start(async () => {
      const res = await adminSetQuote({
        quoteId,
        quotedAmountCents: Math.round(amountEuros * 100),
        quoteDescription: String(fd.get("description") ?? ""),
        adminNotes: String(fd.get("adminNotes") ?? ""),
        shippingAddress: {
          line1: String(fd.get("line1") ?? ""),
          line2: String(fd.get("line2") ?? ""),
          postalCode: String(fd.get("postalCode") ?? ""),
          city: String(fd.get("city") ?? ""),
          country: String(fd.get("country") ?? "BE"),
          firstName: "",
          lastName: "",
          phone: "",
        },
      });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Montant TTC (€)</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded border border-amber-200 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Pays</span>
          <input
            name="country"
            defaultValue="BE"
            maxLength={2}
            className="w-full rounded border border-amber-200 px-3 py-2"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Description (visible client)</span>
        <textarea
          name="description"
          required
          rows={4}
          className="w-full rounded border border-amber-200 px-3 py-2"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium">Adresse ligne 1</span>
          <input
            name="line1"
            required
            className="w-full rounded border border-amber-200 px-3 py-2"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium">Adresse ligne 2</span>
          <input name="line2" className="w-full rounded border border-amber-200 px-3 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Code postal</span>
          <input
            name="postalCode"
            required
            className="w-full rounded border border-amber-200 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Ville</span>
          <input
            name="city"
            required
            className="w-full rounded border border-amber-200 px-3 py-2"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Notes internes (non visible client)</span>
        <textarea
          name="adminNotes"
          rows={2}
          className="w-full rounded border border-amber-200 px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-amber-600 px-5 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Envoyer le devis"}
      </button>
    </form>
  );
}
