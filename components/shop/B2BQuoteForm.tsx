"use client";

import { useState, useTransition } from "react";
import { createB2BQuoteRequest } from "@/lib/actions/b2b.actions";

const BUDGET_OPTIONS = [
  "< 500 €",
  "500 – 2 000 €",
  "2 000 – 10 000 €",
  "> 10 000 €",
  "Pas de limite définie",
];

export function B2BQuoteForm() {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const input = {
      companyName: String(fd.get("companyName") ?? ""),
      contactName: String(fd.get("contactName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      vatNumber: String(fd.get("vatNumber") ?? ""),
      requestedProducts: String(fd.get("requestedProducts") ?? ""),
      targetQuantity: fd.get("targetQuantity") ? Number(fd.get("targetQuantity")) : undefined,
      targetDeliveryDate: String(fd.get("targetDeliveryDate") ?? ""),
      budgetRange: String(fd.get("budgetRange") ?? ""),
      message: String(fd.get("message") ?? ""),
      locale: "fr" as const,
      _hp: String(fd.get("_hp") ?? ""),
    };
    setError(null);
    startTransition(async () => {
      const res = await createB2BQuoteRequest(input);
      if (res.ok) {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
      } else {
        setError(res.error);
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
        <h3 className="mb-2 text-2xl font-semibold text-amber-900">Demande envoyée 🐝</h3>
        <p className="text-amber-800">
          Merci ! Nous revenons vers vous sous 48h ouvrées avec un devis personnalisé.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input
        type="text"
        name="_hp"
        tabIndex={-1}
        autoComplete="off"
        style={{
          position: "absolute",
          left: -10000,
          height: 0,
          width: 0,
          overflow: "hidden",
        }}
        aria-hidden="true"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Entreprise *</span>
          <input
            name="companyName"
            required
            maxLength={200}
            className="w-full rounded border border-amber-200 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Nom du contact *</span>
          <input
            name="contactName"
            required
            maxLength={200}
            className="w-full rounded border border-amber-200 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email *</span>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded border border-amber-200 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Téléphone</span>
          <input name="phone" className="w-full rounded border border-amber-200 px-3 py-2" />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium">N° TVA (optionnel)</span>
          <input
            name="vatNumber"
            className="w-full rounded border border-amber-200 px-3 py-2"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Quels produits / quantités ? *</span>
        <textarea
          name="requestedProducts"
          required
          minLength={10}
          rows={4}
          placeholder="Ex : 200 coffrets Découverte pour notre AGM de décembre"
          className="w-full rounded border border-amber-200 px-3 py-2"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Quantité visée</span>
          <input
            type="number"
            name="targetQuantity"
            min={1}
            className="w-full rounded border border-amber-200 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Date de livraison</span>
          <input
            type="date"
            name="targetDeliveryDate"
            className="w-full rounded border border-amber-200 px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Budget</span>
          <select
            name="budgetRange"
            className="w-full rounded border border-amber-200 px-3 py-2"
          >
            <option value="">—</option>
            {BUDGET_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Message libre</span>
        <textarea
          name="message"
          rows={3}
          className="w-full rounded border border-amber-200 px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Demander mon devis"}
      </button>
    </form>
  );
}
