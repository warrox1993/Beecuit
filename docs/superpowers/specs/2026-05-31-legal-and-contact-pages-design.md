# Pages légales + Contact — design

**Date:** 2026-05-31
**Statut:** validé (brainstorming)
**Précède:** `docs/superpowers/plans/2026-05-31-legal-pages.md` (sous-projet 1, à écrire)

## Contexte

5 pages sont actuellement de simples placeholders « Bientôt disponible » (composant `components/common/ComingSoonPage.tsx`), déjà liées depuis le footer :
`/cgv`, `/mentions-legales`, `/confidentialite`, `/cookies`, `/contact`.

C'est un **mockup destiné au client** : les informations propres à l'entreprise (raison sociale, forme juridique, siège, n° BCE, n° TVA, email, téléphone, adresse de l'atelier, horaires) ne sont **pas encore connues** → elles restent en **placeholders `[ … ]`**. Le reste du contenu est généré conforme au **droit belge + européen en vigueur au 31/05/2026** (RGPD/UE 2016/679, Code de droit économique belge livres VI & XII, directive e-commerce 2000/31, directive 2019/771 sur la conformité des biens, ePrivacy).

L'app est multilingue (next-intl : `fr`, `nl`, `de`, `en`). Décision validée : **contenu multilingue complet pour les 5 pages**.

> ⚠️ **Avertissement** : contenu juridique standard et raisonnablement conforme, mais **ce n'est pas un conseil juridique**. Avant toute mise en ligne commerciale, le client doit le faire **relire par un juriste** et compléter les placeholders.

## Décisions validées (brainstorming)

| # | Question | Décision |
|---|----------|----------|
| 1 | Périmètre linguistique | **Multilingue complet FR/NL/DE/EN** |
| 2 | Où vit le contenu légal ? | **Modules de contenu typés par page × langue** (pas i18n JSON), rendus par un composant partagé `LegalPage` |
| 3 | Page Contact | **Page complète, ton premium & chaleureux** : hero + formulaire (→ table DB) + coordonnées + carte + FAQ/raisons + social |
| 4 | Comportement du formulaire contact | **Enregistre en base `contact_messages`** (fonctionne sans email) + **mini-vue admin** pour lire |
| 5 | Découpage | **2 sous-projets** : (1) 4 pages légales, (2) page Contact. Implémenter le n°1 d'abord. |

## Architecture

### Contenu légal : modules typés + composant partagé

```
content/legal/types.ts            # types LegalDocument / LegalSection / LegalBlock
content/legal/cgv/{fr,nl,de,en}.ts
content/legal/mentions-legales/{fr,nl,de,en}.ts
content/legal/confidentialite/{fr,nl,de,en}.ts
content/legal/cookies/{fr,nl,de,en}.ts
content/legal/index.ts            # registry getLegalDocument(pageKey, locale) → LegalDocument
components/legal/LegalPage.tsx     # rend un LegalDocument
components/legal/Placeholder.tsx   # rend un [placeholder] avec un marquage visuel discret
```

**Types :**
```ts
export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "subheading"; text: string };

export type LegalSection = { heading: string; blocks: LegalBlock[] };

export type LegalDocument = {
  title: string;
  intro?: string;
  lastUpdatedLabel: string;   // ex. "Dernière mise à jour : [date]" — placeholder date
  sections: LegalSection[];
};
```

**Registry** (`content/legal/index.ts`) :
```ts
export type LegalPageKey = "cgv" | "mentions-legales" | "confidentialite" | "cookies";
export function getLegalDocument(key: LegalPageKey, locale: string): LegalDocument
// map { key: { fr, nl, de, en } }, fallback "fr" si locale inconnue.
```

**`LegalPage`** (server component) : reçoit `pageKey` + `locale`, récupère le document, rend dans une `Section`/`Container variant="narrow"` :
- `Eyebrow` (catégorie "Informations légales" / i18n), `Heading h1` = `title`, intro éventuelle en `Prose`, `lastUpdatedLabel` en petit.
- Chaque `section` : sous-titre `Heading h2/h3` + `blocks` (paragraphes `Prose`, listes `<ul>`, sous-titres).
- Les placeholders `[ … ]` dans le texte sont détectés et rendus via `Placeholder` (fond honey-cream discret) pour que le client repère ce qu'il doit remplir.

**Placeholders dans le texte** : convention `[Raison sociale]`, `[N° BCE]`, etc. Le rendu des blocs scanne le texte et entoure chaque `[...]` d'un `<mark>` thémé. Helper pur `renderWithPlaceholders(text)` testé unitairement.

**Pages** (`app/[locale]/(shop)/{cgv,mentions-legales,confidentialite,cookies}/page.tsx`) :
```tsx
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";

export async function generateMetadata({ params }) { /* title + description SEO par page, i18n */ }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage pageKey="cgv" locale={locale} />;
}
```

### Contenu des 4 pages légales (structure de sections)

**`mentions-legales`** (obligatoire — CDE livre XII art. XII.6 + dir. 2000/31) :
- Éditeur du site : `[Raison sociale]`, `[forme juridique]`, siège `[adresse]`, `[N° BCE/entreprise]`, `[N° TVA]`, email `[email]`, tél `[téléphone]`.
- Directeur de la publication : `[nom]`.
- Hébergeur : Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, USA).
- Propriété intellectuelle (marque, contenus, photos).
- Crédits / signalement de contenu.

**`cgv`** (CDE livres VI & XII) :
- Identité du vendeur (renvoi mentions légales).
- Champ d'application & acceptation.
- Produits (biscuits artisanaux, photos non contractuelles, allergènes : renvoi fiche produit).
- Prix (en euros, TVA belge incluse, hors frais de livraison).
- Commande (étapes, confirmation, archivage).
- Paiement (Stripe ; sécurisé ; moyens acceptés).
- Livraison (délais `[ ]`, zones `[ ]`, frais, transfert des risques).
- **Droit de rétractation 14 jours** (art. VI.47 CDE) + **formulaire type de rétractation** + ⚠️ **exception denrées susceptibles de se périmer/aliments** (art. VI.53, 4° — pertinent pour des biscuits frais : préciser la portée).
- Garantie légale de conformité (2 ans, dir. UE 2019/771 transposée — CDE livre VI titre 4).
- Réclamations & SAV (`[email]`), médiation de la consommation (Service de Médiation pour le Consommateur, BE) + **plateforme ODR européenne** (ec.europa.eu/consumers/odr).
- Données personnelles (renvoi politique de confidentialité).
- Droit applicable (belge) & juridictions compétentes.

**`confidentialite`** (RGPD) :
- Responsable du traitement : `[Raison sociale]`, `[contact]`, `[DPO si applicable]`.
- Données collectées : compte (email, nom, mot de passe haché), commandes & adresses, newsletter (opt-in), **métadonnées de session (IP, ville, user-agent — sécurité)**, **données 2FA (secret chiffré, codes de récupération hachés)**, journaux techniques.
- Finalités & bases légales (exécution du contrat, consentement newsletter, intérêt légitime sécurité/anti-fraude, obligation légale comptable).
- Destinataires / sous-traitants : Stripe (paiement), Resend (emails), Vercel (hébergement/CDN).
- Transferts hors UE (le cas échéant, clauses types).
- Durées de conservation (compte, commandes 7 ans comptable BE, sessions, tokens).
- Droits RGPD : accès, rectification, effacement, limitation, portabilité, opposition, retrait du consentement ; modalités d'exercice (`[email]`).
- Réclamation auprès de **l'Autorité de protection des données (APD)**, Rue de la Presse 35, 1000 Bruxelles.
- Cookies (renvoi page cookies).

**`cookies`** (ePrivacy + RGPD) :
- Qu'est-ce qu'un cookie.
- Catégories utilisées : **strictement nécessaires** (session d'authentification `authjs.session-token`, panier, locale, cookie 2FA `pending-2fa`) — pas de consentement requis ; **mesure d'audience / marketing** (le cas échéant — consentement requis).
- Base légale & consentement.
- Comment gérer/refuser (navigateur + futur bandeau).
- Durées.
- ⚠️ **Note de scope** : une politique cookies complète suppose un **bandeau de consentement** côté UI. Il **n'existe pas encore** — à signaler au client comme étape séparée (hors de ce sous-projet).

### i18n

Quelques clés courtes côté `messages/*.json` pour le **chrome** des pages légales (eyebrow « Informations légales », libellé « Dernière mise à jour », titres/descriptions SEO via `generateMetadata`). Le **corps** vit dans les modules de contenu (pas i18n JSON).

### Tests

- Unit : `renderWithPlaceholders()` (découpe `[...]` correctement, texte sans placeholder inchangé).
- Unit : `getLegalDocument()` renvoie un document pour chaque (key, locale) et applique le fallback fr.
- (Pas d'e2e lourd ; éventuellement un smoke « /fr/cgv affiche le titre » à la Sprint A.)

## Sous-projet 2 — Page Contact (spec/plan séparés)

Esquisse validée (détaillée dans son propre spec) :
- **Composition** (`app/[locale]/(shop)/contact/page.tsx`) : hero éditorial premium → `ContactForm` → bloc coordonnées (`[ ]`) → carte (embed/statique, adresse `[ ]`) → FAQ/raisons de contact (commande, B2B, presse, livraison) → liens sociaux.
- **Table `contact_messages`** : `id, name, email, subject, message, locale, status('new'|'read'|'archived'), ip, created_at`. Migration appliquée via `scripts/migrate-http.ts`.
- **Server action** `submitContactMessage(formData)` : zod + rate-limit + insert ; renvoie un résultat ; toast succès.
- **Vue admin** `/admin/messages` : liste + marquage lu/archivé (action admin avec `requireAdmin`). Lien ajouté à `AdminSidebar`.
- i18n complet FR/NL/DE/EN pour les libellés du formulaire/coordonnées/FAQ.

## Fichiers (sous-projet 1)

**Créer :**
- `content/legal/types.ts`
- `content/legal/{cgv,mentions-legales,confidentialite,cookies}/{fr,nl,de,en}.ts` (16 fichiers)
- `content/legal/index.ts`
- `components/legal/LegalPage.tsx`
- `components/legal/Placeholder.tsx` (+ helper `renderWithPlaceholders`)
- Tests unit correspondants.

**Modifier :**
- `app/[locale]/(shop)/{cgv,mentions-legales,confidentialite,cookies}/page.tsx` (remplacer `ComingSoonPage`)
- `messages/{fr,nl,de,en}.json` (clés chrome + SEO `legal.*`)

`components/common/ComingSoonPage.tsx` reste (autres usages potentiels).

## Hors scope
- Bandeau de consentement cookies (à signaler comme étape séparée).
- Remplissage réel des infos entreprise (placeholders).
- Relecture juridique (responsabilité du client).
- Page Contact = sous-projet 2.

## Effort estimé (sous-projet 1)
~1.5–2 j : types + composant + helper (0.5), contenu FR des 4 pages (0.5), traductions NL/DE/EN (0.5), câblage pages + SEO + i18n chrome + tests (0.5).
