"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useConsent } from "@/components/consent/ConsentProvider";
import { CrackingCookie } from "@/components/consent/CrackingCookie";

export function CookieConsentBanner() {
  const t = useTranslations("consent");
  const { consent, showBanner, prefsOpen, acceptAll, rejectAll, save, openPreferences, closePreferences } = useConsent();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const visible = showBanner || prefsOpen;

  // À l'ouverture du panneau, pré-remplir avec le choix déjà enregistré + déplacer le focus.
  useEffect(() => {
    if (prefsOpen) {
      setAnalytics(consent?.analytics ?? false);
      setMarketing(consent?.marketing ?? false);
      dialogRef.current?.focus();
    }
  }, [prefsOpen, consent]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={dialogRef}
          tabIndex={-1}
          className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4 outline-none"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          role="dialog"
          aria-label={t("title")}
          aria-modal={prefsOpen || undefined}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (prefsOpen) closePreferences();
              else rejectAll();
            }
          }}
        >
          <div className="border-honey/20 grid w-full max-w-[620px] grid-cols-[132px_1fr] items-center gap-x-6 gap-y-2 overflow-hidden rounded-[22px] border bg-[linear-gradient(180deg,#fffdf9,#fdf7ec)] p-5 shadow-[0_18px_50px_-12px_rgba(61,40,23,.30)] max-sm:grid-cols-1 max-sm:justify-items-center max-sm:text-center">
            <div className="row-span-2 justify-self-center max-sm:row-span-1">
              <CrackingCookie />
            </div>

            <div>
              <p className="text-honey-dark text-[11px] font-semibold tracking-[0.18em] uppercase">
                {t("eyebrow")}
              </p>
              <h2 className="text-warm-brown mt-1 text-lg font-semibold">{t("title")}</h2>
              <p className="text-warm-brown/70 mt-1.5 text-sm leading-relaxed">
                {t("description")}{" "}
                <Link href="/cookies" className="text-honey-dark underline">
                  {t("learnMore")}
                </Link>
              </p>

              {!prefsOpen ? (
                <div className="mt-3.5 flex flex-wrap gap-2.5 max-sm:justify-center">
                  <button onClick={acceptAll} className="bg-honey text-cream hover:bg-honey-dark rounded-full px-4 py-2 text-sm font-semibold">
                    {t("acceptAll")}
                  </button>
                  <button onClick={rejectAll} className="border-warm-brown/20 text-warm-brown hover:bg-honey/5 rounded-full border px-4 py-2 text-sm font-semibold">
                    {t("reject")}
                  </button>
                  <button onClick={openPreferences} className="text-honey-dark px-2 py-2 text-sm font-semibold underline">
                    {t("customize")}
                  </button>
                </div>
              ) : (
                <div className="mt-3.5">
                  <ul className="space-y-2">
                    <li className="text-warm-brown/80 flex items-center justify-between gap-3 text-sm">
                      <span>{t("catNecessary")}</span>
                      <span className="text-warm-brown/40 text-xs">{t("alwaysOn")}</span>
                    </li>
                    <li className="text-warm-brown/80 flex items-center justify-between gap-3 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
                        {t("catAnalytics")}
                      </label>
                    </li>
                    <li className="text-warm-brown/80 flex items-center justify-between gap-3 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
                        {t("catMarketing")}
                      </label>
                    </li>
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2.5 max-sm:justify-center">
                    <button onClick={() => save({ analytics, marketing })} className="bg-honey text-cream hover:bg-honey-dark rounded-full px-4 py-2 text-sm font-semibold">
                      {t("save")}
                    </button>
                    <button onClick={closePreferences} className="text-warm-brown/60 px-2 py-2 text-sm underline">
                      {t("back")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
