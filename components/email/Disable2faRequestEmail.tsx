import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<
  Locale,
  { heading: string; body: string; cta: string; fallback: string; expires: string; ignore: string }
> = {
  fr: {
    heading: "Désactiver la double authentification",
    body: "Tu as demandé à désactiver la 2FA car tu n'as plus accès à ton application d'authentification. Clique pour la désactiver — tu pourras te reconnecter avec ton mot de passe seul.",
    cta: "Désactiver la 2FA",
    fallback: "Si le bouton ne fonctionne pas, copie-colle ce lien dans ton navigateur :",
    expires: "Ce lien est valable 24 heures.",
    ignore: "Si tu n'es pas à l'origine de cette demande, ignore cet email — ta 2FA reste active.",
  },
  nl: {
    heading: "Tweestapsverificatie uitschakelen",
    body: "Je hebt gevraagd om 2FA uit te schakelen omdat je geen toegang meer hebt tot je authenticatie-app. Klik om uit te schakelen — daarna kun je opnieuw aanmelden met alleen je wachtwoord.",
    cta: "2FA uitschakelen",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "Deze link is 24 uur geldig.",
    ignore: "Heb jij dit niet aangevraagd? Negeer deze e-mail — je 2FA blijft actief.",
  },
  de: {
    heading: "Zwei-Faktor-Authentifizierung deaktivieren",
    body: "Du hast angefordert, 2FA zu deaktivieren, weil du keinen Zugriff mehr auf deine Authenticator-App hast. Klicke zum Deaktivieren — danach kannst du dich nur mit deinem Passwort anmelden.",
    cta: "2FA deaktivieren",
    fallback: "Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:",
    expires: "Dieser Link ist 24 Stunden gültig.",
    ignore: "Solltest du das nicht angefordert haben, ignoriere diese E-Mail — deine 2FA bleibt aktiv.",
  },
  en: {
    heading: "Disable two-factor authentication",
    body: "You asked to disable 2FA because you no longer have access to your authenticator app. Click to disable it — you'll then be able to sign in with your password alone.",
    cta: "Disable 2FA",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "This link is valid for 24 hours.",
    ignore: "If you didn't request this, ignore this email — your 2FA stays active.",
  },
};

export function Disable2faRequestEmail({
  locale,
  disableUrl,
}: {
  locale: Locale;
  disableUrl: string;
}) {
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
          href={disableUrl}
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
        <a href={disableUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {disableUrl}
        </a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#7a5a3c", marginTop: 4 }}>{s.ignore}</p>
    </div>
  );
}
