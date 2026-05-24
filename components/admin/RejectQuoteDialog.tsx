"use client";

import { useState, useTransition } from "react";
import { adminRejectQuote } from "@/lib/actions/b2b.actions";

export function RejectQuoteDialog({ quoteId }: { quoteId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!reason.trim()) {
      setError("Motif requis");
      return;
    }
    start(async () => {
      const res = await adminRejectQuote({ quoteId, reason: reason.trim() });
      if (!res.ok) setError(res.error);
      else setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
      >
        Refuser
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-3 text-lg font-semibold">Refuser le devis</h3>
        <p className="mb-3 text-sm text-gray-600">
          Le motif est envoyé au client par email.
        </p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Ex : hors zone de livraison"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="rounded px-4 py-2 text-sm">
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {pending ? "Envoi…" : "Confirmer le refus"}
          </button>
        </div>
      </div>
    </div>
  );
}
