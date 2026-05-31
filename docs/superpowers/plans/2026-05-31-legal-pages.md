# Pages légales (sous-projet 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les 4 placeholders « Bientôt disponible » (`/cgv`, `/mentions-legales`, `/confidentialite`, `/cookies`) par de vraies pages de contenu juridique multilingue (FR/NL/DE/EN), conformes au droit belge/UE au 31/05/2026, avec les infos entreprise en placeholders `[ ]` marqués visuellement.

**Architecture:** Le contenu vit dans des **modules TS typés** par page × langue (`content/legal/<page>/<locale>.ts`), agrégés par un **registry** (`getLegalDocument`). Un **composant serveur partagé `LegalPage`** rend un `LegalDocument` avec les primitives existantes (`Section`/`Container`/`Eyebrow`/`Heading`/`Prose`). Un helper `renderWithPlaceholders` détecte les `[...]` et les met en valeur via `<PlaceholderText>`. Les 4 `page.tsx` deviennent de minces wrappers + `generateMetadata` SEO.

**Tech Stack:** Next.js 15 App Router (server components), next-intl (fr/nl/de/en), TypeScript strict (noUncheckedIndexedAccess), vitest, Tailwind. Repo **pnpm** + `npm run` scripts.

**Spec:** `docs/superpowers/specs/2026-05-31-legal-and-contact-pages-design.md`

**Conventions vérifiées :**
- Primitives : `Container` (`variant?: "default" | "narrow"`), `Section` (`py?: "sm"|"md"|"lg"`, `bg?`), `Eyebrow` (children), `Heading` (`as?: "h1"|"h2"|"h3"`, `size?: "display"|"h1"|"h2"|"h3"`), `Prose` (children, className). Toutes dans `components/ui-primitives/`.
- Page actuelle (à remplacer) : `setRequestLocale(locale)` puis `<ComingSoonPage pageKey="cgv" />`.
- i18n : `getTranslations` (server). Pour `generateMetadata`, utiliser `getTranslations({ locale, namespace })`.
- TS strict `noUncheckedIndexedAccess` : prévoir `!` ou garde sur les accès indexés.
- `@/` = racine du repo.
- **Avertissement** : contenu juridique standard, pas un conseil juridique ; placeholders `[ ]` = infos entreprise à compléter par le client.

---

## File Structure

**Créer :**
- `content/legal/types.ts` — types `LegalDocument`/`LegalSection`/`LegalBlock` + helper `renderWithPlaceholders`
- `content/legal/mentions-legales/{fr,nl,de,en}.ts`
- `content/legal/cgv/{fr,nl,de,en}.ts`
- `content/legal/confidentialite/{fr,nl,de,en}.ts`
- `content/legal/cookies/{fr,nl,de,en}.ts`
- `content/legal/index.ts` — registry `getLegalDocument(key, locale)`
- `components/legal/Placeholder.tsx` — `<PlaceholderText text>`
- `components/legal/LegalPage.tsx` — composant de rendu
- `tests/unit/legal-content.test.ts` — `renderWithPlaceholders` + `getLegalDocument`

**Modifier :**
- `app/[locale]/(shop)/{cgv,mentions-legales,confidentialite,cookies}/page.tsx`
- `messages/{fr,nl,de,en}.json` — namespace `legal` (eyebrow, lastUpdated, seo.*)

---

## Task 1 : Types + helper `renderWithPlaceholders`

**Files:**
- Create: `content/legal/types.ts`
- Test: `tests/unit/legal-content.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

Create `tests/unit/legal-content.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renderWithPlaceholders } from "@/content/legal/types";

describe("renderWithPlaceholders", () => {
  it("découpe un placeholder au milieu du texte", () => {
    expect(renderWithPlaceholders("Éditeur : [Raison sociale], sis à [Adresse].")).toEqual([
      { text: "Éditeur : ", placeholder: false },
      { text: "[Raison sociale]", placeholder: true },
      { text: ", sis à ", placeholder: false },
      { text: "[Adresse]", placeholder: true },
      { text: ".", placeholder: false },
    ]);
  });

  it("renvoie un seul segment quand il n'y a pas de placeholder", () => {
    expect(renderWithPlaceholders("Texte simple")).toEqual([
      { text: "Texte simple", placeholder: false },
    ]);
  });

  it("gère deux placeholders adjacents", () => {
    expect(renderWithPlaceholders("[A][B]")).toEqual([
      { text: "[A]", placeholder: true },
      { text: "[B]", placeholder: true },
    ]);
  });
});
```

- [ ] **Step 2 : Lancer le test (échoue)**

Run: `npx vitest run tests/unit/legal-content.test.ts`
Expected: FAIL — module `@/content/legal/types` introuvable.

- [ ] **Step 3 : Écrire les types + le helper**

Create `content/legal/types.ts`:

```ts
export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[] };

export type LegalSection = { heading: string; blocks: LegalBlock[] };

export type LegalDocument = {
  title: string;
  intro?: string;
  lastUpdatedLabel: string;
  sections: LegalSection[];
};

export type TextSegment = { text: string; placeholder: boolean };

/** Découpe un texte en segments, en isolant les `[placeholders]` (crochets conservés). */
export function renderWithPlaceholders(text: string): TextSegment[] {
  const out: TextSegment[] = [];
  const re = /\[[^\]]+\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), placeholder: false });
    out.push({ text: m[0], placeholder: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), placeholder: false });
  return out;
}
```

- [ ] **Step 4 : Lancer le test (passe)**

Run: `npx vitest run tests/unit/legal-content.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5 : Typecheck + commit**

Run: `npm run typecheck` → clean.
```bash
git add content/legal/types.ts tests/unit/legal-content.test.ts
git commit -m "feat(legal): LegalDocument types + renderWithPlaceholders helper"
```

---

## Task 2 : Composants `PlaceholderText` + `LegalPage`

**Files:**
- Create: `components/legal/Placeholder.tsx`
- Create: `components/legal/LegalPage.tsx`

- [ ] **Step 1 : `PlaceholderText`**

Create `components/legal/Placeholder.tsx`:

```tsx
import * as React from "react";
import { renderWithPlaceholders } from "@/content/legal/types";

/** Rend un texte en mettant en évidence les [placeholders] à compléter. */
export function PlaceholderText({ text }: { text: string }) {
  return (
    <>
      {renderWithPlaceholders(text).map((seg, i) =>
        seg.placeholder ? (
          <mark
            key={i}
            className="bg-honey-cream text-honey-dark rounded px-1 font-medium"
            title="À compléter"
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        ),
      )}
    </>
  );
}
```

- [ ] **Step 2 : `LegalPage` (rend un LegalDocument)**

Create `components/legal/LegalPage.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { Section } from "@/components/ui-primitives/Section";
import { Container } from "@/components/ui-primitives/Container";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { PlaceholderText } from "@/components/legal/Placeholder";
import { getLegalDocument, type LegalPageKey } from "@/content/legal";
import type { LegalBlock } from "@/content/legal/types";

function BlockView({ block }: { block: LegalBlock }) {
  if (block.type === "subheading") {
    return <h3 className="text-warm-brown mt-6 text-base font-semibold">{block.text}</h3>;
  }
  if (block.type === "list") {
    return (
      <ul className="text-warm-brown/80 list-disc space-y-1 pl-5 text-sm leading-relaxed">
        {block.items.map((it, i) => (
          <li key={i}>
            <PlaceholderText text={it} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="text-warm-brown/80 text-sm leading-relaxed">
      <PlaceholderText text={block.text} />
    </p>
  );
}

export async function LegalPage({ pageKey, locale }: { pageKey: LegalPageKey; locale: string }) {
  const t = await getTranslations("legal");
  const doc = getLegalDocument(pageKey, locale);
  return (
    <Section py="lg">
      <Container variant="narrow">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <Heading as="h1" size="h1" className="mt-3">
          {doc.title}
        </Heading>
        <p className="text-warm-brown/50 mt-3 text-xs">{doc.lastUpdatedLabel}</p>
        {doc.intro && (
          <Prose className="mt-6">
            <p>
              <PlaceholderText text={doc.intro} />
            </p>
          </Prose>
        )}
        <div className="mt-10 space-y-10">
          {doc.sections.map((s, i) => (
            <section key={i}>
              <Heading as="h2" size="h3">
                {s.heading}
              </Heading>
              <div className="mt-4 space-y-4">
                {s.blocks.map((b, j) => (
                  <BlockView key={j} block={b} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 3 : Typecheck**

Run: `npm run typecheck`
Expected: échoue UNIQUEMENT sur `@/content/legal` (registry pas encore créé — Task 3). C'est attendu ; ne pas committer seul. Passe à Task 3 puis reviens vérifier.

> Note : Task 2 et Task 3 forment une unité (composant + registry) ; commit groupé à la fin de Task 3.

---

## Task 3 : Contenu `mentions-legales` (×4) + registry + tests

**Files:**
- Create: `content/legal/mentions-legales/{fr,nl,de,en}.ts`
- Create: `content/legal/index.ts`
- Test: `tests/unit/legal-content.test.ts` (ajout)

- [ ] **Step 1 : Contenu FR** — Create `content/legal/mentions-legales/fr.ts`:

```ts
import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Mentions légales",
  lastUpdatedLabel: "Dernière mise à jour : [date]",
  intro:
    "Les présentes mentions légales sont fournies en application du Code de droit économique belge (livre XII) et de la directive 2000/31/CE sur le commerce électronique.",
  sections: [
    {
      heading: "Éditeur du site",
      blocks: [
        {
          type: "list",
          items: [
            "Dénomination : [Raison sociale]",
            "Forme juridique : [forme juridique]",
            "Siège social : [adresse complète]",
            "Numéro d'entreprise (BCE) : [N° BCE]",
            "Numéro de TVA : [N° TVA]",
            "Email : [email de contact]",
            "Téléphone : [téléphone]",
          ],
        },
        { type: "p", text: "Directeur de la publication : [nom du responsable]." },
      ],
    },
    {
      heading: "Hébergement",
      blocks: [
        {
          type: "p",
          text: "Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis (vercel.com).",
        },
      ],
    },
    {
      heading: "Propriété intellectuelle",
      blocks: [
        {
          type: "p",
          text: "L'ensemble des contenus du site (textes, photographies, illustrations, logo, marque « Au Fil des Saveurs ») est protégé par le droit de la propriété intellectuelle et reste la propriété de [Raison sociale] ou de ses partenaires. Toute reproduction ou utilisation sans autorisation écrite préalable est interdite.",
        },
      ],
    },
    {
      heading: "Signalement de contenu",
      blocks: [
        {
          type: "p",
          text: "Pour signaler un contenu illicite ou exercer un droit, contactez l'éditeur à l'adresse [email de contact].",
        },
      ],
    },
  ],
};

export default doc;
```

- [ ] **Step 2 : Traductions NL/DE/EN** — Create `content/legal/mentions-legales/{nl,de,en}.ts` en **traduisant fidèlement** chaque chaîne du FR ci-dessus. Règles : conserver les placeholders `[ ]` à l'identique, garder l'adresse Vercel telle quelle, adapter les références légales à la langue (ex. NL « Wetboek van economisch recht », EN « Belgian Code of Economic Law »). Même structure de `LegalDocument`, `export default doc`. Exemple d'amorce EN :

```ts
import type { LegalDocument } from "../types";
const doc: LegalDocument = {
  title: "Legal notice",
  lastUpdatedLabel: "Last updated: [date]",
  intro:
    "This legal notice is provided pursuant to Book XII of the Belgian Code of Economic Law and Directive 2000/31/EC on electronic commerce.",
  sections: [ /* … traduire les sections FR, placeholders inchangés … */ ],
};
export default doc;
```

- [ ] **Step 3 : Registry** — Create `content/legal/index.ts`:

```ts
import type { LegalDocument } from "./types";
import mentionsFr from "./mentions-legales/fr";
import mentionsNl from "./mentions-legales/nl";
import mentionsDe from "./mentions-legales/de";
import mentionsEn from "./mentions-legales/en";

export type LegalPageKey = "cgv" | "mentions-legales" | "confidentialite" | "cookies";

const DOCS: Record<LegalPageKey, Record<string, LegalDocument>> = {
  "mentions-legales": { fr: mentionsFr, nl: mentionsNl, de: mentionsDe, en: mentionsEn },
  // cgv / confidentialite / cookies ajoutés dans les tâches suivantes
} as Record<LegalPageKey, Record<string, LegalDocument>>;

export function getLegalDocument(key: LegalPageKey, locale: string): LegalDocument {
  const byLocale = DOCS[key];
  return byLocale[locale] ?? byLocale.fr!;
}
```

> Note : le cast `as Record<...>` est temporaire le temps que les 4 pages soient ajoutées (Tasks 4-6 le compléteront et le retireront en Task 6). `byLocale.fr!` : le fr existe toujours.

- [ ] **Step 4 : Test du registry** — Ajouter à `tests/unit/legal-content.test.ts` :

```ts
import { getLegalDocument } from "@/content/legal";

describe("getLegalDocument", () => {
  it("renvoie le document mentions-legales en FR", () => {
    const d = getLegalDocument("mentions-legales", "fr");
    expect(d.title).toBe("Mentions légales");
    expect(d.sections.length).toBeGreaterThan(0);
  });
  it("retombe sur le FR pour une locale inconnue", () => {
    const d = getLegalDocument("mentions-legales", "xx");
    expect(d.title).toBe("Mentions légales");
  });
  it("a une version par locale supportée", () => {
    for (const l of ["fr", "nl", "de", "en"]) {
      expect(getLegalDocument("mentions-legales", l).sections.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 5 : Tests + typecheck + commit** (Task 2 + 3 ensemble)

Run: `npx vitest run tests/unit/legal-content.test.ts` → PASS. `npm run typecheck` → clean.
```bash
git add content/legal components/legal tests/unit/legal-content.test.ts
git commit -m "feat(legal): LegalPage + PlaceholderText + mentions-legales content (4 locales) + registry"
```

---

## Task 4 : Contenu `cgv` (×4)

**Files:**
- Create: `content/legal/cgv/{fr,nl,de,en}.ts`
- Modify: `content/legal/index.ts`

- [ ] **Step 1 : Contenu FR** — Create `content/legal/cgv/fr.ts`:

```ts
import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Conditions générales de vente",
  lastUpdatedLabel: "Dernière mise à jour : [date]",
  intro:
    "Les présentes conditions générales de vente (CGV) régissent les ventes conclues sur le site Au Fil des Saveurs entre [Raison sociale] (le vendeur) et tout consommateur (l'acheteur). Elles sont soumises au Code de droit économique belge.",
  sections: [
    {
      heading: "1. Identité du vendeur",
      blocks: [{ type: "p", text: "Le vendeur est [Raison sociale], [N° BCE], dont les coordonnées figurent dans les mentions légales." }],
    },
    {
      heading: "2. Champ d'application",
      blocks: [{ type: "p", text: "Toute commande implique l'acceptation sans réserve des présentes CGV, dans leur version en vigueur au jour de la commande." }],
    },
    {
      heading: "3. Produits",
      blocks: [
        { type: "p", text: "Les produits proposés sont des biscuits et coffrets artisanaux. Les photographies sont non contractuelles. Les informations relatives aux ingrédients et allergènes figurent sur chaque fiche produit ; en cas d'allergie, l'acheteur est invité à les consulter avant toute commande." },
      ],
    },
    {
      heading: "4. Prix",
      blocks: [
        { type: "p", text: "Les prix sont indiqués en euros, toutes taxes comprises (TVA belge en vigueur), hors frais de livraison indiqués avant la validation de la commande. [Raison sociale] se réserve le droit de modifier ses prix à tout moment, les produits étant facturés au tarif en vigueur lors de la commande." },
      ],
    },
    {
      heading: "5. Commande",
      blocks: [{ type: "p", text: "La commande est validée après acceptation des CGV et confirmation du paiement. Un email de confirmation récapitulant la commande est envoyé à l'acheteur. Le vendeur conserve un archivage des commandes conformément à la loi." }],
    },
    {
      heading: "6. Paiement",
      blocks: [{ type: "p", text: "Le paiement s'effectue en ligne, de manière sécurisée, via le prestataire Stripe. Aucune donnée bancaire complète n'est conservée par le vendeur. La commande n'est traitée qu'après confirmation du paiement." }],
    },
    {
      heading: "7. Livraison",
      blocks: [
        { type: "p", text: "Les produits sont livrés dans les zones suivantes : [zones de livraison], dans un délai indicatif de [délai] à compter de la confirmation de commande. Les frais de livraison sont précisés avant validation. Les risques sont transférés à l'acheteur à la remise du colis." },
      ],
    },
    {
      heading: "8. Droit de rétractation",
      blocks: [
        { type: "p", text: "Conformément à l'article VI.47 du Code de droit économique, l'acheteur consommateur dispose d'un délai de 14 jours calendaires à compter de la réception des biens pour exercer son droit de rétractation, sans avoir à motiver sa décision, en notifiant le vendeur à [email de contact] (un formulaire type de rétractation peut être utilisé)." },
        { type: "subheading", text: "Exception — denrées alimentaires" },
        { type: "p", text: "Conformément à l'article VI.53 du Code de droit économique, le droit de rétractation ne s'applique pas à la fourniture de biens susceptibles de se détériorer ou de se périmer rapidement. Nos biscuits frais et produits alimentaires périssables sont, à ce titre, exclus du droit de rétractation une fois expédiés. Les coffrets non périssables et non descellés restent éligibles." },
      ],
    },
    {
      heading: "9. Garantie légale de conformité",
      blocks: [{ type: "p", text: "L'acheteur bénéficie de la garantie légale de conformité (directive UE 2019/771 transposée au livre VI du Code de droit économique). En cas de produit non conforme, il peut contacter le vendeur à [email de contact]." }],
    },
    {
      heading: "10. Réclamations et médiation",
      blocks: [
        { type: "p", text: "Toute réclamation peut être adressée à [email de contact]. À défaut de solution amiable, l'acheteur peut recourir au Service de médiation pour le consommateur (Belgique) ou à la plateforme européenne de règlement en ligne des litiges : https://ec.europa.eu/consumers/odr." },
      ],
    },
    {
      heading: "11. Données personnelles",
      blocks: [{ type: "p", text: "Le traitement des données personnelles est décrit dans la politique de confidentialité." }],
    },
    {
      heading: "12. Droit applicable",
      blocks: [{ type: "p", text: "Les présentes CGV sont soumises au droit belge. Tout litige relève de la compétence des tribunaux belges, sans préjudice des dispositions protectrices applicables au consommateur." }],
    },
  ],
};

export default doc;
```

- [ ] **Step 2 : Traductions** — Create `content/legal/cgv/{nl,de,en}.ts` en traduisant fidèlement le FR (placeholders `[ ]` et URL ODR inchangés ; adapter les références légales). `export default doc`.

- [ ] **Step 3 : Enregistrer dans le registry** — Dans `content/legal/index.ts`, ajouter les imports `cgv/{fr,nl,de,en}` et l'entrée `cgv: { fr, nl, de, en }` dans `DOCS`.

- [ ] **Step 4 : Test** — Ajouter au bloc `getLegalDocument` un cas `cgv` :

```ts
it("renvoie les CGV avec les 12 sections en FR", () => {
  const d = getLegalDocument("cgv", "fr");
  expect(d.title).toBe("Conditions générales de vente");
  expect(d.sections).toHaveLength(12);
});
```

- [ ] **Step 5 : Vérif + commit**

Run: `npx vitest run tests/unit/legal-content.test.ts` → PASS. `npm run typecheck` → clean.
```bash
git add content/legal tests/unit/legal-content.test.ts
git commit -m "feat(legal): CGV content (4 locales) — incl. 14j rétractation + exception denrées"
```

---

## Task 5 : Contenu `confidentialite` (×4)

**Files:**
- Create: `content/legal/confidentialite/{fr,nl,de,en}.ts`
- Modify: `content/legal/index.ts`

- [ ] **Step 1 : Contenu FR** — Create `content/legal/confidentialite/fr.ts`:

```ts
import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Politique de confidentialité",
  lastUpdatedLabel: "Dernière mise à jour : [date]",
  intro:
    "La présente politique décrit la manière dont [Raison sociale] traite les données personnelles des utilisateurs du site Au Fil des Saveurs, conformément au Règlement général sur la protection des données (RGPD, UE 2016/679).",
  sections: [
    {
      heading: "Responsable du traitement",
      blocks: [{ type: "p", text: "Le responsable du traitement est [Raison sociale], [adresse], joignable à [email de contact]. [Le cas échéant : délégué à la protection des données : [DPO]]." }],
    },
    {
      heading: "Données collectées",
      blocks: [
        { type: "list", items: [
          "Données de compte : adresse email, nom, mot de passe (haché, jamais stocké en clair).",
          "Données de commande et de livraison : produits, adresses, historique d'achat.",
          "Newsletter : adresse email (sur consentement).",
          "Métadonnées de session, à des fins de sécurité : adresse IP, ville approximative, navigateur/appareil.",
          "Données d'authentification à deux facteurs (2FA), lorsqu'elle est activée : secret chiffré et codes de récupération hachés.",
          "Journaux techniques (logs) générés automatiquement.",
        ]},
      ],
    },
    {
      heading: "Finalités et bases légales",
      blocks: [
        { type: "list", items: [
          "Exécution du contrat de vente et gestion du compte (article 6.1.b RGPD).",
          "Envoi de la newsletter (consentement, article 6.1.a).",
          "Sécurité, prévention de la fraude et des accès non autorisés (intérêt légitime, article 6.1.f).",
          "Obligations légales, notamment comptables et fiscales (article 6.1.c).",
        ]},
      ],
    },
    {
      heading: "Destinataires et sous-traitants",
      blocks: [
        { type: "list", items: [
          "Stripe (traitement des paiements).",
          "Resend (envoi des emails transactionnels).",
          "Vercel (hébergement et diffusion du site).",
        ]},
        { type: "p", text: "Ces prestataires agissent en qualité de sous-traitants. Lorsque des données sont transférées hors de l'Union européenne, elles le sont sur la base de garanties appropriées (clauses contractuelles types)." },
      ],
    },
    {
      heading: "Durées de conservation",
      blocks: [
        { type: "list", items: [
          "Données de compte : tant que le compte est actif, puis suppression/anonymisation après demande de suppression (délai de réflexion de 30 jours).",
          "Données de commande : conservées jusqu'à 7 ans au titre des obligations comptables belges.",
          "Sessions et jetons d'authentification : durée de vie technique limitée, puis purge.",
        ]},
      ],
    },
    {
      heading: "Vos droits",
      blocks: [
        { type: "p", text: "Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition, ainsi que du droit de retirer votre consentement à tout moment. Ces droits s'exercent à [email de contact]." },
        { type: "p", text: "Vous avez également le droit d'introduire une réclamation auprès de l'Autorité de protection des données (APD), Rue de la Presse 35, 1000 Bruxelles (autoriteprotectiondonnees.be)." },
      ],
    },
    {
      heading: "Cookies",
      blocks: [{ type: "p", text: "L'utilisation des cookies est détaillée dans la politique relative aux cookies." }],
    },
  ],
};

export default doc;
```

- [ ] **Step 2 : Traductions** — Create `confidentialite/{nl,de,en}.ts` (traduction fidèle, placeholders + adresse APD + noms des sous-traitants inchangés).

- [ ] **Step 3 : Registry** — Ajouter imports + entrée `confidentialite` dans `DOCS`.

- [ ] **Step 4 : Test** — Ajouter :

```ts
it("mentionne IP de session et 2FA dans la politique de confidentialité FR", () => {
  const d = getLegalDocument("confidentialite", "fr");
  const allText = JSON.stringify(d).toLowerCase();
  expect(allText).toContain("adresse ip");
  expect(allText).toContain("2fa");
});
```

- [ ] **Step 5 : Vérif + commit**

Run: `npx vitest run tests/unit/legal-content.test.ts` → PASS. `npm run typecheck` → clean.
```bash
git add content/legal tests/unit/legal-content.test.ts
git commit -m "feat(legal): privacy policy (4 locales) — RGPD incl. session IP + 2FA"
```

---

## Task 6 : Contenu `cookies` (×4) + finalisation registry

**Files:**
- Create: `content/legal/cookies/{fr,nl,de,en}.ts`
- Modify: `content/legal/index.ts` (retirer le cast temporaire)

- [ ] **Step 1 : Contenu FR** — Create `content/legal/cookies/fr.ts`:

```ts
import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Politique relative aux cookies",
  lastUpdatedLabel: "Dernière mise à jour : [date]",
  intro:
    "Cette politique explique l'usage des cookies et traceurs sur le site Au Fil des Saveurs, conformément à la directive ePrivacy et au RGPD.",
  sections: [
    {
      heading: "Qu'est-ce qu'un cookie ?",
      blocks: [{ type: "p", text: "Un cookie est un petit fichier déposé sur votre appareil lors de la visite d'un site, permettant d'en assurer le fonctionnement ou d'en mesurer l'usage." }],
    },
    {
      heading: "Cookies strictement nécessaires",
      blocks: [
        { type: "p", text: "Ces cookies sont indispensables au fonctionnement du site et ne requièrent pas votre consentement :" },
        { type: "list", items: [
          "Cookie de session d'authentification (maintien de la connexion).",
          "Cookie d'authentification à deux facteurs en cours (étape de vérification).",
          "Panier d'achat et préférence de langue.",
        ]},
      ],
    },
    {
      heading: "Cookies de mesure d'audience et marketing",
      blocks: [{ type: "p", text: "Le cas échéant, des cookies de mesure d'audience ou marketing peuvent être déposés ; ils ne le sont qu'avec votre consentement préalable, que vous pouvez retirer à tout moment." }],
    },
    {
      heading: "Gérer les cookies",
      blocks: [{ type: "p", text: "Vous pouvez configurer votre navigateur pour refuser ou supprimer les cookies. Le blocage des cookies strictement nécessaires peut toutefois empêcher l'accès à votre compte." }],
    },
    {
      heading: "Durées de conservation",
      blocks: [{ type: "p", text: "Les cookies de session expirent à la fermeture de la session ou après leur durée de vie technique. Les éventuels cookies de mesure ont une durée maximale conforme aux recommandations applicables." }],
    },
  ],
};

export default doc;
```

- [ ] **Step 2 : Traductions** — Create `cookies/{nl,de,en}.ts` (traduction fidèle).

- [ ] **Step 3 : Finaliser le registry** — Dans `content/legal/index.ts` : ajouter imports + entrée `cookies`, puis **retirer le cast** `as Record<...>` (les 4 clés sont désormais présentes, le type est complet) :

```ts
const DOCS: Record<LegalPageKey, Record<string, LegalDocument>> = {
  "mentions-legales": { fr: mentionsFr, nl: mentionsNl, de: mentionsDe, en: mentionsEn },
  cgv: { fr: cgvFr, nl: cgvNl, de: cgvDe, en: cgvEn },
  confidentialite: { fr: confFr, nl: confNl, de: confDe, en: confEn },
  cookies: { fr: cookiesFr, nl: cookiesNl, de: cookiesDe, en: cookiesEn },
};
```

- [ ] **Step 4 : Test parité (4 pages × 4 locales)** — Ajouter :

```ts
it("fournit les 4 pages dans les 4 locales", () => {
  const keys = ["cgv", "mentions-legales", "confidentialite", "cookies"] as const;
  for (const k of keys) {
    for (const l of ["fr", "nl", "de", "en"]) {
      const d = getLegalDocument(k, l);
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.sections.length).toBeGreaterThan(0);
    }
  }
});
```

- [ ] **Step 5 : Vérif + commit**

Run: `npx vitest run tests/unit/legal-content.test.ts` → PASS. `npm run typecheck` → clean.
```bash
git add content/legal tests/unit/legal-content.test.ts
git commit -m "feat(legal): cookies policy (4 locales) + finalize registry"
```

---

## Task 7 : i18n chrome + câbler les 4 pages + SEO

**Files:**
- Modify: `messages/{fr,nl,de,en}.json` (namespace `legal`)
- Modify: `app/[locale]/(shop)/{cgv,mentions-legales,confidentialite,cookies}/page.tsx`

- [ ] **Step 1 : Clés i18n `legal`** — Dans chaque `messages/<l>.json`, ajouter un objet de premier niveau `legal`. Version FR :

```json
"legal": {
  "eyebrow": "Informations légales",
  "seo": {
    "cgv": { "title": "Conditions générales de vente — Au Fil des Saveurs", "description": "Les conditions générales de vente de la boutique Au Fil des Saveurs." },
    "mentions-legales": { "title": "Mentions légales — Au Fil des Saveurs", "description": "Mentions légales et informations sur l'éditeur du site Au Fil des Saveurs." },
    "confidentialite": { "title": "Politique de confidentialité — Au Fil des Saveurs", "description": "Comment Au Fil des Saveurs traite et protège vos données personnelles (RGPD)." },
    "cookies": { "title": "Politique de cookies — Au Fil des Saveurs", "description": "L'usage des cookies sur le site Au Fil des Saveurs." }
  }
}
```

EN de référence (traduire NL/DE de manière équivalente) :
```json
"legal": {
  "eyebrow": "Legal information",
  "seo": {
    "cgv": { "title": "Terms and conditions of sale — Au Fil des Saveurs", "description": "The terms and conditions of sale of the Au Fil des Saveurs shop." },
    "mentions-legales": { "title": "Legal notice — Au Fil des Saveurs", "description": "Legal notice and publisher information for the Au Fil des Saveurs website." },
    "confidentialite": { "title": "Privacy policy — Au Fil des Saveurs", "description": "How Au Fil des Saveurs processes and protects your personal data (GDPR)." },
    "cookies": { "title": "Cookie policy — Au Fil des Saveurs", "description": "How the Au Fil des Saveurs website uses cookies." }
  }
}
```

NL/DE : mêmes clés, traductions naturelles (eyebrow : NL « Juridische informatie », DE « Rechtliche Informationen »).

- [ ] **Step 2 : Câbler `cgv`** — Replace `app/[locale]/(shop)/cgv/page.tsx`:

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.seo.cgv" });
  return { title: t("title"), description: t("description") };
}

export default async function CgvPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage pageKey="cgv" locale={locale} />;
}
```

- [ ] **Step 3 : Câbler les 3 autres pages** — Idem pour `mentions-legales`, `confidentialite`, `cookies` : remplacer chaque `page.tsx` en changeant le `namespace` (`legal.seo.<key>`), le nom de fonction, et `pageKey="<key>"`. Exemple `mentions-legales/page.tsx` :

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.seo.mentions-legales" });
  return { title: t("title"), description: t("description") };
}

export default async function MentionsLegalesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage pageKey="mentions-legales" locale={locale} />;
}
```

(Et `confidentialite` → `pageKey="confidentialite"`, fonction `ConfidentialitePage` ; `cookies` → `pageKey="cookies"`, fonction `CookiesPage`.)

- [ ] **Step 4 : Valider JSON + parité i18n**

Run:
```
node -e "['fr','nl','de','en'].forEach(l=>{const m=require('./messages/'+l+'.json'); if(!m.legal||!m.legal.seo.cgv.title) throw new Error('legal manquant '+l)}); console.log('ok')"
```
Expected: `ok`.

- [ ] **Step 5 : Typecheck + lint + commit**

Run: `npm run typecheck` → clean. `npm run lint` → 0 erreur (l'apostrophe française dans le JSX est dans des données i18n/contenu, pas du JSX littéral, donc pas de souci `react/no-unescaped-entities`).
```bash
git add messages "app/[locale]/(shop)/cgv" "app/[locale]/(shop)/mentions-legales" "app/[locale]/(shop)/confidentialite" "app/[locale]/(shop)/cookies"
git commit -m "feat(legal): wire 4 legal pages to LegalPage + SEO metadata + i18n chrome"
```

---

## Task 8 : Vérification finale

- [ ] **Step 1 : Suite unitaire complète**

Run: `npx dotenv -e .env.local -- npx vitest run`
Expected: tous verts (dont `legal-content.test.ts`).

- [ ] **Step 2 : Typecheck + lint**

Run: `npm run typecheck` (clean) puis `npm run lint` (0 erreur).

- [ ] **Step 3 : Smoke rendu (manuel ou e2e léger optionnel)**

Optionnel, à la manière des specs Sprint A — Create `tests/e2e/legal-pages.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const PAGES = [
  { path: "/fr/cgv", h1: /Conditions g[ée]n[ée]rales de vente/i },
  { path: "/fr/mentions-legales", h1: /Mentions l[ée]gales/i },
  { path: "/fr/confidentialite", h1: /confidentialit[ée]/i },
  { path: "/fr/cookies", h1: /cookies/i },
];

for (const p of PAGES) {
  test(`${p.path} affiche son titre`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.h1);
  });
}
```

Run (best-effort, nécessite le serveur dev) : `npx playwright test legal-pages`. Si l'environnement bloque le serveur/DB, noter que les specs sont écrites et committées (les pages légales ne dépendent pas de la DB, donc devraient passer).

```bash
git add tests/e2e/legal-pages.spec.ts
git commit -m "test(e2e): legal pages render their titles"
```

---

## Self-Review

**Couverture du spec :**

| Section spec | Tâche |
|---|---|
| Types `LegalDocument`/`LegalSection`/`LegalBlock` | T1 |
| Helper `renderWithPlaceholders` + test | T1 |
| `PlaceholderText` (placeholders marqués) | T2 |
| Composant `LegalPage` | T2 |
| Registry `getLegalDocument` + fallback fr | T3 |
| Contenu mentions-légales ×4 (éditeur/hébergeur/PI) | T3 |
| Contenu CGV ×4 (rétractation 14j + exception denrées, ODR, garantie 2 ans) | T4 |
| Contenu confidentialité ×4 (IP session + 2FA, APD, sous-traitants) | T5 |
| Contenu cookies ×4 (essentiels vs consentement) | T6 |
| i18n chrome + SEO `generateMetadata` | T7 |
| Câblage des 4 `page.tsx` (remplacement ComingSoonPage) | T7 |
| Vérification finale | T8 |

Pas de gap.

**Scan placeholders :** Les `[ ]` dans le contenu sont **intentionnels** (infos entreprise — décision validée). Les tâches de traduction NL/DE/EN sont des transformations définies (traduire le FR fourni), pas des placeholders vides — le contenu FR concret est fourni dans chaque tâche.

**Cohérence des types :**
- `LegalDocument { title, intro?, lastUpdatedLabel, sections }` — T1, utilisé partout.
- `getLegalDocument(key: LegalPageKey, locale: string): LegalDocument` — défini T3, complété T4-T6, consommé par `LegalPage` (T2).
- `renderWithPlaceholders(text): TextSegment[]` — T1, utilisé par `PlaceholderText` (T2).
- `pageKey` valeurs `"cgv" | "mentions-legales" | "confidentialite" | "cookies"` cohérentes entre registry, `LegalPage`, pages et i18n `legal.seo.<key>`.

Pas de dérive.

---

## Execution Handoff

**Plan complet et sauvegardé dans `docs/superpowers/plans/2026-05-31-legal-pages.md`. Deux options d'exécution :**

**1. Subagent-Driven (recommandé)** — un subagent frais par tâche, revue spec + qualité entre chaque.

**2. Inline** — exécution dans cette session avec checkpoints.

Laquelle ?
