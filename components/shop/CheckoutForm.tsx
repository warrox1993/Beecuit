"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/actions/checkout.actions";

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

export function CheckoutForm({
  defaultEmail,
  locale,
}: {
  defaultEmail: string;
  locale: "fr" | "nl" | "de" | "en";
}) {
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

  function input<K extends keyof SimpleAddress>(
    target: SimpleAddress,
    set: (a: SimpleAddress) => void,
    key: K,
    required = true,
  ) {
    return (
      <input
        type="text"
        required={required}
        value={target[key] ?? ""}
        onChange={(e) => set({ ...target, [key]: e.target.value })}
        placeholder={String(key)}
        className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
      />
    );
  }

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
              },
              locale,
            );
          } catch (e2) {
            setErr((e2 as Error).message);
          }
        });
      }}
      className="space-y-10"
    >
      <fieldset className="space-y-4">
        <legend className="text-honey-dark mb-4 text-xs font-semibold tracking-[0.1em] uppercase">
          CONTACT
        </legend>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
          placeholder="email@exemple.com"
        />
        <label className="text-warm-brown/80 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={newsletterOptIn}
            onChange={(e) => setNewsletter(e.target.checked)}
          />
          M&apos;abonner à la newsletter BeeCuit
        </label>
      </fieldset>

      <fieldset className="border-warm-brown/10 space-y-4 border-t pt-8">
        <legend className="text-honey-dark mb-4 text-xs font-semibold tracking-[0.1em] uppercase">
          ADRESSE DE LIVRAISON
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {input(ship, setShip, "firstName")}
          {input(ship, setShip, "lastName")}
        </div>
        {input(ship, setShip, "line1")}
        {input(ship, setShip, "line2", false)}
        <div className="grid grid-cols-2 gap-3">
          {input(ship, setShip, "postalCode")}
          {input(ship, setShip, "city")}
        </div>
        {input(ship, setShip, "phone", false)}
      </fieldset>

      <fieldset className="border-warm-brown/10 space-y-4 border-t pt-8">
        <legend className="text-honey-dark mb-4 text-xs font-semibold tracking-[0.1em] uppercase">
          ADRESSE DE FACTURATION
        </legend>
        <label className="text-warm-brown/80 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={billingSameAsShipping}
            onChange={(e) => setSame(e.target.checked)}
          />
          Identique à l&apos;adresse de livraison
        </label>
        {!billingSameAsShipping && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {input(bill, setBill, "firstName")}
              {input(bill, setBill, "lastName")}
            </div>
            {input(bill, setBill, "line1")}
            {input(bill, setBill, "line2", false)}
            <div className="grid grid-cols-2 gap-3">
              {input(bill, setBill, "postalCode")}
              {input(bill, setBill, "city")}
            </div>
          </>
        )}
      </fieldset>

      <fieldset className="border-warm-brown/10 border-t pt-8">
        <legend className="text-honey-dark mb-4 text-xs font-semibold tracking-[0.1em] uppercase">
          LIVRAISON
        </legend>
        <label className="border-warm-brown/20 flex items-center gap-3 rounded-md border bg-white p-4 text-sm">
          <input type="radio" checked readOnly />
          <span className="text-warm-brown">bpost Express 24h — tarif calculé selon poids</span>
        </label>
      </fieldset>

      {err && <p className="text-terracotta text-sm">{err}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base"
      >
        {pending ? "Redirection vers Stripe..." : "Payer avec Stripe →"}
      </Button>
    </form>
  );
}
