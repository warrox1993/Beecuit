# Bandeau de consentement cookies « biscuit qui craque » — design

**Date:** 2026-05-31
**Statut:** validé (brainstorming)
**Précède:** `docs/superpowers/plans/2026-05-31-cookie-consent.md` (à écrire)
**Lié:** complète la page `/cookies` livrée dans [pages légales] (`2026-05-31-legal-and-contact-pages-design.md`)

## Contexte

La page `/cookies` existe et distingue cookies strictement nécessaires (session auth, 2FA, panier, locale) vs mesure d'audience/marketing « le cas échéant ». **Constat vérifié : le site n'utilise aujourd'hui AUCUN cookie non-essentiel** (pas de GA, Vercel Analytics, pixel Meta…). Légalement, un bandeau de consentement n'est donc pas encore obligatoire — mais l'utilisateur en veut un **complet, préparé pour l'avenir** (il ajoutera probablement de l'analytics).

Signature voulue : un bandeau **en forme de biscuit qui se fend en deux et laisse tomber des miettes** à l'apparition — un clin d'œil parfait pour une biscuiterie. Direction visuelle validée via un prototype animé (`prototype-cookie-banner.html`, conservé comme référence) : biscuit doré **réaliste et texturé** (façon spéculoos), qui tombe, craque le long d'une fissure dentelée, miettes qui tombent, puis révélation du contenu de consentement.

## Décisions validées (brainstorming)

| # | Question | Décision |
|---|----------|----------|
| 1 | Périmètre | **Gestionnaire complet** (pas un simple bandeau info), préparé pour l'analytics futur |
| 2 | Catégories | **necessary** (toujours actif) + **analytics** + **marketing** |
| 3 | Stockage du choix | Cookie **`cookie_consent`** (non-httpOnly, lisible client+serveur), JSON versionné, **6 mois** |
| 4 | UX | **Tout accepter / Refuser / Personnaliser** ; « Refuser » aussi accessible qu'« Accepter » (APD/CNIL) ; catégories non-essentielles **OFF par défaut** |
| 5 | Réversibilité | Lien/bouton **« Gérer les cookies »** (footer + page `/cookies`) rouvre les préférences |
| 6 | Visuel | **Biscuit réaliste texturé qui craque en deux + miettes** (SVG + framer-motion), d'après le prototype validé |
| 7 | Multilingue | i18n `consent.*` ×4 (fr/nl/de/en) |
| 8 | Accessibilité | Respect de `prefers-reduced-motion` : pas de craquage si l'utilisateur le demande (apparition douce à la place) |

## Architecture

### État & stockage
```
lib/consent/types.ts
  type ConsentCategory = "necessary" | "analytics" | "marketing";
  type ConsentState = { v: number; analytics: boolean; marketing: boolean; ts: number };
  const CONSENT_COOKIE = "cookie_consent";
  const CONSENT_VERSION = 1;
  const CONSENT_MAX_AGE_DAYS = 180;            // 6 mois

lib/consent/cookie.ts   (isomorphe, pur, testé)
  parseConsent(raw: string | undefined): ConsentState | null   // null si absent/malformé/version périmée/expiré
  serializeConsent(state): string                              // valeur cookie
  isValid(state): boolean
```
`necessary` est implicitement toujours `true` (pas stocké, jamais désactivable).

### Provider (client)
```
components/consent/ConsentProvider.tsx
  - lit le cookie au montage (useState initialisé via parseConsent(document.cookie))
  - expose via context useConsent():
      consent: ConsentState | null            // null = pas encore choisi → bandeau visible
      decided: boolean
      acceptAll(), rejectAll(), save({analytics, marketing})
      openPreferences(), closePreferences(), prefsOpen
  - écrit le cookie (document.cookie, max-age 180j, path=/, SameSite=Lax) + met à jour l'état
  - monté dans app/[locale]/layout.tsx, enveloppe children
```

### Bandeau « biscuit qui craque » (client)
```
components/consent/CookieConsentBanner.tsx
  - rendu seulement si !decided (ou si prefsOpen)
  - <CrackingCookie/> : SVG biscuit en 2 demi-cercles partageant une fissure dentelée
      (paths repris du prototype), animé avec framer-motion :
        1. chute + impact (squash) ~0.55s
        2. craquage : les 2 moitiés s'écartent (translate/rotate) ~0.7s
        3. miettes : ~9 particules qui tombent (motion, gravité + fade)
        4. révélation du contenu (texte + actions)
      → si prefers-reduced-motion : apparition simple (fade), pas de craquage/miettes
  - contenu : eyebrow marque + titre + description courte + lien vers /cookies
  - actions : « Tout accepter » (honey), « Refuser » (outline), « Personnaliser » (lien → panneau)
  - panneau Personnaliser : interrupteurs necessary (actif, grisé) / analytics / marketing + « Enregistrer mes choix »
  - position : bas-centre, z-index élevé, focus management + aria (role="dialog" pour le panneau, Échap ferme)
  - stylé marque (cream/honey/warm-brown, primitives existantes Button)
```
Le SVG (textures, pépites, fissure dentelée, gradients) est porté du prototype `prototype-cookie-banner.html`. L'animation CSS-keyframes du prototype devient des variantes framer-motion (déjà dans le projet) pour cohérence avec le reste (`components/motion/`).

### Réouverture & scripts conditionnels
```
components/consent/ManageCookiesButton.tsx   (client)
  - bouton/lien « Gérer les cookies » → useConsent().openPreferences()
  - placé dans components/layout/Footer.tsx + sur la page /cookies

components/consent/ConsentScripts.tsx   (client)
  - lit consent ; rend les <Script> analytics/marketing UNIQUEMENT si consenti
  - AUJOURD'HUI : aucun script réel — bloc balisé prêt à recevoir GA/Meta :
      {consent?.analytics && (/* ← insérer Google Analytics / Vercel Analytics ici */ null)}
      {consent?.marketing && (/* ← insérer pixel Meta ici */ null)}
  - monté dans le layout
```

### i18n
`consent.*` ×4 locales : eyebrow, titre, description, lien « En savoir plus », boutons (acceptAll/reject/customize/save), libellés catégories (necessary/analytics/marketing + leurs descriptions), « Gérer les cookies ».

### Montage
`app/[locale]/layout.tsx` : envelopper avec `<ConsentProvider>`, et rendre `<CookieConsentBanner/>` + `<ConsentScripts/>` (sous le children, avant `</body>`-équivalent). Vérifier l'ordre avec les providers existants (ToastProvider, etc.).

## Conformité (baked-in)
- « Refuser » = même niveau visuel et même nombre de clics qu'« Accepter ».
- analytics/marketing **OFF par défaut**, opt-in explicite.
- Choix réversible à tout moment (« Gérer les cookies »).
- Re-demande si `CONSENT_VERSION` change ou après 6 mois (`parseConsent` renvoie null).
- Aucun script non-essentiel chargé avant consentement (`ConsentScripts` gate tout).

## Tests
- Unit `lib/consent/cookie.test.ts` : `parseConsent` (valide / absent / JSON malformé / mauvaise version → null / expiré → null) ; `serializeConsent` round-trip ; `acceptAll`/`rejectAll` produisent les bons états.
- (Composants : un smoke e2e léger optionnel — bandeau visible au 1er chargement, masqué après « Refuser », ré-ouvrable via « Gérer les cookies ». Possible sans DB.)

## Fichiers
**Créer :** `lib/consent/{types,cookie}.ts` (+ test), `components/consent/{ConsentProvider,CookieConsentBanner,CrackingCookie,ManageCookiesButton,ConsentScripts}.tsx`.
**Modifier :** `app/[locale]/layout.tsx`, `components/layout/Footer.tsx`, page `/cookies` (bouton gérer), `messages/*.json`.
**Conservé comme référence :** `prototype-cookie-banner.html` (à la racine).

## Hors scope
- Branchement réel d'un outil analytics (le point d'insertion est prêt ; à faire quand l'outil est choisi).
- Registre serveur des consentements / preuve horodatée côté back (le cookie suffit à ce stade).
- Bandeau multi-variant / A-B.

## Effort estimé
~1.5 j : helpers+types+tests (0.25), CrackingCookie + animation framer-motion d'après le prototype (0.5), banner + panneau + provider (0.5), montage layout + footer + /cookies + i18n + ConsentScripts (0.25).
