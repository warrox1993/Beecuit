"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markAsShipped, markAsDelivered } from "@/lib/actions/admin/orders.actions";

type Item = { productNameSnapshot: string; quantity: number; lineTotalCents: number };

export function OrderDetailAdmin({
  orderNumber,
  status,
  totalCents,
  subtotalCents,
  shippingCents,
  taxCents,
  items,
  shippingAddress,
  shippingMethod,
  trackingNumber,
  guestEmail,
  stripePaymentIntentId,
}: {
  orderNumber: string;
  status: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  items: Item[];
  shippingAddress: Record<string, unknown> | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  guestEmail: string | null;
  stripePaymentIntentId: string | null;
}) {
  const [tracking, setTracking] = useState(trackingNumber ?? "");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const eur = (c: number) => (c / 100).toFixed(2);

  return (
    <article className="border-warm-brown/10 rounded-lg border bg-white p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-honey-dark font-display text-2xl">#{orderNumber}</h1>
        <span className="bg-honey/10 text-honey-dark rounded-full px-3 py-1 text-xs">{status}</span>
      </header>
      <p className="text-warm-brown/70 mt-2 text-sm">{guestEmail ?? "compte client"}</p>

      <h2 className="text-warm-brown mt-6 mb-2 text-sm font-medium">Articles</h2>
      <ul className="divide-warm-brown/10 divide-y text-sm">
        {items.map((i, idx) => (
          <li key={idx} className="flex justify-between py-2">
            <span>
              {i.productNameSnapshot} × {i.quantity}
            </span>
            <span className="font-mono">{eur(i.lineTotalCents)} €</span>
          </li>
        ))}
      </ul>
      <div className="border-warm-brown/10 mt-3 border-t pt-3 text-sm">
        <div className="flex justify-between">
          <span>Sous-total</span>
          <span className="font-mono">{eur(subtotalCents)} €</span>
        </div>
        <div className="flex justify-between">
          <span>Livraison ({shippingMethod ?? "—"})</span>
          <span className="font-mono">{eur(shippingCents)} €</span>
        </div>
        <div className="text-warm-brown/60 flex justify-between text-xs">
          <span>dont TVA 6 %</span>
          <span className="font-mono">{eur(taxCents)} €</span>
        </div>
        <div className="border-warm-brown/10 mt-2 flex justify-between border-t pt-2 text-base font-medium">
          <span>Total</span>
          <span className="font-mono">{eur(totalCents)} €</span>
        </div>
      </div>

      {shippingAddress && (
        <>
          <h2 className="text-warm-brown mt-6 mb-2 text-sm font-medium">Livraison</h2>
          <p className="text-warm-brown/80 text-sm">
            {String(shippingAddress.firstName ?? "")} {String(shippingAddress.lastName ?? "")}
            <br />
            {String(shippingAddress.line1 ?? "")}
            <br />
            {String(shippingAddress.postalCode ?? "")} {String(shippingAddress.city ?? "")} (
            {String(shippingAddress.country ?? "")})
          </p>
        </>
      )}

      {status === "paid" && (
        <div className="border-warm-brown/10 mt-6 border-t pt-4">
          <h2 className="text-warm-brown mb-2 text-sm font-medium">Marquer comme expédiée</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="N° de suivi bpost"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              className="border-warm-brown/20 flex-1 rounded border bg-white px-3 py-2 text-sm"
            />
            <Button
              disabled={pending || !tracking}
              onClick={() =>
                start(async () => {
                  setErr(null);
                  try {
                    await markAsShipped({ orderNumber, trackingNumber: tracking });
                  } catch (e) {
                    setErr((e as Error).message);
                  }
                })
              }
              className="bg-honey text-cream hover:bg-honey-dark"
            >
              Expédiée + email
            </Button>
          </div>
        </div>
      )}

      {status === "shipped" && (
        <div className="border-warm-brown/10 mt-6 border-t pt-4">
          <p className="text-warm-brown/70 text-sm">
            N° suivi : <code>{trackingNumber}</code>
          </p>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await markAsDelivered(orderNumber);
              })
            }
            className="mt-2"
          >
            Marquer livrée
          </Button>
        </div>
      )}

      {err && <p className="text-terracotta mt-3 text-sm">{err}</p>}

      {stripePaymentIntentId && (
        <a
          href={`https://dashboard.stripe.com/payments/${stripePaymentIntentId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-warm-brown/60 hover:text-honey-dark mt-6 inline-block text-xs"
        >
          Voir dans Stripe ↗
        </a>
      )}
    </article>
  );
}
