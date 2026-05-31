import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, { heading: string; body: string; warn: string }> = {
  fr: {
    heading: "Double authentification désactivée",
    body: "La double authentification (2FA) vient d'être désactivée sur ton compte Au Fil des Saveurs via le lien envoyé par email. Tu peux désormais te connecter avec ton mot de passe seul.",
    warn: "Si tu n'es pas à l'origine de cette action, reconnecte-toi, réactive la 2FA et change ton mot de passe immédiatement.",
  },
  nl: {
    heading: "Tweestapsverificatie uitgeschakeld",
    body: "Tweestapsverificatie (2FA) is zojuist uitgeschakeld op je Au Fil des Saveurs-account via de e-maillink. Je kunt nu aanmelden met alleen je wachtwoord.",
    warn: "Heb jij dit niet gedaan? Meld je opnieuw aan, schakel 2FA opnieuw in en wijzig onmiddellijk je wachtwoord.",
  },
  de: {
    heading: "Zwei-Faktor-Authentifizierung deaktiviert",
    body: "Die Zwei-Faktor-Authentifizierung (2FA) wurde soeben über den per E-Mail gesendeten Link für dein Au Fil des Saveurs-Konto deaktiviert. Du kannst dich jetzt nur mit deinem Passwort anmelden.",
    warn: "Falls du das nicht warst, melde dich erneut an, aktiviere 2FA wieder und ändere sofort dein Passwort.",
  },
  en: {
    heading: "Two-factor authentication disabled",
    body: "Two-factor authentication (2FA) has just been disabled on your Au Fil des Saveurs account via the emailed link. You can now sign in with your password alone.",
    warn: "If this wasn't you, sign back in, re-enable 2FA and change your password immediately.",
  },
};

export function TwoFactorDisabledEmail({ locale }: { locale: Locale }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 26, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
      <hr style={{ border: "none", borderTop: "1px solid #e8dcc4", margin: "32px 0 16px" }} />
      <p style={{ fontSize: 12, color: "#7a5a3c", margin: 0 }}>{s.warn}</p>
    </div>
  );
}
