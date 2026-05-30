"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export function PreferencesBlock({
  locale,
  preferredLocale,
  newsletterOptIn,
}: {
  locale: string;
  preferredLocale: "fr" | "nl" | "de" | "en";
  newsletterOptIn: boolean;
}) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => updateProfile(fd))}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      <label className="block">
        <span className="text-warm-brown text-sm">Langue préférée</span>
        <select
          name="preferredLocale"
          defaultValue={preferredLocale}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-2.5 text-sm focus:ring-2 focus:outline-none"
        >
          <option value="fr">Français</option>
          <option value="nl">Nederlands</option>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-warm-brown">
        <input
          type="checkbox"
          name="newsletterOptIn"
          defaultChecked={newsletterOptIn}
        />
        <span>{t("signUpNewsletter")}</span>
      </label>
      <Button type="submit" disabled={pending} variant="outline">
        Enregistrer
      </Button>
    </form>
  );
}
