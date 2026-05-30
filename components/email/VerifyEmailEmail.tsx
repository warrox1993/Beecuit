import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, {
  preheader: string;
  heading: string;
  body: string;
  cta: string;
  fallback: string;
  expires: string;
  ignore: string;
}> = {
  fr: {
    preheader: "Confirme ton adresse email",
    heading: "Confirme ton adresse email",
    body: "Clique sur le bouton ci-dessous pour confirmer ton adresse — ça nous permet de t'envoyer tes confirmations de commande et nos petites attentions.",
    cta: "Confirmer mon adresse",
    fallback: "Si le bouton ne fonctionne pas, copie-colle cette adresse dans ton navigateur :",
    expires: "Ce lien est valable 24 heures.",
    ignore: "Si tu n'es pas à l'origine de cette inscription, tu peux ignorer cet email.",
  },
  nl: {
    preheader: "Bevestig je e-mailadres",
    heading: "Bevestig je e-mailadres",
    body: "Klik op de knop hieronder om je e-mailadres te bevestigen — zo kunnen we je bestelbevestigingen sturen.",
    cta: "Mijn adres bevestigen",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "Deze link is 24 uur geldig.",
    ignore: "Als jij deze registratie niet hebt gestart, kun je deze e-mail negeren.",
  },
  de: {
    preheader: "Bestätige deine E-Mail-Adresse",
    heading: "Bestätige deine E-Mail-Adresse",
    body: "Klicke unten, um deine E-Mail-Adresse zu bestätigen — so können wir dir Bestellbestätigungen senden.",
    cta: "Adresse bestätigen",
    fallback: "Falls der Button nicht funktioniert, kopiere diese Adresse in deinen Browser:",
    expires: "Dieser Link ist 24 Stunden gültig.",
    ignore: "Solltest du diese Registrierung nicht ausgelöst haben, ignoriere diese E-Mail.",
  },
  en: {
    preheader: "Confirm your email address",
    heading: "Confirm your email address",
    body: "Click the button below to confirm your address — it lets us send your order receipts and our news.",
    cta: "Confirm my address",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "This link is valid for 24 hours.",
    ignore: "If you didn't sign up, you can ignore this email.",
  },
};

export function VerifyEmailEmail({ locale, verifyUrl }: { locale: Locale; verifyUrl: string }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, color: "#3d2817", marginTop: 12, marginBottom: 8, fontWeight: 500 }}>
        {s.heading}
      </h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
      <p style={{ marginTop: 24 }}>
        <a
          href={verifyUrl}
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
        <a href={verifyUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {verifyUrl}
        </a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#7a5a3c", marginTop: 4 }}>{s.ignore}</p>
    </div>
  );
}
