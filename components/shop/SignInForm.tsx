"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signInWithPassword } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function SignInForm({
  locale,
  callbackUrl,
}: {
  locale: string;
  callbackUrl?: string;
}) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => signInWithPassword(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      <label className="block">
        <span className="text-warm-brown text-sm">{t("emailLabel")}<span aria-hidden="true" className="text-terracotta ml-0.5">*</span></span>
        <input
          type="email"
          name="email"
          required
          autoComplete="username"
          placeholder={t("emailPlaceholder")}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <label className="block">
        <div className="flex items-baseline justify-between">
          <span className="text-warm-brown text-sm">{t("passwordLabel")}<span aria-hidden="true" className="text-terracotta ml-0.5">*</span></span>
          <Link
            href="/forgot-password"
            className="text-warm-brown/70 hover:text-honey-dark text-xs underline"
          >
            {t("forgotLink")}
          </Link>
        </div>
        <input
          type="password"
          name="password"
          required
          minLength={12}
          autoComplete="current-password"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <Button
        type="submit"
        disabled={pending}
        className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base"
      >
        {t("signInSubmit")} →
      </Button>
    </form>
  );
}
