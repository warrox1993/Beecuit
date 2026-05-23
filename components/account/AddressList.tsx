"use client";
import { useState, useTransition } from "react";
import { AddressForm } from "./AddressForm";
import { Button } from "@/components/ui/button";
import { deleteAddress } from "@/lib/actions/address.actions";

type Addr = {
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
};

export function AddressList({ addresses }: { addresses: Addr[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      {addresses.map((a) =>
        editing === a.id ? (
          <div key={a.id} className="border-warm-brown/10 rounded-lg border p-4">
            <AddressForm initial={a} onDone={() => setEditing(null)} />
          </div>
        ) : (
          <div
            key={a.id}
            className="border-warm-brown/10 flex justify-between rounded-lg border p-4"
          >
            <div>
              {a.label && <p className="text-warm-brown text-sm font-medium">{a.label}</p>}
              <p className="text-warm-brown">
                {a.firstName} {a.lastName}
              </p>
              <p className="text-warm-brown/80 text-sm">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
              </p>
              <p className="text-warm-brown/80 text-sm">
                {a.postalCode} {a.city} ({a.country})
              </p>
              {a.phone && <p className="text-warm-brown/60 text-xs">{a.phone}</p>}
              <div className="mt-2 flex gap-2 text-xs">
                {a.isDefaultShipping && (
                  <span className="bg-honey/20 text-honey-dark rounded px-2 py-0.5">
                    Livraison par défaut
                  </span>
                )}
                {a.isDefaultBilling && (
                  <span className="bg-honey/20 text-honey-dark rounded px-2 py-0.5">
                    Facturation par défaut
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={() => setEditing(a.id)}>
                Éditer
              </Button>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await deleteAddress(a.id);
                  })
                }
              >
                Supprimer
              </Button>
            </div>
          </div>
        ),
      )}
      {creating ? (
        <div className="border-warm-brown/10 rounded-lg border p-4">
          <AddressForm onDone={() => setCreating(false)} />
        </div>
      ) : (
        <Button
          onClick={() => setCreating(true)}
          className="bg-honey text-cream hover:bg-honey-dark"
        >
          + Ajouter une adresse
        </Button>
      )}
    </div>
  );
}
