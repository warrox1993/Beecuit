import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getQuoteRequest } from "@/lib/queries/b2b";
import { QuoteForm } from "@/components/admin/QuoteForm";
import { RejectQuoteDialog } from "@/components/admin/RejectQuoteDialog";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  quoted: "Devis envoyé",
  paid: "Payé",
  rejected: "Refusé",
  expired: "Expiré",
};

export default async function AdminDevisDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");
  const { id } = await params;
  const quote = await getQuoteRequest(id);
  if (!quote) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/admin/devis" className="text-sm text-amber-700 underline">
            ← Tous les devis
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-amber-900">{quote.companyName}</h1>
          <p className="text-sm text-amber-800">
            Statut : <strong>{STATUS_LABELS[quote.status] ?? quote.status}</strong>
          </p>
        </div>
      </header>

      <section className="rounded-lg border border-amber-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold">Demande</h2>
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <Field label="Contact" value={quote.contactName} />
          <Field label="Email" value={quote.email} />
          <Field label="Téléphone" value={quote.phone ?? "—"} />
          <Field label="TVA" value={quote.vatNumber ?? "—"} />
          <Field
            label="Quantité visée"
            value={quote.targetQuantity ? String(quote.targetQuantity) : "—"}
          />
          <Field label="Date souhaitée" value={quote.targetDeliveryDate ?? "—"} />
          <Field label="Budget" value={quote.budgetRange ?? "—"} />
          <Field label="Soumis le" value={quote.createdAt.toLocaleString("fr-BE")} />
        </dl>
        <h3 className="mt-4 mb-1 text-sm font-semibold">Produits demandés</h3>
        <p className="whitespace-pre-wrap rounded bg-amber-50 p-3 text-sm">
          {quote.requestedProducts}
        </p>
        {quote.message && (
          <>
            <h3 className="mt-4 mb-1 text-sm font-semibold">Message</h3>
            <p className="whitespace-pre-wrap rounded bg-amber-50 p-3 text-sm">{quote.message}</p>
          </>
        )}
      </section>

      {quote.status === "pending" && (
        <section className="rounded-lg border border-amber-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Établir un devis</h2>
            <RejectQuoteDialog quoteId={quote.id} />
          </div>
          <QuoteForm quoteId={quote.id} defaultEmail={quote.email} />
        </section>
      )}

      {quote.status === "quoted" && (
        <section className="rounded-lg border border-amber-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold">Devis envoyé</h2>
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <Field
              label="Montant"
              value={
                quote.quotedAmountCents !== null
                  ? (quote.quotedAmountCents / 100).toLocaleString("fr-BE", {
                      style: "currency",
                      currency: "EUR",
                    })
                  : "—"
              }
            />
            <Field label="Envoyé le" value={quote.quotedAt?.toLocaleString("fr-BE") ?? "—"} />
            <Field
              label="Expire le"
              value={quote.quoteExpiresAt?.toLocaleDateString("fr-BE") ?? "—"}
            />
          </dl>
          {quote.stripePaymentLinkUrl && (
            <p className="mt-3 text-sm">
              Lien de paiement :{" "}
              <a
                className="text-amber-700 underline"
                href={quote.stripePaymentLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {quote.stripePaymentLinkUrl}
              </a>
            </p>
          )}
          {quote.quoteDescription && (
            <p className="mt-3 whitespace-pre-wrap rounded bg-amber-50 p-3 text-sm">
              {quote.quoteDescription}
            </p>
          )}
          <div className="mt-4">
            <RejectQuoteDialog quoteId={quote.id} />
          </div>
        </section>
      )}

      {quote.status === "paid" && (
        <section className="rounded-lg border border-green-200 bg-green-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-green-900">Payé</h2>
          <p className="text-sm text-green-800">
            Payé le {quote.paidAt?.toLocaleString("fr-BE")} —{" "}
            {(quote.quotedAmountCents ?? 0) / 100} €.
          </p>
        </section>
      )}

      {quote.status === "rejected" && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-red-900">Refusé</h2>
          {quote.rejectedReason && (
            <p className="whitespace-pre-wrap text-sm text-red-800">{quote.rejectedReason}</p>
          )}
        </section>
      )}

      {quote.adminNotes && (
        <section className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">Notes internes</h2>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{quote.adminNotes}</p>
        </section>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-amber-700">{label}</dt>
      <dd className="text-amber-900">{value}</dd>
    </div>
  );
}
