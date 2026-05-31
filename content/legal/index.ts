import type { LegalDocument } from "./types";
import mentionsFr from "./mentions-legales/fr";
import mentionsNl from "./mentions-legales/nl";
import mentionsDe from "./mentions-legales/de";
import mentionsEn from "./mentions-legales/en";
import cgvFr from "./cgv/fr";
import cgvNl from "./cgv/nl";
import cgvDe from "./cgv/de";
import cgvEn from "./cgv/en";
import confidentialiteFr from "./confidentialite/fr";
import confidentialiteNl from "./confidentialite/nl";
import confidentialiteDe from "./confidentialite/de";
import confidentialiteEn from "./confidentialite/en";

export type LegalPageKey = "cgv" | "mentions-legales" | "confidentialite" | "cookies";

const DOCS: Record<LegalPageKey, Record<string, LegalDocument>> = {
  "mentions-legales": { fr: mentionsFr, nl: mentionsNl, de: mentionsDe, en: mentionsEn },
  cgv: { fr: cgvFr, nl: cgvNl, de: cgvDe, en: cgvEn },
  confidentialite: { fr: confidentialiteFr, nl: confidentialiteNl, de: confidentialiteDe, en: confidentialiteEn },
  // cookies ajouté dans la tâche suivante
} as unknown as Record<LegalPageKey, Record<string, LegalDocument>>;

export function getLegalDocument(key: LegalPageKey, locale: string): LegalDocument {
  const byLocale = DOCS[key];
  return byLocale[locale] ?? byLocale.fr!;
}
