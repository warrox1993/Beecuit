# Page Contact (sous-projet 2/2) — design

**Date:** 2026-05-31
**Statut:** validé (brainstorming)
**Précède:** `docs/superpowers/plans/2026-05-31-contact-page.md` (à écrire)
**Suit:** `docs/superpowers/specs/2026-05-31-legal-and-contact-pages-design.md` (sous-projet 1 livré)

## Contexte

La page `/contact` est encore un placeholder « Bientôt disponible ». On la remplace par une vraie page complète (mockup pour le client) : ton **premium & chaleureux**, multilingue **FR/NL/DE/EN**, avec un **formulaire de contact** qui enregistre les messages en base (fonctionne sans email configuré) + une **mini-vue admin** pour les lire.

C'est une **zone de saisie utilisateur publique** → **la sécurité est impérative** (validation, anti-XSS, anti-spam, contrôle d'accès admin). Une **revue sécurité dédiée** (skill `security-review`) est requise pendant l'implémentation, en plus des revues spec + qualité.

Patron de référence : `b2b_quote_requests` (formulaire public → table DB → vue admin `/admin/devis`).

## Décisions validées (brainstorming)

| # | Question | Décision |
|---|----------|----------|
| 1 | Carte | **Statique + lien « Voir l'itinéraire »** (zéro cookie tiers — évite le gating consentement d'un embed Google Maps) |
| 2 | Vue admin | **Liste + détail + statuts** (new/read/archived), façon `/admin/devis` |
| 3 | Formulaire | **Select de raison** (Commande / B2B / Presse / Livraison / Autre) + nom, email, message |
| 4 | Langue | **Multilingue FR/NL/DE/EN** |
| 5 | Notif email admin | **Hors scope** (dépend de Resend/domaine ; messages lisibles dans `/admin/messages`) |
| 6 | Anti-spam | **Honeypot + rate-limit par IP** (3 / 15 min, en comptant les rows récents — pas de table en plus) |

## Architecture

### Schema (migration `0016_contact_messages`)
```sql
CREATE TYPE contact_reason AS ENUM ('order','b2b','press','delivery','other');
CREATE TYPE contact_status AS ENUM ('new','read','archived');

CREATE TABLE contact_messages (
  id text PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  reason contact_reason NOT NULL,
  message text NOT NULL,
  locale text NOT NULL DEFAULT 'fr',
  status contact_status NOT NULL DEFAULT 'new',
  source_ip text,            -- pour rate-limit / abus uniquement (intérêt légitime)
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX contact_messages_status_created_idx ON contact_messages (status, created_at DESC);
CREATE INDEX contact_messages_source_ip_idx ON contact_messages (source_ip);
```
Schema Drizzle dans `lib/db/schemas/contact.ts`, exporté depuis `lib/db/schema.ts`. Migration générée par `pnpm db:generate` puis **appliquée via `dotenv -e .env.local -- tsx scripts/migrate-http.ts 0016_<tag>`** (drizzle-kit migrate cale sur le WebSocket Neon — voir [reference]).

### Server actions (`lib/actions/contact.actions.ts`)

**`submitContactMessage(formData)`** (public) :
1. `"use server"` (CSRF protégé nativement par Next : vérif same-origin sur les server actions).
2. **Honeypot** : champ caché `company` (leurre) ; si rempli → succès silencieux factice (on ne stocke rien, on renvoie ok pour ne pas informer le bot).
3. **Validation Zod stricte** : `name` (trim, 2–100), `email` (`.email()`, lowercase, ≤254), `reason` (`z.enum([...])`), `message` (trim, 10–2000), `locale`. Toute saisie hors bornes → erreur générique.
4. **Rate-limit par IP** : `getClientIp(headers)` ; `SELECT count(*) FROM contact_messages WHERE source_ip = ip AND created_at > now() - interval '15 minutes'` ; si ≥ 3 → rejet (message générique « réessaie plus tard »).
5. **Insert** (Drizzle, requête paramétrée) avec `source_ip` + `locale`.
6. Renvoie `{ ok: true }` (toast côté client). Aucune donnée utilisateur réfléchie dans la réponse.

**`adminUpdateMessageStatus(formData)`** (admin) :
- `requireAdmin()` (rejette non-admin). Zod (`id` uuid, `status` enum). Update + `revalidatePath('/admin/messages')` + détail.

### Pages & composants
- **`app/[locale]/(shop)/contact/page.tsx`** : remplace `ComingSoonPage`. Compose : hero éditorial → `ContactForm` → `ContactCoordinates` → `ContactMap` (statique) → `ContactFaq` → liens sociaux. `generateMetadata` SEO i18n.
- **`components/shop/ContactForm.tsx`** (client) : nom, email, `reason` (select), message, **honeypot caché** (`company`, `aria-hidden`, `tabIndex=-1`, `autocomplete=off`, masqué en CSS) → `submitContactMessage`. États succès/erreur (toast). `autoComplete` corrects. Pas de `dangerouslySetInnerHTML`.
- **`components/contact/ContactCoordinates.tsx`** : adresse/email/tél/horaires en placeholders `[ ]` (réutilise le style `PlaceholderText` des pages légales si pertinent).
- **`components/contact/ContactMap.tsx`** : visuel de carte **statique** (illustration/SVG on-brand, pas d'appel tiers) + bouton « Voir l'itinéraire » → `https://www.google.com/maps/search/?api=1&query=...` (placeholder adresse), `rel="noopener noreferrer"`, `target="_blank"`.
- **`components/contact/ContactFaq.tsx`** : 4 raisons/raccourcis (Commande, B2B, Presse, Livraison).
- **`app/admin/messages/page.tsx`** : liste (table façon `DevisTable`) — colonnes nom/email/raison/statut/date, lien détail. **Rendu via React (échappement auto)** — aucun HTML brut.
- **`app/admin/messages/[id]/page.tsx`** : détail du message + actions de statut (new/read/archived). Texte rendu en `<p>`/`whitespace-pre-wrap` (échappé).
- **`AdminSidebar`** : ajout d'un lien « Messages ».
- i18n `contact.*` ×4 locales.

## Sécurité (impératif — zone de saisie publique)

| Vecteur | Mitigation |
|---|---|
| **XSS stocké** (message affiché en admin) | Rendu **100 % via React** (échappement auto), **jamais** `dangerouslySetInnerHTML`. Aucune interprétation HTML/markdown du contenu utilisateur. `whitespace-pre-wrap` pour préserver les retours ligne sans HTML. |
| **Injection SQL** | Drizzle = requêtes **paramétrées** ; aucun `sql` brut avec interpolation de saisie utilisateur. |
| **CSRF** | Server actions Next = protection same-origin native. |
| **Spam / flood** | Honeypot (`company`) + rate-limit IP (3/15 min) + bornes de longueur strictes. |
| **Payload géant / DoS applicatif** | `message` ≤ 2000, `name` ≤ 100, `email` ≤ 254 (validés **côté serveur**, jamais confiance au client). |
| **Validation côté serveur** | Zod dans la server action ; le client ne fait que de l'UX. Reason restreinte à l'enum. |
| **Contrôle d'accès admin** | `requireAdmin()` sur les actions admin + garde du layout `/admin` (rôle admin) + actions de mutation jamais exposées au public. |
| **Énumération / fuite d'info** | Réponses génériques (succès factice sur honeypot, message neutre sur rate-limit) ; aucune donnée utilisateur réfléchie. |
| **Injection d'en-têtes email** | N/A aujourd'hui (pas d'email envoyé). À re-vérifier si une notif email est ajoutée (échapper/valider avant tout header). |
| **Injection CSV** (si export futur) | Hors scope ; à noter : préfixer les champs commençant par `= + - @` si un export admin est ajouté. |
| **RGPD** | `source_ip` = intérêt légitime (anti-abus) ; nom/email/message = exécution d'une demande de contact. À mentionner dans la politique de confidentialité (ajout d'une ligne). Purge : `purgeUser` ne couvre pas ces messages (non liés à un user) — rétention à définir, hors scope immédiat. |

**Revue sécurité dédiée** : après l'implémentation de la server action publique + de la vue admin, lancer le skill `security-review` (ou un agent sécurité) sur le diff de la branche, en plus des revues spec + qualité de chaque tâche. Bloquant : toute faille Critical/High doit être corrigée avant merge.

## Tests
- Unit : `submitContactMessage` — schéma zod rejette nom/email/message/raison invalides ; honeypot rempli → pas d'insert ; (DB mockée façon `account-purge.test`).
- Unit : helper de rate-limit (compte par IP) si extrait.
- e2e léger : `/fr/contact` affiche le formulaire ; soumission valide → message de succès. (Admin nécessite auth+DB → smoke manuel.)

## Configuration
- **Aucun nouvel env var.**
- Migration `0016` à appliquer via `scripts/migrate-http.ts`.

## i18n
`contact.*` ×4 locales : hero (eyebrow/titre/intro), labels formulaire (nom/email/raison + options/message/envoyer), messages succès/erreur, coordonnées (libellés), FAQ (4 raisons + textes), carte (« Voir l'itinéraire »), + admin (colonnes/statuts — peut rester FR si l'admin est FR-only, comme la bannière nag).

## Hors scope
- Notif email à l'admin (Resend/domaine).
- Vraie carte interactive.
- Export CSV admin.
- Politique de rétention/purge automatique des messages.

## Effort estimé
~2 j : schema+migration (0.25), 2 server actions + sécurité (0.5), page contact + 4 blocs (0.5), vue admin liste+détail (0.5), i18n ×4 + tests (0.25).
