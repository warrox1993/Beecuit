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
    heading: "Confirme ta nouvelle adresse email",
    body: "Tu as demandé à changer l'adresse email de ton compte Au Fil des Saveurs vers celle-ci. Clique pour confirmer.",
    cta: "Confirmer la nouvelle adresse",
    fallback: "Si le bouton ne fonctionne pas, copie-colle cette adresse dans ton navigateur :",
    expires: "Ce lien est valable 24 heures.",
    ignore: "Si tu n'es pas à l'origine de cette demande, ignore cet email — rien ne sera changé.",
  },
  nl: {
    heading: "Bevestig je nieuwe e-mailadres",
    body: "Je hebt het e-mailadres van je Au Fil des Saveurs-account naar dit adres willen wijzigen. Klik om te bevestigen.",
    cta: "Nieuw adres bevestigen",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "Deze link is 24 uur geldig.",
    ignore: "Heb jij deze wijziging niet aangevraagd? Negeer deze e-mail — er verandert niets.",
  },
  de: {
    heading: "Bestätige deine neue E-Mail-Adresse",
    body: "Du hast die E-Mail-Adresse deines Au Fil des Saveurs-Kontos auf diese geändert. Klicke zur Bestätigung.",
    cta: "Neue Adresse bestätigen",
    fallback: "Falls der Button nicht funktioniert, kopiere diese Adresse in deinen Browser:",
    expires: "Dieser Link ist 24 Stunden gültig.",
    ignore: "Solltest du diese Änderung nicht angefordert haben, ignoriere diese E-Mail — es wird nichts geändert.",
  },
  en: {
    heading: "Confirm your new email address",
    body: "You asked to change the email address on your Au Fil des Saveurs account to this one. Click to confirm.",
    cta: "Confirm new address",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "This link is valid for 24 hours.",
    ignore: "If you didn't request this change, ignore this email — nothing will be changed.",
  },
};

export function EmailChangeVerifyEmail({
  locale,
  confirmUrl,
}: {
  locale: Locale;
  confirmUrl: string;
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
          href={confirmUrl}
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
        <a href={confirmUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {confirmUrl}
        </a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#7a5a3c", marginTop: 4 }}>{s.ignore}</p>
    </div>
  );
}
