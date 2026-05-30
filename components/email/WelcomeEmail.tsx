import * as React from "react";

type Locale = "fr" | "nl" | "de" | "en";

const STRINGS: Record<Locale, { heading: string; body: string; cta: string }> = {
  fr: {
    heading: "Bienvenue chez Au Fil des Saveurs",
    body: "Ton compte est créé. On t'a aussi envoyé un email pour vérifier ton adresse — pense à cliquer dessus quand tu as un moment. En attendant, jette un œil à notre atelier.",
    cta: "Découvrir nos biscuits",
  },
  nl: {
    heading: "Welkom bij Au Fil des Saveurs",
    body: "Je account is aangemaakt. We hebben je ook een e-mail gestuurd om je adres te verifiëren — klik erop wanneer je een momentje hebt. Bekijk ondertussen ons atelier.",
    cta: "Onze koekjes ontdekken",
  },
  de: {
    heading: "Willkommen bei Au Fil des Saveurs",
    body: "Dein Konto ist eingerichtet. Wir haben dir auch eine E-Mail zur Adressbestätigung geschickt — klicke darauf, wenn du Zeit hast. Schau bis dahin gerne in unsere Werkstatt.",
    cta: "Unsere Kekse entdecken",
  },
  en: {
    heading: "Welcome to Au Fil des Saveurs",
    body: "Your account is ready. We also sent you a separate email to verify your address — click on it whenever you have a moment. Meanwhile, take a look at our atelier.",
    cta: "Discover our biscuits",
  },
};

export function WelcomeEmail({ locale, shopUrl }: { locale: Locale; shopUrl: string }) {
  const s = STRINGS[locale];
  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#fbf6ee", color: "#3d2817", padding: 32 }}>
      <div style={{ fontFamily: "Snell Roundhand, cursive", color: "#a8731b", fontSize: 24 }}>
        Au fil des saveurs
      </div>
      <h1 style={{ fontSize: 28, marginTop: 12, marginBottom: 8, fontWeight: 500 }}>{s.heading}</h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>{s.body}</p>
      <p style={{ marginTop: 24 }}>
        <a
          href={shopUrl}
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
    </div>
  );
}
