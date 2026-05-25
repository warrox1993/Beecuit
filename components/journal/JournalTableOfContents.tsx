"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toSlug } from "@/lib/slug";
import type { ProseMirrorNode } from "@/lib/journal/prosemirror-types";

function extractH2s(node: ProseMirrorNode, out: string[] = []): string[] {
  if (node.type === "heading" && node.attrs.level === 2) {
    const text = (node.content ?? [])
      .map((c) => ("text" in c ? c.text : ""))
      .join("");
    if (text) out.push(text);
  }
  if ("content" in node && Array.isArray(node.content)) {
    for (const c of node.content) extractH2s(c, out);
  }
  return out;
}

export function JournalTableOfContents({ body }: { body: ProseMirrorNode }) {
  const t = useTranslations("journal");
  const headings = extractH2s(body);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    headings.forEach((h) => {
      const el = document.getElementById(toSlug(h));
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <nav className="sticky top-24 hidden text-sm lg:block" aria-label={t("tableOfContents")}>
      <div className="text-warm-brown/60 mb-2 text-xs uppercase tracking-wider">
        {t("tableOfContents")}
      </div>
      <ul className="space-y-1">
        {headings.map((h) => {
          const id = toSlug(h);
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`block border-l-2 py-1 pl-3 transition ${
                  active === id
                    ? "border-honey-dark text-honey-dark"
                    : "border-warm-brown/10 text-warm-brown/70 hover:text-warm-brown"
                }`}
              >
                {h}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
