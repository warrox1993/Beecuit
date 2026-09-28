"use client";
import { useState } from "react";

export function GiftCardReveal({ code }: { code: string }) {
  const [shown, setShown] = useState(false);
  const masked = code.replace(/[0-9A-F]/g, "*");
  return (
    <div className="flex items-center gap-2">
      <code className="font-mono text-sm tracking-wider">{shown ? code : masked}</code>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="text-warm-brown/60 hover:text-honey-dark text-xs underline"
      >
        {shown ? "Masquer" : "Voir"}
      </button>
      {shown && (
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-warm-brown/60 hover:text-honey-dark text-xs underline"
        >
          Copier
        </button>
      )}
    </div>
  );
}
