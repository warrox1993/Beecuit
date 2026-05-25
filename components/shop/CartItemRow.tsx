"use client";
import { useState, useTransition } from "react";
import {
  updateQuantity,
  removeFromCart,
  updateGiftMessage,
} from "@/lib/actions/cart.actions";
import { useRouter } from "@/i18n/navigation";
import { X } from "lucide-react";

type Metadata =
  | {
      type?: "coffret";
      giftMessage?: string | null;
      packagingTier?: "standard" | "premium";
    }
  | {
      type: "gift_card";
      recipientEmail: string;
      recipientName: string | null;
      message: string | null;
      deliveryAt: string;
    }
  | null;

export function CartItemRow({
  cartItemId,
  name,
  unitPriceCents,
  quantity,
  stockQuantity,
  primaryImageUrl,
  metadata,
}: {
  cartItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  stockQuantity: number;
  primaryImageUrl: string | null;
  metadata?: Metadata;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const subtotalEur = ((unitPriceCents * quantity) / 100).toFixed(2);
  const isCoffret = metadata && "packagingTier" in metadata;
  const isGiftCard = metadata && "type" in metadata && metadata.type === "gift_card";

  return (
    <div className="flex flex-col gap-1 py-4">
      <div className="flex items-center gap-4">
        <div className="bg-cookie/30 h-20 w-20 shrink-0 overflow-hidden rounded-full">
          {primaryImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImageUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl opacity-30">
              {isGiftCard ? "🎁" : isCoffret ? "📦" : "🍪"}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-warm-brown font-display text-base">{name}</p>
          <p className="text-warm-brown/60 text-xs">
            {(unitPriceCents / 100).toFixed(2)} €
            {isCoffret && "packagingTier" in metadata && metadata.packagingTier === "premium" && (
              <span className="ml-2 inline-block bg-honey/20 text-honey-dark px-2 py-0.5 rounded">
                📦 Emballage premium
              </span>
            )}
          </p>
        </div>
        {isCoffret || isGiftCard ? (
          <span className="text-warm-brown/70 text-sm px-2">×1</span>
        ) : (
          <select
            value={quantity}
            disabled={pending}
            onChange={(e) =>
              startTransition(async () => {
                await updateQuantity({
                  cartItemId,
                  quantity: Number(e.target.value),
                });
                router.refresh();
              })
            }
            className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 rounded border bg-white px-2 py-1 text-sm focus:ring-2 focus:outline-none"
          >
            {Array.from(
              { length: Math.min(stockQuantity, 10) },
              (_, i) => i + 1,
            ).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
        <p className="text-honey-dark font-display w-20 text-right text-base">
          {subtotalEur} €
        </p>
        <button
          onClick={() =>
            startTransition(async () => {
              await removeFromCart(cartItemId);
              router.refresh();
            })
          }
          disabled={pending}
          className="text-warm-brown/65 hover:text-terracotta transition-colors"
          aria-label="Retirer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {isCoffret && "giftMessage" in metadata && (
        <div className="pl-24 pr-12 text-xs space-y-1">
          {metadata.giftMessage ? (
            <p className="italic text-warm-brown/80">
              ✉️ « {metadata.giftMessage} »
            </p>
          ) : null}
          <GiftMessageEditor
            cartItemId={cartItemId}
            currentMessage={metadata.giftMessage ?? ""}
            onSaved={() => router.refresh()}
          />
        </div>
      )}
      {isGiftCard && metadata.type === "gift_card" && (
        <div className="pl-24 pr-12 text-xs space-y-1">
          <p className="text-warm-brown/80">📧 Pour {metadata.recipientEmail}</p>
          <p className="text-warm-brown/60">
            Envoi : {new Date(metadata.deliveryAt).toLocaleDateString("fr-BE")}
          </p>
          {metadata.message && (
            <p className="italic text-warm-brown/80">✉️ « {metadata.message} »</p>
          )}
        </div>
      )}
    </div>
  );
}

function GiftMessageEditor({
  cartItemId,
  currentMessage,
  onSaved,
}: {
  cartItemId: string;
  currentMessage: string;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(currentMessage);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-warm-brown/60 underline hover:text-honey-dark"
      >
        {currentMessage ? "Modifier le message" : "Ajouter un message cadeau"}
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await updateGiftMessage({
            cartItemId,
            giftMessage: v.trim() ? v.trim() : null,
          });
          setEditing(false);
          onSaved();
        });
      }}
      className="flex gap-1"
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        maxLength={200}
        placeholder="Message cadeau (200 max)"
        className="border border-cookie/30 rounded px-2 py-1 flex-1 text-xs"
        autoFocus
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-honey text-cream text-xs px-2 py-1 rounded disabled:opacity-50"
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => {
          setV(currentMessage);
          setEditing(false);
        }}
        className="text-warm-brown/60 text-xs px-1"
      >
        ✕
      </button>
    </form>
  );
}
