# Page Contact (sous-projet 2/2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le placeholder `/contact` par une vraie page premium multilingue (FR/NL/DE/EN) avec un formulaire sécurisé qui enregistre les messages dans une table DB + une vue admin (liste + détail + statuts).

**Architecture:** Table `contact_messages` (calquée sur `b2b_quote_requests`). Une server action `submitContactMessage` (zod serveur + honeypot + rate-limit par IP + insert paramétré) ; `adminUpdateMessageStatus` (requireAdmin). La page contact compose hero + `ContactForm` + coordonnées + carte statique + FAQ + social. Vue admin `/admin/messages` (liste façon `DevisTable`) + `/admin/messages/[id]` (détail + statuts). Tout le rendu du contenu utilisateur passe par React (échappement auto, **jamais** `dangerouslySetInnerHTML`).

**Tech Stack:** Next.js 15 App Router (server components + server actions), Drizzle + Neon, next-intl (fr/nl/de/en), zod, vitest. Repo **pnpm**. TS strict (noUncheckedIndexedAccess).

**Spec:** `docs/superpowers/specs/2026-05-31-contact-page-design.md`

**Conventions vérifiées :**
- Pattern formulaire→DB→admin : `b2b_quote_requests` + `lib/actions/b2b.actions.ts` (Result `{ok,data}|{ok,error}`, honeypot, `checkRateLimit(ip)`, `getClientIp(headers)` de `@/lib/auth/rate-limit`).
- Admin : pages vérifient `session?.user?.role !== "admin"` → `redirect("/")` ; `DevisTable` est server-rendered (React échappé). **Admin FR-only** (libellés en dur, comme l'existant).
- Migrations : `pnpm db:generate` puis **appliquer via `dotenv -e .env.local -- tsx scripts/migrate-http.ts <tag>`** (drizzle-kit migrate cale sur WebSocket Neon).
- `@/` = racine. `requireAdmin` n'existe que dans `journal.actions` (helper local) ; ici on inline le check `session?.user?.role !== "admin"`.
- Apostrophes françaises dans le JSX littéral → `react/no-unescaped-entities` ERROR ; mettre le texte en i18n (`t()`) ou échapper (`&apos;`).

**🔒 Sécurité (impératif — voir section Sécurité du spec) :** validation **côté serveur** (zod), honeypot, rate-limit IP, **aucun `dangerouslySetInnerHTML`**, requêtes Drizzle paramétrées, `requireAdmin` sur mutations admin, réponses génériques. Une **tâche de revue sécurité dédiée (Task 8)** lance le skill `security-review` sur la branche avant le merge.

---

## File Structure
**Créer :**
- `lib/db/schemas/contact.ts` — enums + table `contact_messages`
- `lib/queries/contact.ts` — `listContactMessages`, `getContactMessage`, `countRecentByIp`
- `lib/actions/contact.actions.ts` — `submitContactMessage`, `adminUpdateMessageStatus`
- `components/shop/ContactForm.tsx` — formulaire (client)
- `components/contact/ContactCoordinates.tsx`, `ContactMap.tsx`, `ContactFaq.tsx`
- `components/admin/MessagesTable.tsx`, `MessageStatusActions.tsx`
- `app/admin/messages/page.tsx`, `app/admin/messages/[id]/page.tsx`
- `tests/unit/contact-action.test.ts`
**Modifier :**
- `lib/db/schema.ts` (export contact)
- `app/[locale]/(shop)/contact/page.tsx` (remplacer ComingSoonPage)
- `components/admin/AdminSidebar.tsx` (lien Messages)
- `messages/{fr,nl,de,en}.json` (namespace `contact`)

---

## Task 1 : Schema + migration `0016_contact_messages`

**Files:** Create `lib/db/schemas/contact.ts`; Modify `lib/db/schema.ts`

- [ ] **Step 1 : Schema** — Create `lib/db/schemas/contact.ts`:

```ts
import { pgTable, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const contactReason = pgEnum("contact_reason", ["order", "b2b", "press", "delivery", "other"]);
export const contactStatus = pgEnum("contact_status", ["new", "read", "archived"]);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    email: text("email").notNull(),
    reason: contactReason("reason").notNull(),
    message: text("message").notNull(),
    locale: text("locale").notNull().default("fr"),
    status: contactStatus("status").notNull().default("new"),
    sourceIp: text("source_ip"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
  },
  (t) => ({
    statusCreatedIdx: index("contact_messages_status_created_idx").on(t.status, t.createdAt),
    sourceIpIdx: index("contact_messages_source_ip_idx").on(t.sourceIp),
  }),
);

export type ContactMessage = typeof contactMessages.$inferSelect;
export type ContactReason = (typeof contactReason.enumValues)[number];
export type ContactStatus = (typeof contactStatus.enumValues)[number];
```

- [ ] **Step 2 : Export** — In `lib/db/schema.ts`, add after the last export:
```ts
export * from "./schemas/contact";
```

- [ ] **Step 3 : Générer la migration** — Run: `npm run db:generate`
Expected: `drizzle/0016_*.sql` créé (CREATE TYPE contact_reason/contact_status, CREATE TABLE contact_messages, 2 index) + snapshot.

- [ ] **Step 4 : Appliquer via HTTP** — Run: `dotenv -e .env.local -- tsx scripts/migrate-http.ts <tag>` où `<tag>` = le nom du fichier généré sans `.sql` (ex. `0016_quick_owl`). Expected: « ✓ … appliquée(s) ». (Si la connexion Neon est indisponible, noter BLOCKED — le fichier de migration reste committé ; l'utilisateur l'appliquera.)

- [ ] **Step 5 : Typecheck + commit**
Run: `npm run typecheck` → clean.
```bash
git add lib/db/schemas/contact.ts lib/db/schema.ts drizzle/
git commit -m "feat(db): 0016 contact_messages table (reason/status enums)"
```

---

## Task 2 : Queries (`lib/queries/contact.ts`)

**Files:** Create `lib/queries/contact.ts`

- [ ] **Step 1 : Implémentation** — Create `lib/queries/contact.ts`:

```ts
import "server-only";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages, contactStatus, type ContactStatus } from "@/lib/db/schemas/contact";

const STATUSES = contactStatus.enumValues as readonly string[];

export async function listContactMessages(opts: { status?: string; limit?: number }) {
  const where =
    opts.status && STATUSES.includes(opts.status)
      ? eq(contactMessages.status, opts.status as ContactStatus)
      : undefined;
  return db
    .select()
    .from(contactMessages)
    .where(where)
    .orderBy(desc(contactMessages.createdAt))
    .limit(opts.limit ?? 100);
}

export async function getContactMessage(id: string) {
  const [row] = await db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
  return row ?? null;
}

/** Nombre de messages enregistrés depuis cette IP dans la fenêtre (anti-spam). */
export async function countRecentByIp(ip: string, withinMinutes: number): Promise<number> {
  const since = new Date(Date.now() - withinMinutes * 60_000);
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contactMessages)
    .where(and(eq(contactMessages.sourceIp, ip), gt(contactMessages.createdAt, since)));
  return rows[0]?.n ?? 0;
}
```

- [ ] **Step 2 : Typecheck + commit**
Run: `npm run typecheck` → clean.
```bash
git add lib/queries/contact.ts
git commit -m "feat(contact): queries (list/get/countRecentByIp)"
```

---

## Task 3 : Server action `submitContactMessage` (🔒 cœur sécurité) + tests

**Files:** Create `lib/actions/contact.actions.ts`; Test `tests/unit/contact-action.test.ts`

- [ ] **Step 1 : Test qui échoue** — Create `tests/unit/contact-action.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const inserted: unknown[] = [];
vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({ values: (v: unknown) => { inserted.push(v); return Promise.resolve(); } }),
  },
}));
vi.mock("next/headers", () => ({ headers: () => Promise.resolve(new Headers({ "x-forwarded-for": "9.9.9.9" })) }));
vi.mock("@/lib/queries/contact", () => ({ countRecentByIp: vi.fn(async () => 0) }));

import { submitContactMessage } from "@/lib/actions/contact.actions";
import { countRecentByIp } from "@/lib/queries/contact";

function fd(o: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
}
const valid = { name: "Jean", email: "JEAN@Example.com", reason: "order", message: "Bonjour, une question sur ma commande.", locale: "fr" };

beforeEach(() => { inserted.length = 0; vi.mocked(countRecentByIp).mockResolvedValue(0); });

describe("submitContactMessage", () => {
  it("insère un message valide (email normalisé) et renvoie ok", async () => {
    const res = await submitContactMessage(fd(valid));
    expect(res).toEqual({ ok: true });
    expect(inserted).toHaveLength(1);
    expect((inserted[0] as { email: string }).email).toBe("jean@example.com");
    expect((inserted[0] as { sourceIp: string }).sourceIp).toBe("9.9.9.9");
  });

  it("rejette une saisie invalide (message trop court) sans insérer", async () => {
    const res = await submitContactMessage(fd({ ...valid, message: "court" }));
    expect(res).toEqual({ ok: false, error: "invalid" });
    expect(inserted).toHaveLength(0);
  });

  it("rejette une raison hors enum", async () => {
    const res = await submitContactMessage(fd({ ...valid, reason: "hack" }));
    expect(res).toEqual({ ok: false, error: "invalid" });
    expect(inserted).toHaveLength(0);
  });

  it("honeypot rempli → ok factice, aucun insert", async () => {
    const res = await submitContactMessage(fd({ ...valid, company: "Acme Bot" }));
    expect(res).toEqual({ ok: true });
    expect(inserted).toHaveLength(0);
  });

  it("rate-limit (>=3 récents) → rejet sans insert", async () => {
    vi.mocked(countRecentByIp).mockResolvedValue(3);
    const res = await submitContactMessage(fd(valid));
    expect(res).toEqual({ ok: false, error: "rate-limit" });
    expect(inserted).toHaveLength(0);
  });
});
```

- [ ] **Step 2 : Lancer (échoue)** — Run: `npx vitest run tests/unit/contact-action.test.ts` → FAIL (module introuvable).

- [ ] **Step 3 : Implémentation** — Create `lib/actions/contact.actions.ts`:

```ts
"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schemas/contact";
import { getClientIp } from "@/lib/auth/rate-limit";
import { countRecentByIp } from "@/lib/queries/contact";
import { auth } from "@/lib/auth";

const REASONS = ["order", "b2b", "press", "delivery", "other"] as const;

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  reason: z.enum(REASONS),
  message: z.string().trim().min(10).max(2000),
  locale: z.string().max(5),
  company: z.string().optional(), // honeypot — doit rester vide
});

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function submitContactMessage(formData: FormData): Promise<ContactResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    reason: formData.get("reason"),
    message: formData.get("message"),
    locale: formData.get("locale"),
    company: formData.get("company") ?? undefined,
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  // Honeypot : un bot a rempli le champ caché → succès factice, rien stocké.
  if (parsed.data.company && parsed.data.company.trim() !== "") return { ok: true };

  const ip = getClientIp(await headers());
  if (ip && (await countRecentByIp(ip, 15)) >= 3) {
    return { ok: false, error: "rate-limit" };
  }

  await db.insert(contactMessages).values({
    name: parsed.data.name,
    email: parsed.data.email,
    reason: parsed.data.reason,
    message: parsed.data.message,
    locale: parsed.data.locale,
    sourceIp: ip ?? null,
  });
  return { ok: true };
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "read", "archived"]),
});

export async function adminUpdateMessageStatus(formData: FormData): Promise<ContactResult> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { ok: false, error: "forbidden" };

  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  await db
    .update(contactMessages)
    .set({
      status: parsed.data.status,
      readAt: parsed.data.status === "read" ? new Date() : undefined,
    })
    .where(eq(contactMessages.id, parsed.data.id));

  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${parsed.data.id}`);
  return { ok: true };
}
```

- [ ] **Step 4 : Lancer (passe)** — Run: `npx vitest run tests/unit/contact-action.test.ts` → PASS (5). `npm run typecheck` → clean.

- [ ] **Step 5 : Commit**
```bash
git add lib/actions/contact.actions.ts tests/unit/contact-action.test.ts
git commit -m "feat(contact): submitContactMessage (zod+honeypot+rate-limit) + adminUpdateMessageStatus"
```

> Note sécurité : `adminUpdateMessageStatus` est testé indirectement (Task 8 sécurité + le check `role!=="admin"` est en tête). La server action `submit` ne réfléchit aucune donnée utilisateur et stocke en requête paramétrée.

---

## Task 4 : ContactForm (client)

**Files:** Create `components/shop/ContactForm.tsx`

- [ ] **Step 1 : Implémentation** — Create `components/shop/ContactForm.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { submitContactMessage } from "@/lib/actions/contact.actions";
import { Button } from "@/components/ui/button";

const REASONS = ["order", "b2b", "press", "delivery", "other"] as const;

export function ContactForm({ locale }: { locale: string }) {
  const t = useTranslations("contact");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="border-honey-dark/30 bg-honey-dark/5 text-honey-dark rounded-xl border p-6 text-sm" role="status">
        {t("formSuccess")}
      </div>
    );
  }

  return (
    <form
      action={(fd) => {
        setError(null);
        start(async () => {
          const res = await submitContactMessage(fd);
          if (res.ok) setDone(true);
          else setError(t(`formError_${res.error}` as Parameters<typeof t>[0]));
        });
      }}
      className="space-y-4"
      aria-busy={pending || undefined}
    >
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot anti-spam : caché, jamais rempli par un humain */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label>
          Société
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="block">
        <span className="text-warm-brown text-sm">{t("formName")}</span>
        <input
          type="text" name="name" required minLength={2} maxLength={100} autoComplete="name"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("formEmail")}</span>
        <input
          type="email" name="email" required maxLength={254} autoComplete="email"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("formReason")}</span>
        <select
          name="reason" required defaultValue="order"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>{t(`reason_${r}` as Parameters<typeof t>[0])}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-warm-brown text-sm">{t("formMessage")}</span>
        <textarea
          name="message" required minLength={10} maxLength={2000} rows={5}
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:ring-2 focus:outline-none"
        />
      </label>

      {error && <p role="alert" className="text-terracotta text-sm">{error}</p>}
      <Button type="submit" disabled={pending}>{t("formSubmit")}</Button>
    </form>
  );
}
```

- [ ] **Step 2 : Typecheck + lint** — `npm run typecheck` clean ; `npm run lint --file components/shop/ContactForm.tsx` → 0 erreur.

- [ ] **Step 3 : Commit**
```bash
git add components/shop/ContactForm.tsx
git commit -m "feat(contact): ContactForm (reason select + honeypot, server-validated)"
```

---

## Task 5 : Page Contact + blocs (coordonnées, carte, FAQ)

**Files:** Create `components/contact/{ContactCoordinates,ContactMap,ContactFaq}.tsx`; Modify `app/[locale]/(shop)/contact/page.tsx`

- [ ] **Step 1 : ContactCoordinates** — Create `components/contact/ContactCoordinates.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

export async function ContactCoordinates() {
  const t = await getTranslations("contact");
  const rows: { label: string; value: string }[] = [
    { label: t("coordAddress"), value: "[adresse de l'atelier]" },
    { label: t("coordEmail"), value: "[email de contact]" },
    { label: t("coordPhone"), value: "[téléphone]" },
    { label: t("coordHours"), value: "[horaires d'ouverture]" },
  ];
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="text-honey-dark text-xs font-semibold tracking-wide uppercase">{r.label}</span>
          <p className="text-warm-brown/80 mt-0.5 text-sm">
            <mark className="bg-honey-cream text-honey-dark rounded px-1">{r.value}</mark>
          </p>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2 : ContactMap (statique, zéro cookie tiers)** — Create `components/contact/ContactMap.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

export async function ContactMap() {
  const t = await getTranslations("contact");
  // Adresse placeholder ; le lien Maps s'ouvre dans un nouvel onglet (aucun embed → aucun cookie tiers).
  const query = encodeURIComponent("Au Fil des Saveurs, Liège, Belgique");
  return (
    <div className="border-warm-brown/10 overflow-hidden rounded-2xl border">
      {/* Visuel de carte statique (dégradé + repère) — illustration, pas d'appel réseau tiers */}
      <div className="from-honey-cream to-cream relative flex h-48 items-center justify-center bg-gradient-to-br">
        <div className="text-honey-dark/70 text-5xl" aria-hidden>📍</div>
        <div className="bg-honey/10 absolute inset-0" aria-hidden
             style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(168,115,27,.12), transparent 60%), radial-gradient(circle at 70% 70%, rgba(168,115,27,.10), transparent 55%)" }} />
      </div>
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
        <p className="text-warm-brown/70 text-sm">
          <mark className="bg-honey-cream text-honey-dark rounded px-1">[adresse de l'atelier]</mark>
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${query}`}
          target="_blank" rel="noopener noreferrer"
          className="bg-honey text-cream hover:bg-honey-dark shrink-0 rounded-full px-4 py-2 text-sm font-medium"
        >
          {t("mapDirections")}
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : ContactFaq** — Create `components/contact/ContactFaq.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

export async function ContactFaq() {
  const t = await getTranslations("contact");
  const items = ["order", "b2b", "press", "delivery"] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((k) => (
        <div key={k} className="border-warm-brown/10 rounded-xl border bg-white p-5">
          <h3 className="text-warm-brown text-sm font-semibold">{t(`faq_${k}_title` as Parameters<typeof t>[0])}</h3>
          <p className="text-warm-brown/70 mt-1.5 text-sm leading-relaxed">{t(`faq_${k}_body` as Parameters<typeof t>[0])}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4 : Page Contact** — Replace `app/[locale]/(shop)/contact/page.tsx`:

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Section } from "@/components/ui-primitives/Section";
import { Container } from "@/components/ui-primitives/Container";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { ContactForm } from "@/components/shop/ContactForm";
import { ContactCoordinates } from "@/components/contact/ContactCoordinates";
import { ContactMap } from "@/components/contact/ContactMap";
import { ContactFaq } from "@/components/contact/ContactFaq";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("seoTitle"), description: t("seoDescription") };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  return (
    <Section py="lg">
      <Container variant="narrow">
        <div className="text-center">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Heading as="h1" size="h1" className="mt-3">{t("title")}</Heading>
          <Prose className="mx-auto mt-5"><p>{t("intro")}</p></Prose>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_320px]">
          <div className="order-2 md:order-1">
            <ContactForm locale={locale} />
          </div>
          <aside className="order-1 space-y-8 md:order-2">
            <ContactCoordinates />
            <ContactMap />
          </aside>
        </div>

        <div className="mt-16">
          <Heading as="h2" size="h3" className="mb-5 text-center">{t("faqTitle")}</Heading>
          <ContactFaq />
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 5 : Typecheck + lint + commit**
Run: `npm run typecheck` clean ; `npm run lint` 0 erreur (les apostrophes des placeholders `[adresse de l'atelier]` sont dans des **chaînes JS**, pas du texte JSX → pas de souci `no-unescaped-entities` ; vérifier qu'aucun apostrophe ne traîne en texte JSX brut).
```bash
git add components/contact "app/[locale]/(shop)/contact/page.tsx"
git commit -m "feat(contact): premium contact page (hero + form + coordinates + static map + FAQ)"
```

---

## Task 6 : Vue admin (liste + détail + statuts) + sidebar

**Files:** Create `components/admin/MessagesTable.tsx`, `components/admin/MessageStatusActions.tsx`, `app/admin/messages/page.tsx`, `app/admin/messages/[id]/page.tsx`; Modify `components/admin/AdminSidebar.tsx`

- [ ] **Step 1 : MessagesTable** — Create `components/admin/MessagesTable.tsx` (server, React-escaped — comme `DevisTable`):

```tsx
import Link from "next/link";

type Row = { id: string; name: string; email: string; reason: string; status: string; createdAt: Date };

const STATUS_LABELS: Record<string, string> = { new: "Nouveau", read: "Lu", archived: "Archivé" };
const REASON_LABELS: Record<string, string> = { order: "Commande", b2b: "Professionnels", press: "Presse", delivery: "Livraison", other: "Autre" };

export function MessagesTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <p className="rounded border border-dashed border-amber-200 p-6 text-amber-800">Aucun message.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-amber-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-amber-50 text-left text-amber-900">
          <tr>
            <th className="px-3 py-2">Nom</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Raison</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Statut</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-amber-100">
              <td className="px-3 py-2 font-medium">{r.name}</td>
              <td className="px-3 py-2">{r.email}</td>
              <td className="px-3 py-2">{REASON_LABELS[r.reason] ?? r.reason}</td>
              <td className="px-3 py-2">{r.createdAt.toLocaleDateString("fr-BE")}</td>
              <td className="px-3 py-2">{STATUS_LABELS[r.status] ?? r.status}</td>
              <td className="px-3 py-2">
                <Link className="text-amber-700 underline" href={`/admin/messages/${r.id}`}>Ouvrir</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2 : MessageStatusActions** — Create `components/admin/MessageStatusActions.tsx` (client):

```tsx
"use client";
import { useTransition } from "react";
import { adminUpdateMessageStatus } from "@/lib/actions/contact.actions";

const OPTIONS: { value: string; label: string }[] = [
  { value: "new", label: "Nouveau" },
  { value: "read", label: "Lu" },
  { value: "archived", label: "Archivé" },
];

export function MessageStatusActions({ id, current }: { id: string; current: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => (
        <form
          key={o.value}
          action={(fd) => start(() => adminUpdateMessageStatus(fd).then(() => {}))}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={o.value} />
          <button
            type="submit" disabled={pending || current === o.value}
            className={`rounded-full px-3 py-1.5 text-sm ${current === o.value ? "bg-amber-600 text-white" : "border border-amber-300 text-amber-800 hover:bg-amber-50"}`}
          >
            {o.label}
          </button>
        </form>
      ))}
    </div>
  );
}
```

- [ ] **Step 3 : Page liste** — Create `app/admin/messages/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listContactMessages } from "@/lib/queries/contact";
import { MessagesTable } from "@/components/admin/MessagesTable";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");
  const sp = await searchParams;
  const rows = await listContactMessages({ status: sp.status, limit: 100 });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">Messages de contact</h1>
        <nav className="flex gap-3 text-sm">
          {[
            { v: "", label: "Tous" },
            { v: "new", label: "Nouveaux" },
            { v: "read", label: "Lus" },
            { v: "archived", label: "Archivés" },
          ].map((f) => (
            <a key={f.v} href={f.v ? `/admin/messages?status=${f.v}` : "/admin/messages"} className="text-amber-700 underline">
              {f.label}
            </a>
          ))}
        </nav>
      </header>
      <MessagesTable rows={rows} />
    </div>
  );
}
```

- [ ] **Step 4 : Page détail** — Create `app/admin/messages/[id]/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getContactMessage } from "@/lib/queries/contact";
import { MessageStatusActions } from "@/components/admin/MessageStatusActions";

const REASON_LABELS: Record<string, string> = { order: "Commande", b2b: "Professionnels", press: "Presse", delivery: "Livraison", other: "Autre" };

export default async function AdminMessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");
  const { id } = await params;
  const msg = await getContactMessage(id);
  if (!msg) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/messages" className="text-amber-700 underline">← Retour</Link>
      <div className="rounded-lg border border-amber-200 bg-white p-6">
        <div className="flex flex-wrap justify-between gap-2 text-sm text-amber-900">
          <span className="font-semibold">{msg.name}</span>
          <span>{msg.createdAt.toLocaleString("fr-BE")}</span>
        </div>
        <p className="mt-1 text-sm text-amber-800">{msg.email} · {REASON_LABELS[msg.reason] ?? msg.reason}</p>
        {/* Contenu utilisateur rendu via React (échappé), retours ligne préservés, AUCUN HTML brut */}
        <p className="text-warm-brown/90 mt-4 text-sm whitespace-pre-wrap">{msg.message}</p>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-amber-900">Statut</p>
        <MessageStatusActions id={msg.id} current={msg.status} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5 : Lien sidebar** — In `components/admin/AdminSidebar.tsx`, add to the `items` array after the `devis` entry:
```ts
  { href: "/admin/messages", label: "Messages" },
```

- [ ] **Step 6 : Typecheck + lint + commit**
Run: `npm run typecheck` clean ; `npm run lint` 0 erreur (apostrophes éventuelles « ← Retour » etc. sont OK ; vérifier).
```bash
git add components/admin/MessagesTable.tsx components/admin/MessageStatusActions.tsx app/admin/messages components/admin/AdminSidebar.tsx
git commit -m "feat(admin): contact messages list + detail + status actions + sidebar link"
```

---

## Task 7 : i18n `contact.*` (×4 locales)

**Files:** Modify `messages/{fr,nl,de,en}.json`

- [ ] **Step 1 : Ajouter le namespace `contact`** (sibling de `legal`, `consent`…). FR :

```json
"contact": {
  "seoTitle": "Contact — Au Fil des Saveurs",
  "seoDescription": "Une question ? Écris-nous, on répond avec plaisir.",
  "eyebrow": "Parlons-en",
  "title": "Contactez-nous",
  "intro": "Une question sur une commande, une envie de coffret sur mesure, un projet professionnel ? Écris-nous — on adore échanger autour de nos biscuits.",
  "formName": "Ton nom",
  "formEmail": "Ton email",
  "formReason": "Sujet",
  "formMessage": "Ton message",
  "formSubmit": "Envoyer le message",
  "formSuccess": "Merci ! Ton message est bien arrivé, on te répond au plus vite.",
  "formError_invalid": "Vérifie les champs : tous sont requis (message d'au moins 10 caractères).",
  "formError_rate-limit": "Tu as déjà envoyé plusieurs messages. Réessaie dans quelques minutes.",
  "reason_order": "Ma commande",
  "reason_b2b": "Professionnels / B2B",
  "reason_press": "Presse",
  "reason_delivery": "Livraison",
  "reason_other": "Autre",
  "coordAddress": "Adresse",
  "coordEmail": "Email",
  "coordPhone": "Téléphone",
  "coordHours": "Horaires",
  "mapDirections": "Voir l'itinéraire",
  "faqTitle": "Comment peut-on t'aider ?",
  "faq_order_title": "Une commande",
  "faq_order_body": "Question sur une commande en cours, une modification, un suivi ? Indique ton numéro de commande dans le message.",
  "faq_b2b_title": "Professionnels",
  "faq_b2b_body": "Revendeur, événement, cadeau d'entreprise ? Parle-nous de ton projet, on construit une offre sur mesure.",
  "faq_press_title": "Presse",
  "faq_press_body": "Journaliste ou créateur de contenu ? On partage volontiers visuels et histoire de la maison.",
  "faq_delivery_title": "Livraison",
  "faq_delivery_body": "Un souci avec un colis ? Décris-nous la situation, on règle ça rapidement."
}
```

EN de référence (traduire NL/DE équivalemment, mêmes clés) :
```json
"contact": {
  "seoTitle": "Contact — Au Fil des Saveurs",
  "seoDescription": "A question? Write to us, we're happy to help.",
  "eyebrow": "Let's talk",
  "title": "Contact us",
  "intro": "A question about an order, a custom gift box, a business project? Write to us — we love talking about our biscuits.",
  "formName": "Your name",
  "formEmail": "Your email",
  "formReason": "Subject",
  "formMessage": "Your message",
  "formSubmit": "Send message",
  "formSuccess": "Thank you! Your message has arrived, we'll reply as soon as possible.",
  "formError_invalid": "Please check the fields: all are required (message of at least 10 characters).",
  "formError_rate-limit": "You've already sent several messages. Please try again in a few minutes.",
  "reason_order": "My order",
  "reason_b2b": "Business / B2B",
  "reason_press": "Press",
  "reason_delivery": "Delivery",
  "reason_other": "Other",
  "coordAddress": "Address",
  "coordEmail": "Email",
  "coordPhone": "Phone",
  "coordHours": "Opening hours",
  "mapDirections": "Get directions",
  "faqTitle": "How can we help?",
  "faq_order_title": "An order",
  "faq_order_body": "Question about a current order, a change, tracking? Include your order number in the message.",
  "faq_b2b_title": "Business",
  "faq_b2b_body": "Reseller, event, corporate gift? Tell us about your project and we'll build a tailored offer.",
  "faq_press_title": "Press",
  "faq_press_body": "Journalist or content creator? We're glad to share visuals and the story of the house.",
  "faq_delivery_title": "Delivery",
  "faq_delivery_body": "A problem with a parcel? Describe the situation and we'll sort it out quickly."
}
```

NL/DE : mêmes clés, traduction naturelle (NL je/jouw, DE du/dein).

- [ ] **Step 2 : Valider** — Run:
```
node -e "['fr','nl','de','en'].forEach(l=>{const m=require('./messages/'+l+'.json'); const c=m.contact; if(!c||!c.formSubmit||!c['formError_rate-limit']||!c.faq_order_title) throw new Error('contact manquant '+l)}); console.log('ok')"
```
Expected: `ok`.

- [ ] **Step 3 : Commit**
```bash
git add messages
git commit -m "i18n(contact): contact page keys (4 locales)"
```

---

## Task 8 : 🔒 Revue sécurité dédiée (skill security-review)

**Files:** aucune création — revue + corrections éventuelles.

- [ ] **Step 1 : Lancer la revue sécurité** — Invoke the `security-review` skill on the branch diff (les changements de cette feature). Couvrir spécifiquement :
  - `submitContactMessage` : validation serveur stricte, honeypot, rate-limit IP, aucune donnée réfléchie, requête paramétrée.
  - `adminUpdateMessageStatus` : `role !== "admin"` rejette ; zod `uuid`/enum.
  - Rendu du contenu utilisateur en admin : **aucun `dangerouslySetInnerHTML`**, `whitespace-pre-wrap` sur du texte échappé.
  - Pages admin : garde `session.user.role !== "admin"` sur liste + détail.
  - Pas de fuite via messages d'erreur ; honeypot renvoie un succès factice.
  - CSRF : server actions same-origin (natif).

- [ ] **Step 2 : Corriger** toute faille **Critical/High** trouvée (l'implémenteur applique les correctifs), puis **re-lancer** la revue jusqu'à 0 Critical/High. Documenter les findings Medium/Low acceptés.

- [ ] **Step 3 : Commit** (s'il y a des correctifs)
```bash
git add -A
git commit -m "fix(security): address contact-page security review findings"
```

> Cette tâche est **bloquante** : pas de merge tant qu'il reste une faille Critical/High.

---

## Task 9 : Vérification finale (+ e2e léger)

- [ ] **Step 1 : Suite unitaire + typecheck + lint**
Run: `npx dotenv -e .env.local -- npx vitest run` → tous verts (dont `contact-action.test.ts`).
Run: `npm run typecheck` (clean) ; `npm run lint` (0 erreur).

- [ ] **Step 2 : e2e léger** — Create `tests/e2e/contact.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("la page contact affiche le formulaire et soumet un message valide", async ({ page }) => {
  await page.goto("/fr/contact");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Contactez-nous/i);
  await page.getByLabel(/Ton nom/i).fill("Jean Test");
  await page.getByLabel(/Ton email/i).fill("jean.test@example.com");
  await page.getByLabel(/Sujet/i).selectOption("order");
  await page.getByLabel(/Ton message/i).fill("Bonjour, ceci est un message de test e2e suffisamment long.");
  await page.getByRole("button", { name: /Envoyer le message/i }).click();
  await expect(page.getByText(/ton message est bien arrivé/i)).toBeVisible();
});
```

Run (best-effort, nécessite serveur dev + DB migrée pour l'insert) : `npx playwright test contact`. Si la DB n'a pas la migration 0016 appliquée, l'insert échoue → noter que le test passe une fois `0016` appliquée (le formulaire + la validation s'affichent quoi qu'il arrive ; ajuster l'assertion au besoin pour ne tester que l'affichage si la DB n'est pas prête).

- [ ] **Step 3 : Commit**
```bash
git add tests/e2e/contact.spec.ts
git commit -m "test(e2e): contact page form submission"
```

---

## Self-Review

**Couverture du spec :**

| Section spec | Tâche |
|---|---|
| Schema `contact_messages` + enums + migration 0016 (HTTP) | T1 |
| Queries list/get/countRecentByIp | T2 |
| `submitContactMessage` (zod serveur + honeypot + rate-limit IP) + tests | T3 |
| `adminUpdateMessageStatus` (requireAdmin) | T3 |
| `ContactForm` (reason select + honeypot) | T4 |
| Page contact (hero + form + coordonnées + carte statique + FAQ) | T5 |
| Vue admin liste + détail + statuts + sidebar | T6 |
| i18n `contact.*` ×4 | T7 |
| 🔒 Revue sécurité dédiée (bloquante) | T8 |
| Vérif + e2e | T9 |

Pas de gap.

**Sécurité (du spec) couverte :** XSS→React-only (T5/T6, vérifié T8), SQLi→Drizzle paramétré (T3), CSRF→server actions (natif), spam→honeypot+rate-limit (T3/T4), payload→bornes zod serveur (T3), accès admin→`role!=="admin"` (T3/T6), pas de fuite→réponses génériques (T3). Revue T8 valide le tout.

**Scan placeholders :** Les `[adresse de l'atelier]`/`[email de contact]`/etc. sont des **placeholders métier intentionnels** (mockup, surlignés via `<mark>`). Traductions NL/DE = transformation définie du FR/EN. Pas d'autre placeholder.

**Cohérence des types :**
- `submitContactMessage(formData): ContactResult` — T3, consommé T4.
- `adminUpdateMessageStatus(formData): ContactResult` — T3, consommé T6 (`MessageStatusActions`).
- `listContactMessages`/`getContactMessage`/`countRecentByIp` — T2, consommés T3/T6.
- `contactMessages` table + `ContactReason`/`ContactStatus` — T1, utilisés partout.
- Clés i18n `contact.*` (formName/reason_*/faq_*/coord*/mapDirections/seo*) référencées T4/T5 toutes définies T7.

Pas de dérive.

---

## Execution Handoff

**Plan complet et sauvegardé dans `docs/superpowers/plans/2026-05-31-contact-page.md`. Deux options :**

**1. Subagent-Driven (recommandé)** — un subagent frais par tâche, revue spec + qualité, **+ revue sécurité dédiée (Task 8) via le skill security-review**.

**2. Inline** — exécution dans cette session avec checkpoints.

Laquelle ?
