"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function JournalShareButtons({
  url,
  title,
  excerpt,
  pinterestImage,
}: {
  url: string;
  title: string;
  excerpt: string;
  pinterestImage: string;
}) {
  const t = useTranslations("journal.share");
  const [copied, setCopied] = useState(false);

  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const pinUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(
    url,
  )}&media=${encodeURIComponent(pinterestImage)}&description=${encodeURIComponent(title)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
    excerpt,
  )}%0A%0A${encodeURIComponent(url)}`;

  const btnClass =
    "border-warm-brown/20 text-warm-brown hover:bg-honey/10 rounded-full border px-4 py-2 text-sm transition";

  return (
    <div className="border-warm-brown/10 my-10 flex flex-wrap items-center justify-center gap-2 border-t pt-6">
      <span className="text-warm-brown/60 text-sm">{t("label")} ·</span>
      <a
        href={pinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        aria-label={t("pinterest")}
      >
        📌 {t("pinterest")}
      </a>
      <a
        href={fbUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={btnClass}
        aria-label={t("facebook")}
      >
        f {t("facebook")}
      </a>
      <a href={mailUrl} className={btnClass} aria-label={t("email")}>
        ✉ {t("email")}
      </a>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className={btnClass}
      >
        {copied ? t("copied") : `🔗 ${t("copy")}`}
      </button>
    </div>
  );
}
