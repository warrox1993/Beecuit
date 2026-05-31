import { getTranslations } from "next-intl/server";

export async function ContactMap() {
  const t = await getTranslations("contact");
  const query = encodeURIComponent("Au Fil des Saveurs, Liège, Belgique");
  return (
    <div className="border-warm-brown/10 overflow-hidden rounded-2xl border">
      <div className="from-honey-cream to-cream relative flex h-48 items-center justify-center bg-gradient-to-br">
        <div className="text-honey-dark/70 text-5xl" aria-hidden>📍</div>
        <div className="bg-honey/10 absolute inset-0" aria-hidden
             style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(168,115,27,.12), transparent 60%), radial-gradient(circle at 70% 70%, rgba(168,115,27,.10), transparent 55%)" }} />
      </div>
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
        <p className="text-warm-brown/70 text-sm">
          <mark className="bg-honey-cream text-honey-dark rounded px-1">[adresse de l&apos;atelier]</mark>
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${query}`}
          target="_blank" rel="noopener noreferrer"
          className="bg-honey text-cream hover:bg-honey-dark shrink-0 rounded-full px-4 py-2 text-sm font-medium"
        >
          {t("mapDirections")}
        </a>
      </div>
    </div>
  );
}
