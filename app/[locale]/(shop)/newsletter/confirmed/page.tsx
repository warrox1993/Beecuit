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
        {error ? "Lien invalide ou expiré" : "Inscription confirmée"}
      </h1>
      <p className="text-warm-brown/80">
        {error
          ? "Le lien que vous avez suivi n'est plus valide. Réessayez de vous inscrire si nécessaire."
          : "Merci de votre confirmation. À très vite chez Au Fil des Saveurs."}
      </p>
    </section>
  );
}
