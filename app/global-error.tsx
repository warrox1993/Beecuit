"use client";

import { useEffect } from "react";

/**
 * Root error boundary — replaces the root layout when an error is thrown in
 * the root layout itself (before the locale provider mounts). It must render
 * its own <html>/<body>. No next-intl context here, so copy is hard-coded FR
 * with a minimal inline style (globals.css is not guaranteed to apply).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#faf6ef",
          color: "#2c1810",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.6rem", marginBottom: "0.75rem" }}>
            Une erreur est survenue
          </h1>
          <p style={{ opacity: 0.75, lineHeight: 1.6, marginBottom: "1.75rem" }}>
            Quelque chose s&apos;est mal passé de notre côté. Vous pouvez
            réessayer ou revenir à l&apos;accueil.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: "9999px",
                padding: "0.85rem 1.75rem",
                fontSize: "1rem",
                backgroundColor: "#b3541e",
                color: "#faf6ef",
              }}
            >
              Réessayer
            </button>
            {/* Full reload is intentional here: global-error renders outside
                the router tree, so next/link would have no router context. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                alignSelf: "center",
                color: "#2c1810",
                opacity: 0.7,
                fontSize: "0.9rem",
              }}
            >
              Retour à l&apos;accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
