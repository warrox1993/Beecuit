import * as React from "react";

export function NewsletterConfirmationEmail({
  confirmUrl,
  journalOptIn,
}: {
  confirmUrl: string;
  journalOptIn: boolean;
}) {
  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "#fbf6ee",
        color: "#3d2817",
        padding: 32,
      }}
    >
      <h1 style={{ color: "#a8731b" }}>Confirmez votre inscription</h1>
      <p>Merci de votre intérêt pour Au Fil des Saveurs.</p>
      <p>
        Cliquez sur le bouton ci-dessous pour confirmer votre inscription
        {journalOptIn ? " à notre newsletter et à notre journal" : " à notre newsletter"}.
      </p>
      <a
        href={confirmUrl}
        style={{
          display: "inline-block",
          padding: "12px 24px",
          background: "#a8731b",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 6,
        }}
      >
        Confirmer
      </a>
      <p style={{ fontSize: 12, color: "#7a5a3c", marginTop: 24 }}>
        Si vous n'êtes pas à l'origine de cette inscription, ignorez cet email.
      </p>
    </div>
  );
}
