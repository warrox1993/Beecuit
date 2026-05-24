"use client";
import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { GiftCardAmountPicker } from "./GiftCardAmountPicker";
import { addGiftCardToCart } from "@/lib/actions/cart.actions";
import {
  GIFT_CARD_AMOUNTS_CENTS,
  type GiftCardAmountCents,
} from "@/lib/gift-cards/constants";

export function GiftCardForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [amount, setAmount] = useState<GiftCardAmountCents>(
    GIFT_CARD_AMOUNTS_CENTS[1],
  );
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const todayISO = new Date().toISOString().split("T")[0]!;
  const [deliveryDate, setDeliveryDate] = useState(todayISO);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        start(async () => {
          try {
            await addGiftCardToCart({
              amountCents: amount,
              recipientEmail,
              recipientName: recipientName.trim() || null,
              message: message.trim() || null,
              deliveryAt: new Date(deliveryDate + "T09:00:00Z").toISOString(),
            });
            router.push("/panier");
          } catch (e2) {
            setErr((e2 as Error).message);
          }
        });
      }}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-semibold text-warm-brown mb-3">
          Montant
        </label>
        <GiftCardAmountPicker value={amount} onChange={setAmount} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-brown mb-2">
          Email du destinataire
        </label>
        <input
          required
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          className="w-full border border-cookie/30 rounded-lg px-3 py-2"
          placeholder="marie@exemple.be"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-brown mb-2">
          Nom du destinataire{" "}
          <span className="font-normal text-warm-brown/60">(optionnel)</span>
        </label>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          maxLength={120}
          className="w-full border border-cookie/30 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-brown mb-2">
          Message{" "}
          <span className="font-normal text-warm-brown/60">
            (optionnel, 500 max)
          </span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={4}
          className="w-full border border-cookie/30 rounded-lg px-3 py-2"
        />
        <div className="text-xs text-warm-brown/60 text-right mt-1">
          {message.length}/500
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-warm-brown mb-2">
          Date d&apos;envoi
        </label>
        <input
          required
          type="date"
          min={todayISO}
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="border border-cookie/30 rounded-lg px-3 py-2"
        />
        <div className="text-xs text-warm-brown/60 mt-1">
          L&apos;email partira à 09:00 UTC le jour choisi.
        </div>
      </div>
      {err && <p className="text-terracotta text-sm">{err}</p>}
      <Button
        type="submit"
        disabled={pending || !recipientEmail}
        className="bg-honey text-cream hover:bg-honey-dark px-6 py-6 text-base w-full"
      >
        {pending ? "..." : `Ajouter au panier — ${amount / 100} €`}
      </Button>
    </form>
  );
}
