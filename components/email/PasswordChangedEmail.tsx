import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, { heading: string; body: string; warning: string }> = {
  fr: {
    heading: "Ton mot de passe a été modifié",
    body: "Tu viens de mettre à jour le mot de passe de ton compte Au Fil des Saveurs. Toutes tes sessions ont été déconnectées pour des raisons de sécurité.",
    warning: "Si ce n'est pas toi, réinitialise ton mot de passe immédiatement et contacte-nous.",
  },
  nl: {
    heading: "Je wachtwoord is gewijzigd",
    body: "Je hebt zojuist het wachtwoord van je Au Fil des Saveurs-account bijgewerkt. Al je sessies zijn om veiligheidsredenen afgemeld.",
    warning: "Was jij dit niet? Stel je wachtwoord onmiddellijk opnieuw in en neem contact met ons op.",
  },
  de: {
    heading: "Dein Passwort wurde geändert",
    body: "Du hast soeben das Passwort deines Au Fil des Saveurs-Kontos aktualisiert. Alle Sitzungen wurden aus Sicherheitsgründen abgemeldet.",
    warning: "Solltest du das nicht gewesen sein, setze dein Passwort sofort zurück und kontaktiere uns.",
  },
  en: {
    heading: "Your password was changed",
    body: "You just updated the password on your Au Fil des Saveurs account. All your sessions have been signed out for security.",
    warning: "If this wasn't you, reset your password immediately and contact us.",
  },
};

export function PasswordChangedEmail({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
      <p style={{ color: "#a13b1f", fontSize: 14, lineHeight: 1.5, marginTop: 16, fontWeight: 600 }}>
        {s.warning}
      </p>
    </div>
  );
}
