import type { LegalDocument } from "./types";
import mentionsFr from "./mentions-legales/fr";
import mentionsNl from "./mentions-legales/nl";
import mentionsDe from "./mentions-legales/de";
import mentionsEn from "./mentions-legales/en";
import cgvFr from "./cgv/fr";
import cgvNl from "./cgv/nl";
import cgvDe from "./cgv/de";
import cgvEn from "./cgv/en";

export type LegalPageKey = "cgv" | "mentions-legales" | "confidentialite" | "cookies";

const DOCS: Record<LegalPageKey, Record<string, LegalDocument>> = {
  "mentions-legales": { fr: mentionsFr, nl: mentionsNl, de: mentionsDe, en: mentionsEn },
  cgv: { fr: cgvFr, nl: cgvNl, de: cgvDe, en: cgvEn },
  // confidentialite / cookies ajoutés dans les tâches suivantes
} as unknown as Record<LegalPageKey, Record<string, LegalDocument>>;

export function getLegalDocument(key: LegalPageKey, locale: string): LegalDocument {
  const byLocale = DOCS[key];
  return byLocale[locale] ?? byLocale.fr!;
}
