"use client";
import { useState, useTransition, useRef, useEffect, type MouseEvent } from "react";
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
  const [feedback, setFeedback] = useState<"idle" | "success" | "error">("idle");
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (feedback === "idle") return;
    const t = setTimeout(() => setFeedback("idle"), 900);
    return () => clearTimeout(t);
  }, [feedback]);

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
        setFeedback("success");
        router.refresh();
      } catch {
        toast.error("Impossible d'ajouter au panier");
        setFeedback("error");
      }
    });
  }

  const button = (
    <Button
      ref={btnRef}
      className={
        "flex-1 w-full transition-colors " +
        (feedback === "success"
          ? "bg-leaf text-cream hover:bg-leaf "
          : feedback === "error"
            ? "bg-terracotta text-cream hover:bg-terracotta animate-[afds-shake_0.4s_ease-in-out_1] "
            : "bg-honey text-cream hover:bg-honey-dark ")
      }
      disabled={pending || feedback === "success"}
      onClick={handleClick}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="border-cream/40 border-t-cream h-4 w-4 animate-spin rounded-full border-2" />
          <span>...</span>
        </span>
      ) : feedback === "success" ? (
        <span className="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path d="M5 12 L 10 17 L 19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Ajouté</span>
        </span>
      ) : (
        label
      )}
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
