import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, {
  heading: string;
  body: string;
  cta: string;
  fallback: string;
  expires: string;
  warning: string;
}> = {
  fr: {
    heading: "Ton adresse email a été modifiée",
    body: "L'adresse email de ton compte Au Fil des Saveurs a été modifiée vers {newEmail}. Tu n'as plus rien à faire.",
    cta: "Si ce n'est pas toi, annuler le changement",
    fallback: "Si le bouton ne fonctionne pas, copie-colle cette adresse dans ton navigateur :",
    expires: "Le lien d'annulation est valable 7 jours.",
    warning: "Si tu n'es pas à l'origine de ce changement, clique immédiatement sur le bouton ci-dessus. Cela révoquera également toutes les sessions actives.",
  },
  nl: {
    heading: "Je e-mailadres is gewijzigd",
    body: "Het e-mailadres van je Au Fil des Saveurs-account is gewijzigd naar {newEmail}. Verder hoef je niets te doen.",
    cta: "Niet jij? Wijziging annuleren",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "De annuleringslink is 7 dagen geldig.",
    warning: "Heb jij deze wijziging niet aangevraagd? Klik direct op de knop hierboven. Daarmee worden ook alle actieve sessies ingetrokken.",
  },
  de: {
    heading: "Deine E-Mail-Adresse wurde geändert",
    body: "Die E-Mail-Adresse deines Au Fil des Saveurs-Kontos wurde auf {newEmail} geändert. Du musst nichts weiter tun.",
    cta: "Nicht du? Änderung rückgängig machen",
    fallback: "Falls der Button nicht funktioniert, kopiere diese Adresse in deinen Browser:",
    expires: "Der Rücksetzlink ist 7 Tage gültig.",
    warning: "Solltest du diese Änderung nicht ausgelöst haben, klicke sofort auf den Button oben. Damit werden auch alle aktiven Sitzungen abgemeldet.",
  },
  en: {
    heading: "Your email address was changed",
    body: "The email address on your Au Fil des Saveurs account was changed to {newEmail}. You don't need to do anything else.",
    cta: "Wasn't you? Undo the change",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "The undo link is valid for 7 days.",
    warning: "If you didn't make this change, click the button above immediately. It will also revoke all active sessions.",
  },
};

export function EmailChangedNotificationEmail({
  locale,
  undoUrl,
  newEmail,
}: {
  locale: Locale;
  undoUrl: string;
  newEmail: string;
}) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>
        {s.body.replace("{newEmail}", newEmail)}
      </p>
      <p style={{ marginTop: 24 }}>
        <a
          href={undoUrl}
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: "#a13b1f",
            color: "#fbf6ee",
            textDecoration: "none",
            borderRadius: 6,
            fontWeight: 500,
            fontSize: 15,
          }}
        >
          {s.cta}
        </a>
      </p>
      <p style={{ color: "#7a5a3c", fontSize: 13, lineHeight: 1.5, marginTop: 24 }}>
        {s.fallback}
        <br />
        <a href={undoUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {undoUrl}
        </a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#a13b1f", marginTop: 4, fontWeight: 600 }}>{s.warning}</p>
    </div>
  );
}
