import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, { heading: string; body: string }> = {
  fr: {
    heading: "Suppression annulée",
    body: "La suppression de ton compte Au Fil des Saveurs a été annulée. Tout est revenu à la normale.",
  },
  nl: {
    heading: "Verwijdering geannuleerd",
    body: "De verwijdering van je Au Fil des Saveurs-account is geannuleerd. Alles is hersteld.",
  },
  de: {
    heading: "Löschung abgebrochen",
    body: "Die Löschung deines Au Fil des Saveurs-Kontos wurde abgebrochen. Alles ist wiederhergestellt.",
  },
  en: {
    heading: "Deletion cancelled",
    body: "The deletion of your Au Fil des Saveurs account has been cancelled. Everything is back to normal.",
  },
};

export function AccountDeletionCancelledEmail({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
    </div>
  );
}
