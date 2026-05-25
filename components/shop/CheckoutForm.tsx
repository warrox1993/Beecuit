"use client";
import { useId, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/actions/checkout.actions";
import { GiftCardCodeInput } from "./GiftCardCodeInput";

type SimpleAddress = {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country: string;
  phone?: string;
  label?: string;
};

const FIELD_LABELS: Record<keyof SimpleAddress, string> = {
  firstName: "Prénom",
  lastName: "Nom",
  line1: "Adresse",
  line2: "Complément d'adresse",
  postalCode: "Code postal",
  city: "Ville",
  country: "Pays",
  phone: "Téléphone",
  label: "Libellé",
};

const FIELD_AUTOCOMPLETE: Partial<Record<keyof SimpleAddress, string>> = {
  firstName: "given-name",
  lastName: "family-name",
  line1: "address-line1",
  line2: "address-line2",
  postalCode: "postal-code",
  city: "address-level2",
  country: "country",
  phone: "tel",
};

export function CheckoutForm({
  defaultEmail,
  locale,
}: {
  defaultEmail: string;
  locale: "fr" | "nl" | "de" | "en";
}) {
  const formId = useId();
  const [email, setEmail] = useState(defaultEmail);
  const [newsletterOptIn, setNewsletter] = useState(false);
  const [billingSameAsShipping, setSame] = useState(true);
  const [ship, setShip] = useState<SimpleAddress>({
    firstName: "",
    lastName: "",
    line1: "",
    postalCode: "",
    city: "",
    country: "BE",
  });
  const [bill, setBill] = useState<SimpleAddress>({
    firstName: "",
    lastName: "",
    line1: "",
    postalCode: "",
    city: "",
    country: "BE",
  });
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [giftCard, setGiftCard] = useState<{
    code: string;
    amountCents: number;
  } | null>(null);

  function input<K extends keyof SimpleAddress>(
    target: SimpleAddress,
    set: (a: SimpleAddress) => void,
    key: K,
    section: "ship" | "bill",
    required = true,
  ) {
    const id = `${formId}-${section}-${String(key)}`;
    const label = FIELD_LABELS[key];
    return (
      <label htmlFor={id} className="block">
        <span className="text-warm-brown mb-1 block text-xs font-medium">
          {label}
          {required && <span aria-hidden className="text-terracotta ml-0.5">*</span>}
        </span>
        <input
          id={id}
          type={key === "phone" ? "tel" : "text"}
          required={required}
          aria-required={required || undefined}
          autoComplete={FIELD_AUTOCOMPLETE[key]}
          value={target[key] ?? ""}
          onChange={(e) => set({ ...target, [key]: e.target.value })}
          placeholder={label}
          className="border-warm-brown/20 focus-visible:border-honey-dark focus-visible:ring-honey-dark/30 w-full rounded-md border bg-white px-4 py-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
      </label>
    );
  }

  const emailId = `${formId}-email`;
  const newsletterId = `${formId}-newsletter`;
  const sameAsShippingId = `${formId}-same-billing`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        start(async () => {
          try {
            await createCheckoutSession(
              {
                email,
                newsletterOptIn,
                shippingAddress: ship,
                billingSameAsShipping,
                billingAddress: billingSameAsShipping ? undefined : bill,
                shippingMethod: "bpost_express_24h",
                giftCardCode: giftCard?.code,
              },
              locale,
            );
          } catch (e2) {
            setErr((e2 as Error).message);
          }
        });
      }}
      className="space-y-10"
      aria-busy={pending || undefined}
    >
      <fieldset className="space-y-4">
        <legend className="text-honey-dark mb-4 text-xs font-semibold tracking-[0.1em] uppercase">
          Contact
        </legend>
        <label htmlFor={emailId} className="block">
          <span className="text-warm-brown mb-1 block text-xs font-medium">
            Adresse email <span aria-hidden className="text-terracotta ml-0.5">*</span>
          </span>
          <input
            id={emailId}
            type="email"
            required
            aria-required="true"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-warm-brown/20 focus-visible:border-honey-dark focus-visible:ring-honey-dark/30 w-full rounded-md border bg-white px-4 py-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
            placeholder="email@exemple.com"
          />
        </label>
        <label
          htmlFor={newsletterId}
          className="text-warm-brown/85 flex items-center gap-2 text-sm"
        >
          <input
            id={newsletterId}
            type="checkbox"
            checked={newsletterOptIn}
            onChange={(e) => setNewsletter(e.target.checked)}
          />
          <span>M&apos;abonner à la newsletter Au Fil des Saveurs</span>
        </label>
      </fieldset>

      <fieldset className="border-warm-brown/10 space-y-4 border-t pt-8">
        <legend className="text-honey-dark mb-4 text-xs font-semibold tracking-[0.1em] uppercase">
          Adresse de livraison
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {input(ship, setShip, "firstName", "ship")}
          {input(ship, setShip, "lastName", "ship")}
        </div>
        {input(ship, setShip, "line1", "ship")}
        {input(ship, setShip, "line2", "ship", false)}
        <div className="grid grid-cols-2 gap-3">
          {input(ship, setShip, "postalCode", "ship")}
          {input(ship, setShip, "city", "ship")}
        </div>
        {input(ship, setShip, "phone", "ship", false)}
      </fieldset>

      <fieldset className="border-warm-brown/10 space-y-4 border-t pt-8">
        <legend className="text-honey-dark mb-4 text-xs font-semibold tracking-[0.1em] uppercase">
          Adresse de facturation
        </legend>
        <label
          htmlFor={sameAsShippingId}
          className="text-warm-brown/85 flex items-center gap-2 text-sm"
        >
          <input
            id={sameAsShippingId}
            type="checkbox"
            checked={billingSameAsShipping}
            onChange={(e) => setSame(e.target.checked)}
          />
          <span>Identique à l&apos;adresse de livraison</span>
        </label>
        {!billingSameAsShipping && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {input(bill, setBill, "firstName", "bill")}
              {input(bill, setBill, "lastName", "bill")}
            </div>
            {input(bill, setBill, "line1", "bill")}
            {input(bill, setBill, "line2", "bill", false)}
            <div className="grid grid-cols-2 gap-3">
              {input(bill, setBill, "postalCode", "bill")}
              {input(bill, setBill, "city", "bill")}
            </div>
          </>
        )}
      </fieldset>

      <fieldset className="border-warm-brown/10 border-t pt-8">
        <legend className="text-honey-dark mb-4 text-xs font-semibold tracking-[0.1em] uppercase">
          Livraison
        </legend>
        <label className="border-warm-brown/20 flex items-center gap-3 rounded-md border bg-white p-4 text-sm">
          <input
            type="radio"
            name="shipping-method"
            value="bpost_express_24h"
            checked
            readOnly
          />
          <span className="text-warm-brown">bpost Express 24h — tarif calculé selon poids</span>
        </label>
      </fieldset>

      <fieldset>
        <GiftCardCodeInput
          appliedAmountCents={giftCard?.amountCents ?? null}
          onApplied={(code, amountCents) => setGiftCard({ code, amountCents })}
          onRemoved={() => setGiftCard(null)}
        />
      </fieldset>

      {err && (
        <p role="alert" aria-live="assertive" className="text-terracotta text-sm">
          {err}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className="bg-honey text-cream hover:bg-honey-dark focus-visible:ring-honey-dark/40 w-full py-6 text-base focus-visible:ring-4"
      >
        {pending ? "Redirection vers Stripe..." : "Payer avec Stripe →"}
      </Button>
    </form>
  );
}
