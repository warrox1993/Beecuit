"use client";
import { useConsent } from "@/components/consent/ConsentProvider";

/**
 * Charge les scripts non-essentiels UNIQUEMENT après consentement.
 * Aujourd'hui aucun script réel : points d'insertion prêts pour le jour où
 * un outil (Google Analytics, Vercel Analytics, pixel Meta) sera ajouté.
 */
export function ConsentScripts() {
  const { consent } = useConsent();

  return (
    <>
      {/* analytics: insérer ici le script analytics quand consent.analytics est true
          ex. <Script src=".../gtag.js" strategy="afterInteractive" /> + init */}
      {consent?.analytics && null}

      {/* marketing: insérer ici le pixel marketing quand consent.marketing est true
          ex. Meta Pixel <Script id="meta-pixel" strategy="afterInteractive">...</Script> */}
      {consent?.marketing && null}
    </>
  );
}
