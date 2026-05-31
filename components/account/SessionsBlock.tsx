"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { revokeSession, revokeAllOtherSessions } from "@/lib/actions/auth.actions";
import { Button } from "@/components/ui/button";

export type SessionRow = {
  sessionToken: string;
  label: string;
  city: string | null;
  country: string | null;
  lastSeenLabel: string;
  isCurrent: boolean;
};

export function SessionsBlock({ sessions }: { sessions: SessionRow[] }) {
  const t = useTranslations("auth");
  const [pending, start] = useTransition();
  const hasOthers = sessions.some((s) => !s.isCurrent);

  return (
    <div className="space-y-4">
      <ul className="divide-warm-brown/10 divide-y">
        {sessions.map((s) => (
          <li key={s.sessionToken} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-warm-brown text-sm font-medium">
                {s.label}
                {s.isCurrent && <span className="text-honey-dark ml-2 text-xs">· {t("sessionCurrent")}</span>}
              </p>
              <p className="text-warm-brown/60 text-xs">
                {[s.city, s.country].filter(Boolean).join(", ")}
                {s.city && " · "}
                {s.lastSeenLabel}
              </p>
            </div>
            {!s.isCurrent && (
              <form
                action={(fd) => start(() => revokeSession(fd).then(() => {}))}
              >
                <input type="hidden" name="sessionToken" value={s.sessionToken} />
                <button type="submit" disabled={pending} className="text-terracotta text-xs underline">
                  {t("sessionRevoke")}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {hasOthers && (
        <form action={() => start(() => revokeAllOtherSessions().then(() => {}))}>
          <Button type="submit" variant="outline" disabled={pending}>{t("sessionRevokeAllOthers")}</Button>
        </form>
      )}
    </div>
  );
}
