"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Admin error boundary. The /admin tree lives outside the [locale] segment so
 * there is no next-intl provider — copy is hard-coded FR (admin is FR-only).
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-warm-brown font-display text-2xl">
        Une erreur est survenue
      </h1>
      <p className="text-warm-brown/70 max-w-md text-sm">
        Une erreur est survenue dans le tableau de bord. Réessayez ou revenez à
        l&apos;accueil de l&apos;administration.
      </p>
      {error.digest && (
        <p className="text-warm-brown/40 font-mono text-xs">
          Réf : {error.digest}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="bg-cta-primary text-cream hover:bg-cta-primary-hover rounded-full px-6 py-3 text-sm font-medium"
        >
          Réessayer
        </button>
        <Link
          href="/admin"
          className="text-warm-brown/70 hover:text-warm-brown text-sm underline-offset-4 hover:underline"
        >
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
