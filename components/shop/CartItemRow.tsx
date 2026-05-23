"use client";
import { useTransition } from "react";
import { updateQuantity, removeFromCart } from "@/lib/actions/cart.actions";
import { useRouter } from "@/i18n/navigation";
import { X } from "lucide-react";

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
    <div className="flex items-center gap-4 py-4">
      <div className="bg-cookie/30 h-20 w-20 shrink-0 overflow-hidden rounded-full">
        {primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primaryImageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl opacity-30">
            🍪
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-warm-brown font-display text-base">{name}</p>
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
        className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 rounded border bg-white px-2 py-1 text-sm focus:ring-2 focus:outline-none"
      >
        {Array.from({ length: Math.min(stockQuantity, 10) }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <p className="text-honey-dark font-display w-20 text-right text-base">{subtotalEur} €</p>
      <button
        onClick={() =>
          startTransition(async () => {
            await removeFromCart(cartItemId);
            router.refresh();
          })
        }
        disabled={pending}
        className="text-warm-brown/40 hover:text-terracotta transition-colors"
        aria-label="Retirer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
