"use client";
import { useState, useMemo } from "react";
import { CoffretBreakdown } from "./CoffretBreakdown";
import { GiftMessageInput } from "./GiftMessageInput";
import { PackagingTierSelector } from "./PackagingTierSelector";
import { AddToCartButton } from "./AddToCartButton";
import { PREMIUM_PACKAGING_SURCHARGE_CENTS } from "@/lib/coffret/constants";
import type { getCoffretBySlug } from "@/lib/queries/catalog";

type Coffret = NonNullable<Awaited<ReturnType<typeof getCoffretBySlug>>>;

export function CoffretDetailClient({ coffret }: { coffret: Coffret }) {
  const [giftMessage, setGiftMessage] = useState<string>("");
  const [packagingTier, setPackagingTier] = useState<"standard" | "premium">("standard");

  const finalCents = useMemo(() => {
    return (
      coffret.price.totalCents +
      (packagingTier === "premium" ? PREMIUM_PACKAGING_SURCHARGE_CENTS : 0)
    );
  }, [coffret.price.totalCents, packagingTier]);

  const disabled = !coffret.availability.available;
  const totalUnits = coffret.price.breakdown.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="space-y-4">
      <p className="text-warm-brown/60 text-xs tracking-widest uppercase">
        Coffret · {totalUnits} biscuits
      </p>
      <h1 className="font-display text-warm-brown text-4xl">{coffret.name}</h1>
      <p className="text-warm-brown/80">{coffret.shortDescription}</p>

      <CoffretBreakdown price={coffret.price} />

      <GiftMessageInput value={giftMessage} onChange={setGiftMessage} />
      <PackagingTierSelector value={packagingTier} onChange={setPackagingTier} />

      {disabled && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Temporairement indisponible
        </div>
      )}

      <AddToCartButton
        productId={coffret.id}
        outOfStock={disabled}
        hideQuantitySelector
        label={`Ajouter au panier — ${(finalCents / 100).toFixed(2).replace(".", ",")} €`}
        getMetadata={() => ({
          type: "coffret",
          giftMessage: giftMessage.trim() ? giftMessage.trim() : null,
          packagingTier,
        })}
      />
    </div>
  );
}
