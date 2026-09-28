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
    <div className="border-cookie/40 my-3 rounded-xl border bg-white p-4">
      <label className="text-warm-brown mb-2 block text-sm font-semibold">
        ✉️ Message cadeau <span className="text-warm-brown/60 font-normal">(optionnel)</span>
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
        className="border-cookie/30 focus:border-honey w-full rounded border p-2 text-sm focus:outline-none"
      />
      <div className="text-warm-brown/60 mt-1 text-right text-xs">{v.length}/200</div>
    </div>
  );
}
