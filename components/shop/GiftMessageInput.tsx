"use client";
import { useState } from "react";

export function GiftMessageInput({
  value,
  onChange,
  name = "giftMessage",
}: {
  value?: string | null;
  onChange?: (v: string) => void;
  name?: string;
}) {
  const [v, setV] = useState(value ?? "");
  return (
    <div className="bg-white border border-cookie/40 rounded-xl p-4 my-3">
      <label className="block text-sm font-semibold mb-2 text-warm-brown">
        ✉️ Message cadeau{" "}
        <span className="font-normal text-warm-brown/60">(optionnel)</span>
      </label>
      <textarea
        name={name}
        value={v}
        onChange={(e) => {
          setV(e.target.value);
          onChange?.(e.target.value);
        }}
        maxLength={200}
        rows={3}
        placeholder="Joyeux anniversaire Mamie..."
        className="w-full border border-cookie/30 rounded p-2 text-sm focus:border-honey focus:outline-none"
      />
      <div className="text-xs text-warm-brown/60 text-right mt-1">
        {v.length}/200
      </div>
    </div>
  );
}
