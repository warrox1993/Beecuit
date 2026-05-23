"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/actions/cart.actions";
import { useRouter } from "@/i18n/navigation";

export function AddToCartButton({
  productId,
  label,
  outOfStock,
}: {
  productId: string;
  label: string;
  outOfStock: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (outOfStock) {
    return <Button disabled className="w-full">Épuisé</Button>;
  }

  return (
    <div className="flex gap-3">
      <select
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        className="border-warm-brown/20 rounded-md border bg-white px-3 py-2"
        aria-label="Quantité"
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <Button
        className="bg-honey text-cream hover:bg-honey-dark flex-1"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await addToCart({ productId, quantity: qty });
            router.refresh();
          })
        }
      >
        {pending ? "…" : label}
      </Button>
    </div>
  );
}
