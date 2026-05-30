"use client";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

export function LinkedAccountsBlock({ googleLinked }: { googleLinked: boolean }) {
  const t = useTranslations("auth");
  return (
    <div className="flex items-center justify-between border-warm-brown/10 border-t pt-4">
      <div className="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden focusable="false">
          <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.4z"/>
          <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.2-3.8H.8v2.3C2.3 15.9 5.4 18 9 18z"/>
          <path fill="#FBBC05" d="M3.8 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.8C.3 6.1 0 7.5 0 9s.3 2.9.8 4l3-2.3z"/>
          <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3L15 2.4C13.5.9 11.4 0 9 0 5.4 0 2.3 2.1.8 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/>
        </svg>
        <span className="text-warm-brown text-sm">Google</span>
      </div>
      {googleLinked ? (
        <span className="text-honey-dark text-xs font-medium">✓ Lié</span>
      ) : (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/compte/profil" })}
          className="text-honey-dark text-xs font-medium underline"
        >
          {t("signInWithGoogle")}
        </button>
      )}
    </div>
  );
}
