"use client";
import { useTransition } from "react";
import { adminUpdateMessageStatus } from "@/lib/actions/contact.actions";

const OPTIONS: { value: string; label: string }[] = [
  { value: "new", label: "Nouveau" },
  { value: "read", label: "Lu" },
  { value: "archived", label: "Archivé" },
];

export function MessageStatusActions({ id, current }: { id: string; current: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => (
        <form key={o.value} action={(fd) => start(() => adminUpdateMessageStatus(fd).then(() => {}))}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={o.value} />
          <button
            type="submit" disabled={pending || current === o.value}
            className={`rounded-full px-3 py-1.5 text-sm ${current === o.value ? "bg-amber-600 text-white" : "border border-amber-300 text-amber-800 hover:bg-amber-50"}`}
          >
            {o.label}
          </button>
        </form>
      ))}
    </div>
  );
}
