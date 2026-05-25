"use client";
import { useState, useTransition, useRef, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/lib/actions/cart.actions";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";

type Metadata = {
  type?: "coffret";
  giftMessage?: string | null;
  packagingTier?: "standard" | "premium";
};

export function AddToCartButton({
  productId,
  label,
  outOfStock,
  hideQuantitySelector = false,
  getMetadata,
  toastMessage = "Ajouté au panier",
}: {
  productId: string;
  label: string;
  outOfStock: boolean;
  hideQuantitySelector?: boolean;
  getMetadata?: () => Metadata;
  toastMessage?: string;
}) {
  const [qty, setQty] = useState(1);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement | null>(null);

  if (outOfStock) {
    return (
      <Button disabled className="w-full">
        Épuisé
      </Button>
    );
  }

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    // Dispatch fly-to-cart event with click coordinates
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const fromX = rect.left + rect.width / 2;
    const fromY = rect.top + rect.height / 2;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("afds:fly-to-cart", { detail: { fromX, fromY } }),
      );
    }
    startTransition(async () => {
      try {
        await addToCart({ productId, quantity: qty, metadata: getMetadata?.() });
        toast.success(toastMessage);
        router.refresh();
      } catch {
        toast.error("Impossible d'ajouter au panier");
      }
    });
  }

  const button = (
    <Button
      ref={btnRef}
      className="bg-honey text-cream hover:bg-honey-dark flex-1 w-full"
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? "…" : label}
    </Button>
  );

  if (hideQuantitySelector) {
    return button;
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
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      {button}
    </div>
  );
}
