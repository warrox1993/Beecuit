"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { scorePassword } from "@/lib/auth/password-strength";
import { checkPasswordBreached } from "@/lib/actions/auth.actions";

const BAR_COLORS = ["bg-terracotta", "bg-terracotta", "bg-honey", "bg-honey-dark", "bg-green-600"];

export function PasswordStrengthMeter({ password, email }: { password: string; email?: string }) {
  const t = useTranslations("auth");
  const { score, labelKey, suggestionKeys } = scorePassword(password, { email });
  const [breached, setBreached] = useState(false);

  useEffect(() => {
    if (!password || password.length < 4) {
      setBreached(false);
      return;
    }
    const id = setTimeout(async () => {
      const res = await checkPasswordBreached(password);
      setBreached(res.breached);
    }, 500);
    return () => clearTimeout(id);
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded ${i < score ? BAR_COLORS[score]! : "bg-warm-brown/15"}`}
          />
        ))}
      </div>
      <p className="text-warm-brown/70 text-xs">
        {t(labelKey as Parameters<typeof t>[0])}
        {suggestionKeys.length > 0 && ` — ${suggestionKeys.map((k) => t(k as Parameters<typeof t>[0])).join(", ")}`}
      </p>
      {breached && <p className="text-terracotta text-xs">{t("strengthBreached")}</p>}
    </div>
  );
}
