import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, {
  heading: string;
  body: string;
  cta: string;
  fallback: string;
  expires: string;
  ignore: string;
}> = {
  fr: {
    heading: "Réinitialise ton mot de passe",
    body: "On a reçu une demande pour réinitialiser le mot de passe de ton compte Au Fil des Saveurs.",
    cta: "Choisir un nouveau mot de passe",
    fallback: "Si le bouton ne fonctionne pas, copie-colle cette adresse dans ton navigateur :",
    expires: "Ce lien est valable 1 heure.",
    ignore: "Si tu n'as pas fait cette demande, ignore cet email — ton mot de passe restera inchangé.",
  },
  nl: {
    heading: "Stel je wachtwoord opnieuw in",
    body: "We hebben een verzoek ontvangen om het wachtwoord van je Au Fil des Saveurs-account opnieuw in te stellen.",
    cta: "Een nieuw wachtwoord kiezen",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "Deze link is 1 uur geldig.",
    ignore: "Als jij deze aanvraag niet hebt gedaan, kun je deze e-mail negeren — je wachtwoord blijft hetzelfde.",
  },
  de: {
    heading: "Setze dein Passwort zurück",
    body: "Wir haben eine Anfrage zum Zurücksetzen des Passworts deines Au Fil des Saveurs-Kontos erhalten.",
    cta: "Neues Passwort wählen",
    fallback: "Falls der Button nicht funktioniert, kopiere diese Adresse in deinen Browser:",
    expires: "Dieser Link ist 1 Stunde gültig.",
    ignore: "Solltest du diese Anfrage nicht gestellt haben, ignoriere diese E-Mail — dein Passwort bleibt unverändert.",
  },
  en: {
    heading: "Reset your password",
    body: "We received a request to reset the password for your Au Fil des Saveurs account.",
    cta: "Choose a new password",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "This link is valid for 1 hour.",
    ignore: "If you didn't make this request, just ignore this email — your password will remain unchanged.",
  },
};

export function PasswordResetEmail({ locale, resetUrl }: { locale: Locale; resetUrl: string }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
      <p style={{ marginTop: 24 }}>
        <a
          href={resetUrl}
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: "#a8731b",
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
        <a href={resetUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {resetUrl}
        </a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#7a5a3c", marginTop: 4 }}>{s.ignore}</p>
    </div>
  );
}
