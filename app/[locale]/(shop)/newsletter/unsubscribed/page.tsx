import { setRequestLocale } from "next-intl/server";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  return (
    <section className="container mx-auto max-w-xl py-24 text-center">
      <h1 className="text-warm-brown font-display mb-6 text-4xl">
        {error ? "Lien invalide" : "Désinscription confirmée"}
      </h1>
      <p className="text-warm-brown/80">
        {error
          ? "Le lien que vous avez suivi n'est plus valide."
          : "Vous ne recevrez plus nos emails. Vous pouvez vous réinscrire à tout moment."}
      </p>
    </section>
  );
}
