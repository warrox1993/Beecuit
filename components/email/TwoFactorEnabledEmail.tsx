import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, { heading: string; body: string; warn: string }> = {
  fr: {
    heading: "Authentification à deux facteurs activée",
    body: "La double authentification (2FA) vient d'être activée sur ton compte Au Fil des Saveurs. À chaque connexion, un code de ton application sera désormais demandé.",
    warn: "Si tu n'es pas à l'origine de ce changement, change immédiatement ton mot de passe.",
  },
  nl: {
    heading: "Tweestapsverificatie ingeschakeld",
    body: "Tweestapsverificatie (2FA) is zojuist ingeschakeld op je Au Fil des Saveurs-account. Bij elke aanmelding wordt voortaan een code uit je app gevraagd.",
    warn: "Heb jij dit niet gedaan? Wijzig dan onmiddellijk je wachtwoord.",
  },
  de: {
    heading: "Zwei-Faktor-Authentifizierung aktiviert",
    body: "Die Zwei-Faktor-Authentifizierung (2FA) wurde soeben für dein Au Fil des Saveurs-Konto aktiviert. Bei jeder Anmeldung wird künftig ein Code aus deiner App abgefragt.",
    warn: "Falls du das nicht warst, ändere sofort dein Passwort.",
  },
  en: {
    heading: "Two-factor authentication enabled",
    body: "Two-factor authentication (2FA) has just been enabled on your Au Fil des Saveurs account. From now on a code from your app will be required at each sign-in.",
    warn: "If this wasn't you, change your password immediately.",
  },
};

export function TwoFactorEnabledEmail({ locale }: { locale: Locale }) {
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
