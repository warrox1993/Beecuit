import { getTranslations } from "next-intl/server";

export async function ContactCoordinates() {
  const t = await getTranslations("contact");
  const rows: { label: string; value: string }[] = [
    { label: t("coordAddress"), value: "[adresse de l'atelier]" },
    { label: t("coordEmail"), value: "[email de contact]" },
    { label: t("coordPhone"), value: "[téléphone]" },
    { label: t("coordHours"), value: "[horaires d'ouverture]" },
  ];
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="text-honey-dark text-xs font-semibold tracking-wide uppercase">{r.label}</span>
          <p className="text-warm-brown/80 mt-0.5 text-sm">
            <mark className="bg-honey-cream text-honey-dark rounded px-1">{r.value}</mark>
          </p>
        </li>
      ))}
    </ul>
  );
}
