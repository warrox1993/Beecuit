import { setRequestLocale } from "next-intl/server";
import { B2BQuoteForm } from "@/components/shop/B2BQuoteForm";

export default async function EntreprisesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-amber-900">
          BeeCuit pour les entreprises
        </h1>
        <p className="text-lg text-amber-800">
          Cadeaux d&apos;affaires, séminaires, événements clients : on compose un devis sur
          mesure rien que pour vous.
        </p>
      </header>

      <section className="mb-12 grid gap-4 md:grid-cols-3">
        {[
          {
            t: "Cadeaux d'affaires",
            d: "Fin d'année, anniversaires clients, remerciements.",
          },
          {
            t: "Séminaires",
            d: "Pauses gourmandes, attentions VIP, kits de bienvenue.",
          },
          {
            t: "Marque personnalisée",
            d: "Coffrets brandés, message custom, livraison groupée.",
          },
        ].map((c) => (
          <div key={c.t} className="rounded-lg border border-amber-200 bg-amber-50/50 p-5">
            <h3 className="mb-2 font-semibold text-amber-900">{c.t}</h3>
            <p className="text-sm text-amber-800">{c.d}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-amber-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-semibold text-amber-900">Votre demande</h2>
        <B2BQuoteForm />
      </section>

      <section className="mt-10 text-center text-sm text-amber-800">
        On vous répond sous <strong>48h ouvrées</strong>. Pour les demandes urgentes :{" "}
        <a className="underline" href="mailto:hello@beecuit.be">
          hello@beecuit.be
        </a>
      </section>
    </main>
  );
}
