"use client";
import { useTransition } from "react";
import { updateQuantity, removeFromCart } from "@/lib/actions/cart.actions";
import { useRouter } from "@/i18n/navigation";

export function CartItemRow({
  cartItemId,
  name,
  unitPriceCents,
  quantity,
  stockQuantity,
  primaryImageUrl,
}: {
  cartItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  stockQuantity: number;
  primaryImageUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const subtotalEur = ((unitPriceCents * quantity) / 100).toFixed(2);

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="bg-soft-rose h-16 w-16 overflow-hidden rounded">
        {primaryImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primaryImageUrl} alt={name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-warm-brown text-sm font-medium">{name}</p>
        <p className="text-warm-brown/60 text-xs">{(unitPriceCents / 100).toFixed(2)} €</p>
      </div>
      <select
        value={quantity}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await updateQuantity({ cartItemId, quantity: Number(e.target.value) });
            router.refresh();
          })
        }
        className="border-warm-brown/20 rounded border bg-white px-2 py-1 text-sm"
      >
        {Array.from({ length: Math.min(stockQuantity, 10) }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <p className="text-honey-dark w-16 text-right font-mono text-sm">{subtotalEur} €</p>
      <button
        onClick={() =>
          startTransition(async () => {
            await removeFromCart(cartItemId);
            router.refresh();
          })
        }
        disabled={pending}
        className="text-terracotta/70 hover:text-terracotta px-2 text-lg"
        aria-label="Retirer"
      >
        ×
      </button>
    </div>
  );
}
