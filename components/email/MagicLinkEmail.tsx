import * as React from "react";

export function MagicLinkEmail({
  signInUrl,
  expiresInHours = 24,
}: {
  signInUrl: string;
  expiresInHours?: number;
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
      <div
        style={{
          fontFamily: "Snell Roundhand, cursive",
          color: "#a8731b",
          fontSize: 24,
        }}
      >
        Au fil des saveurs
      </div>
      <h1
        style={{
          fontSize: 26,
          color: "#3d2817",
          marginTop: 12,
          marginBottom: 8,
          fontWeight: 500,
        }}
      >
        Ton lien de connexion
      </h1>
      <p style={{ color: "#5a4030", fontSize: 16, lineHeight: 1.5, marginTop: 16 }}>
        Clique sur le bouton ci-dessous pour te connecter à ton compte. Le lien est valable {expiresInHours} heures
        et ne fonctionne qu&apos;une seule fois.
      </p>
      <p style={{ marginTop: 24 }}>
        <a
          href={signInUrl}
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
          Se connecter à Au Fil des Saveurs
        </a>
      </p>
      <p style={{ color: "#7a5a3c", fontSize: 13, lineHeight: 1.5, marginTop: 24 }}>
        Si le bouton ne fonctionne pas, copie-colle cette adresse dans ton navigateur :
        <br />
        <a href={signInUrl} style={{ color: "#a8731b", wordBreak: "break-all" }}>
          {signInUrl}
        </a>
      </p>
      <hr
        style={{
          border: "none",
          borderTop: "1px solid #e8dcc4",
          margin: "32px 0 16px",
        }}
      />
      <p style={{ fontSize: 11, color: "#7a5a3c", margin: 0 }}>
        Si tu n&apos;as pas demandé ce lien, tu peux ignorer cet email — personne ne pourra accéder à ton compte sans
        cliquer dessus.
      </p>
    </div>
  );
}
