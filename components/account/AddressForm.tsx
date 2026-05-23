"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createAddress, updateAddress } from "@/lib/actions/address.actions";

type Initial = Partial<{
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}>;

export function AddressForm({ initial = {}, onDone }: { initial?: Initial; onDone: () => void }) {
  const [data, setData] = useState<Initial>({ country: "BE", ...initial });
  const [pending, start] = useTransition();
  const isEdit = !!initial.id;

  function field<K extends keyof Initial>(key: K, type: "text" | "tel" = "text", required = true) {
    return (
      <label className="block">
        <span className="text-warm-brown mb-1 block text-xs">{String(key)}</span>
        <input
          type={type}
          required={required}
          value={(data[key] as string | undefined) ?? ""}
          onChange={(e) => setData({ ...data, [key]: e.target.value })}
          className="border-warm-brown/20 w-full rounded-md border bg-white px-3 py-2"
        />
      </label>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          if (isEdit) await updateAddress(data);
          else await createAddress(data);
          onDone();
        });
      }}
      className="space-y-3"
    >
      {field("label", "text", false)}
      <div className="grid grid-cols-2 gap-3">
        {field("firstName")}
        {field("lastName")}
      </div>
      {field("line1")}
      {field("line2", "text", false)}
      <div className="grid grid-cols-2 gap-3">
        {field("postalCode")}
        {field("city")}
      </div>
      {field("phone", "tel", false)}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!data.isDefaultShipping}
          onChange={(e) => setData({ ...data, isDefaultShipping: e.target.checked })}
        />
        Adresse de livraison par défaut
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!data.isDefaultBilling}
          onChange={(e) => setData({ ...data, isDefaultBilling: e.target.checked })}
        />
        Adresse de facturation par défaut
      </label>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending} className="bg-honey text-cream hover:bg-honey-dark">
          {isEdit ? "Mettre à jour" : "Ajouter"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
