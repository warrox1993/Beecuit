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
    heading: "Ton compte sera supprimé dans 30 jours",
    body: "Tu as demandé la suppression de ton compte Au Fil des Saveurs. Tes données seront effacées le {expiresHuman}. Tu peux annuler à tout moment d'ici là.",
    cta: "Annuler la suppression",
    fallback: "Si le bouton ne fonctionne pas, copie-colle cette adresse dans ton navigateur :",
    expires: "Ce lien est valable 30 jours.",
    ignore: "Si tu n'as pas demandé cette suppression, clique sur le bouton immédiatement et change ton mot de passe.",
  },
  nl: {
    heading: "Je account wordt over 30 dagen verwijderd",
    body: "Je hebt om de verwijdering van je Au Fil des Saveurs-account gevraagd. Je gegevens worden gewist op {expiresHuman}. Je kunt tot dan annuleren.",
    cta: "Verwijdering annuleren",
    fallback: "Als de knop niet werkt, kopieer en plak deze link in je browser:",
    expires: "Deze link is 30 dagen geldig.",
    ignore: "Heb jij deze verwijdering niet aangevraagd? Klik direct op de knop en wijzig je wachtwoord.",
  },
  de: {
    heading: "Dein Konto wird in 30 Tagen gelöscht",
    body: "Du hast die Löschung deines Au Fil des Saveurs-Kontos angefordert. Deine Daten werden am {expiresHuman} entfernt. Du kannst bis dahin abbrechen.",
    cta: "Löschung abbrechen",
    fallback: "Falls der Button nicht funktioniert, kopiere diese Adresse in deinen Browser:",
    expires: "Dieser Link ist 30 Tage gültig.",
    ignore: "Solltest du die Löschung nicht angefordert haben, klicke sofort auf den Button und ändere dein Passwort.",
  },
  en: {
    heading: "Your account will be deleted in 30 days",
    body: "You requested the deletion of your Au Fil des Saveurs account. Your data will be erased on {expiresHuman}. You can cancel until then.",
    cta: "Cancel deletion",
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    expires: "This link is valid for 30 days.",
    ignore: "If you didn't request this deletion, click the button immediately and change your password.",
  },
};

export function AccountDeletionRequestedEmail({
  locale,
  cancelUrl,
  expiresHuman,
}: {
  locale: Locale;
  cancelUrl: string;
  expiresHuman: string;
}) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>
        {s.body.replace("{expiresHuman}", expiresHuman)}
      </p>
      <p style={{ marginTop: 24 }}>
        <a
          href={cancelUrl}
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
        <a href={cancelUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {cancelUrl}
        </a>
      </p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>{s.expires}</p>
      <p style={{ fontSize: 11, color: "#a13b1f", marginTop: 4, fontWeight: 600 }}>{s.ignore}</p>
    </div>
  );
}
