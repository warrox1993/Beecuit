# BeeCuit — Phase 1 Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the visual quality of all Phase 1 public pages to a "photographique premium gourmand" level (refs Aesop / La Maison du Chocolat / Hotel Chocolat) without touching any functional scope, without 3D, and without sophisticated animations. Establish a reusable design system (typography + primitives) that Phase 2 features can build on.

**Architecture:** Component-first refactor inside the existing Next.js 15 App Router monolith. Add `next/font/google` (Fraunces + Inter). Create 5 lightweight UI primitives (`Container`, `Section`, `Eyebrow`, `Heading`, `Prose`) used across all touched pages. Refactor `Header` + `Footer`, split the homepage into 6 sub-components, redesign catalog `ProductCard` (4/5 portrait) + product detail (60/40 split with related products), polish cart/checkout/account/sign-in lightly, add 10 stylized "Bientôt disponible" pages for the future routes already linked from the header/footer.

**Tech Stack additions over Phase 1:** `next/font/google` (Fraunces + Inter, already in deps via Next.js) · shadcn `sheet` (for mobile nav drawer)

**Spec:** `docs/superpowers/specs/2026-05-23-phase1-polish-design.md`

**Working directory:** `C:\Users\jeanb\Documents\WebAPP\BeeCuit` (Windows, PowerShell)

**Package manager:** pnpm

**Current branch:** `phase-1-ecommerce-base` (continuing on the same Phase 1 feature branch — polish lands on the same branch, then the whole thing merges to `main` at the end of Phase 1)

---

## Prerequisites (manual, one-off)

Nothing to do externally. The implementer reads the spec section 3 about photos — **the polish ships with picsum.photos placeholders + cookie-tinted fallbacks**, real photos arrive later via the admin uploader (already built in Phase 1 Task 22).

---

## File structure produced by this polish

```
beecuit/
├── app/
│   ├── layout.tsx                                # MODIFIED: next/font setup
│   ├── globals.css                               # MODIFIED: tokens + sémantiques
│   ├── [locale]/
│   │   └── (shop)/
│   │       ├── page.tsx                          # MODIFIED: orchestrate 6 sections
│   │       ├── biscuits/page.tsx                 # MODIFIED: sidebar filters + new card
│   │       ├── biscuits/[slug]/page.tsx          # MODIFIED: split 60/40 + related
│   │       ├── panier/page.tsx                   # MODIFIED: polish typo + spacing
│   │       ├── checkout/page.tsx                 # MODIFIED: polish form
│   │       ├── commande-confirmee/[orderNumber]/page.tsx  # MODIFIED: success illust
│   │       ├── sign-in/page.tsx                  # MODIFIED: centered card
│   │       ├── coffrets/page.tsx                 # NEW: ComingSoon
│   │       ├── abonnement/page.tsx               # NEW: ComingSoon
│   │       ├── journal/page.tsx                  # NEW: ComingSoon
│   │       ├── notre-histoire/page.tsx           # NEW: ComingSoon
│   │       ├── contact/page.tsx                  # NEW: ComingSoon
│   │       ├── entreprises/page.tsx              # NEW: ComingSoon
│   │       ├── cgv/page.tsx                      # NEW: ComingSoon
│   │       ├── mentions-legales/page.tsx         # NEW: ComingSoon
│   │       ├── confidentialite/page.tsx          # NEW: ComingSoon
│   │       └── cookies/page.tsx                  # NEW: ComingSoon
│   └── (account)/compte/
│       ├── page.tsx                              # MODIFIED: polish header + cards
│       ├── adresses/page.tsx                     # MODIFIED: polish
│       └── commandes/page.tsx + [orderNumber]/   # MODIFIED: polish
├── components/
│   ├── ui-primitives/                            # NEW directory
│   │   ├── Container.tsx                         # NEW
│   │   ├── Section.tsx                           # NEW
│   │   ├── Eyebrow.tsx                           # NEW
│   │   ├── Heading.tsx                           # NEW
│   │   └── Prose.tsx                             # NEW
│   ├── layout/
│   │   ├── Header.tsx                            # MODIFIED: sticky + nav refondue
│   │   ├── Footer.tsx                            # MODIFIED: 4-col + newsletter + social
│   │   ├── LocaleSwitcher.tsx                    # MODIFIED: dropdown compact
│   │   ├── NavLink.tsx                           # NEW: link with active + greyout
│   │   └── MobileNav.tsx                         # NEW: drawer mobile
│   ├── home/                                     # NEW directory
│   │   ├── Hero.tsx                              # NEW
│   │   ├── FeaturedProducts.tsx                  # NEW
│   │   ├── StoryTeaser.tsx                       # NEW
│   │   ├── CoffretsTeaser.tsx                    # NEW
│   │   ├── InstagramGrid.tsx                     # NEW
│   │   └── NewsletterCTA.tsx                     # NEW
│   ├── shop/
│   │   ├── ProductCard.tsx                       # MODIFIED: aspect 4/5
│   │   ├── ProductImages.tsx                     # MODIFIED: bigger thumbnails
│   │   ├── CategoryFilter.tsx                    # MODIFIED: variant prop sidebar|chips
│   │   ├── TrustIndicators.tsx                   # NEW
│   │   └── RelatedProducts.tsx                   # NEW
│   ├── common/
│   │   ├── ComingSoonPage.tsx                    # NEW
│   │   └── NewsletterForm.tsx                    # NEW
│   └── ui/sheet.tsx                              # NEW via shadcn add
├── lib/
│   ├── queries/catalog.ts                        # MODIFIED: + listRelatedProducts + listFeaturedProducts
│   ├── actions/newsletter.actions.ts             # NEW (stub)
│   └── coming-soon-pages.ts                      # NEW: config per route
├── messages/{fr,nl,de,en}.json                   # MODIFIED: + nav futurs, footer, hero
└── public/images/                                # NEW directory
    └── (eventually hero.jpg from user)
```

---

## Task 1: Add `next/font` Fraunces + Inter + extend globals.css tokens

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Setup next/font in `app/layout.tsx`**

Replace the existing content with :

```tsx
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${fraunces.variable} ${inter.variable}`}>
      {children}
    </html>
  );
}
```

Note : This is a deliberate change from Phase 0 where `RootLayout` returned just `{children}`. We now wrap in `<html>` here to hoist the font CSS variables onto the document root. The locale-specific `<html lang>` attribute is still set by `app/[locale]/layout.tsx` — Next.js merges them.

If after this change Next.js complains about nested `<html>`, remove the `<html lang>` from `app/[locale]/(shop)/layout.tsx` and `app/[locale]/(account)/layout.tsx` and rely solely on this root one — but try the merged version first because next-intl docs support it.

- [ ] **Step 2: Update `app/globals.css` to consume the font variables + add sémantic tokens**

Replace the `@theme { }` block to use the new font variables and add semantic color tokens. Find the existing typography block :

```css
/* — Typography — */
--font-display: "Fraunces", ui-serif, Georgia, serif;
--font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;
```

Replace with :

```css
/* — Typography — */
--font-display: var(--font-fraunces, "Fraunces"), ui-serif, Georgia, serif;
--font-body: var(--font-inter, "Inter"), ui-sans-serif, system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;
```

And add at the end of the `@theme { }` block (just before the closing `}` of `@theme`) :

```css
/* — Sémantic color tokens — */
--color-surface: var(--color-cream);
--color-surface-elev: #ffffff;
--color-ink: var(--color-warm-brown);
--color-ink-muted: rgb(74 51 42 / 0.7);
--color-border: rgb(74 51 42 / 0.1);
--color-accent: var(--color-honey);
--color-accent-strong: var(--color-honey-dark);
```

- [ ] **Step 3: Verify visually**

```powershell
pnpm dev
```

Open `http://localhost:3000/fr`. The hero title "BeeCuit" should now render in **Fraunces** (clear serif with the characteristic Fraunces feel). The body text should render in **Inter** (clean sans-serif, distinct from system font). Use Chrome DevTools → Inspect → Computed → `font-family` to confirm.

Stop the server.

- [ ] **Step 4: Commit**

```powershell
git add app/layout.tsx app/globals.css
git commit -m "feat(polish): next/font Fraunces + Inter + semantic color tokens"
```

---

## Task 2: 5 UI primitives — Container, Section, Eyebrow, Heading, Prose

**Files:**
- Create: `components/ui-primitives/Container.tsx`, `Section.tsx`, `Eyebrow.tsx`, `Heading.tsx`, `Prose.tsx`

- [ ] **Step 1: `components/ui-primitives/Container.tsx`**

```tsx
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  variant?: "default" | "narrow";
  className?: string;
};

export function Container({ children, variant = "default", className }: Props) {
  return (
    <div
      className={cn(
        "mx-auto px-6 md:px-8",
        variant === "default" ? "max-w-6xl" : "max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: `components/ui-primitives/Section.tsx`**

```tsx
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  py?: "sm" | "md" | "lg";
  bg?: "default" | "surface-elev" | "cookie";
  className?: string;
};

const PY = {
  sm: "py-12 md:py-16",
  md: "py-16 md:py-24",
  lg: "py-20 md:py-32",
} as const;

const BG = {
  default: "",
  "surface-elev": "bg-white",
  cookie: "bg-cookie/20",
} as const;

export function Section({ children, py = "md", bg = "default", className }: Props) {
  return <section className={cn(PY[py], BG[bg], className)}>{children}</section>;
}
```

- [ ] **Step 3: `components/ui-primitives/Eyebrow.tsx`**

```tsx
import { cn } from "@/lib/utils";

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-honey-dark text-xs font-semibold uppercase tracking-[0.1em]", className)}>
      {children}
    </p>
  );
}
```

- [ ] **Step 4: `components/ui-primitives/Heading.tsx`**

```tsx
import { cn } from "@/lib/utils";

type Props = {
  as?: "h1" | "h2" | "h3";
  size?: "display" | "h1" | "h2" | "h3";
  children: React.ReactNode;
  className?: string;
};

const SIZE = {
  display: "font-display font-medium tracking-[-0.02em] leading-[1.0] text-[clamp(2.5rem,6vw,5rem)]",
  h1: "font-display font-medium tracking-[-0.02em] leading-[1.1] text-[clamp(2rem,4vw,3.5rem)]",
  h2: "font-display font-medium leading-[1.15] text-[clamp(1.5rem,3vw,2.5rem)]",
  h3: "font-display font-medium text-[1.25rem] md:text-[1.5rem]",
} as const;

export function Heading({ as = "h2", size, children, className }: Props) {
  const Tag = as;
  const effectiveSize = size ?? as;
  return (
    <Tag className={cn(SIZE[effectiveSize], "text-warm-brown", className)}>
      {children}
    </Tag>
  );
}
```

- [ ] **Step 5: `components/ui-primitives/Prose.tsx`**

```tsx
import { cn } from "@/lib/utils";

export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-prose text-warm-brown/80 text-base leading-[1.6]", className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Verify**

```powershell
pnpm typecheck
```

Expected : no errors.

- [ ] **Step 7: Commit**

```powershell
git add components/ui-primitives/
git commit -m "feat(polish): UI primitives Container, Section, Eyebrow, Heading, Prose"
```

---

## Task 3: Add shadcn `sheet` for mobile nav drawer + Refactor LocaleSwitcher to dropdown

**Files:**
- Add: `components/ui/sheet.tsx` (via shadcn)
- Add: `components/ui/dropdown-menu.tsx` (via shadcn, needed for LocaleSwitcher)
- Modify: `components/layout/LocaleSwitcher.tsx`

- [ ] **Step 1: Install shadcn sheet + dropdown-menu**

```powershell
pnpm dlx shadcn@latest add sheet
pnpm dlx shadcn@latest add dropdown-menu
```

Expected : `components/ui/sheet.tsx` and `components/ui/dropdown-menu.tsx` created, deps `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu` added.

- [ ] **Step 2: Rewrite `components/layout/LocaleSwitcher.tsx`**

```tsx
"use client";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const LABELS: Record<string, string> = { fr: "FR", nl: "NL", de: "DE", en: "EN" };

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-warm-brown hover:text-honey-dark flex items-center gap-1 text-sm font-medium tracking-wide uppercase">
        {LABELS[currentLocale] ?? currentLocale.toUpperCase()}
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[80px]">
        {routing.locales.map((l) => (
          <DropdownMenuItem key={l} asChild className="cursor-pointer">
            <Link
              href="/"
              locale={l}
              className={`block w-full text-center text-sm uppercase ${l === currentLocale ? "text-honey-dark font-semibold" : "text-warm-brown"}`}
            >
              {LABELS[l] ?? l.toUpperCase()}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Note : Add `lucide-react` if not already in deps. Most shadcn primitives ship `lucide-react` — verify with `pnpm list lucide-react`. If absent, `pnpm add lucide-react`.

- [ ] **Step 3: Verify**

```powershell
pnpm typecheck
pnpm dev
```

Visit `/fr`. The header should now show `FR ▼` instead of 4 separate locale links. Clicking opens a dropdown with NL/DE/EN. Stop server.

- [ ] **Step 4: Commit**

```powershell
git add components/ui/sheet.tsx components/ui/dropdown-menu.tsx components/layout/LocaleSwitcher.tsx package.json pnpm-lock.yaml
git commit -m "feat(polish): shadcn sheet + dropdown + LocaleSwitcher compact dropdown"
```

---

## Task 4: Header refactor — sticky 80px + NavLink + MobileNav drawer

**Files:**
- Modify: `components/layout/Header.tsx`
- Create: `components/layout/NavLink.tsx`
- Create: `components/layout/MobileNav.tsx`
- Modify: `messages/{fr,nl,de,en}.json` (add nav.coffrets, nav.abonnement, nav.journal greyout labels)

- [ ] **Step 1: Add greyout-future nav translations to message files**

In each `messages/*.json` under `nav`, add (or update) :

`fr.json` :
```json
"nav": {
  "home": "Accueil",
  "biscuits": "Biscuits",
  "coffrets": "Coffrets",
  "abonnement": "Abonnement",
  "journal": "Journal",
  "account": "Mon compte",
  "signIn": "Se connecter",
  "signOut": "Se déconnecter",
  "comingSoon": "Bientôt disponible",
  "menu": "Menu"
}
```

`nl.json` : same shape, translate ("Koekjes" / "Dozen" / "Abonnement" / "Journal" / "Mijn account" / "Binnenkort beschikbaar" / "Menu")

`de.json` : ("Kekse" / "Boxen" / "Abonnement" / "Journal" / "Mein Konto" / "Bald verfügbar" / "Menü")

`en.json` : ("Biscuits" / "Boxes" / "Subscription" / "Journal" / "My account" / "Coming soon" / "Menu")

- [ ] **Step 2: Create `components/layout/NavLink.tsx`** (client, with active + greyout states)

```tsx
"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
  comingSoon = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  comingSoon?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium tracking-wide transition-colors",
        isActive ? "text-honey-dark" : "text-warm-brown hover:text-honey-dark",
        comingSoon && "text-warm-brown/50 hover:text-warm-brown/70",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
```

- [ ] **Step 3: Create `components/layout/MobileNav.tsx`** (client, drawer)

```tsx
"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { NavLink } from "./NavLink";
import { useTranslations } from "next-intl";

export function MobileNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t("menu")}
        className="text-warm-brown hover:text-honey-dark md:hidden"
      >
        <Menu className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="right" className="bg-cream w-80">
        <SheetHeader>
          <SheetTitle className="text-honey font-display text-2xl">BeeCuit</SheetTitle>
        </SheetHeader>
        <nav className="mt-8 flex flex-col gap-4" onClick={() => setOpen(false)}>
          <NavLink href="/biscuits" className="text-lg">{t("biscuits")}</NavLink>
          <NavLink href="/coffrets" comingSoon className="text-lg">{t("coffrets")}</NavLink>
          <NavLink href="/abonnement" comingSoon className="text-lg">{t("abonnement")}</NavLink>
          <NavLink href="/journal" comingSoon className="text-lg">{t("journal")}</NavLink>
          <NavLink href="/compte" className="text-lg">{t("account")}</NavLink>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Rewrite `components/layout/Header.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { CartIcon } from "./CartIcon";
import { NavLink } from "./NavLink";
import { MobileNav } from "./MobileNav";

export async function Header({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  return (
    <header className="bg-cream/95 border-warm-brown/10 sticky top-0 z-50 border-b backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between md:h-20">
          <Link href="/" className="text-honey font-display text-2xl">
            BeeCuit
          </Link>
          <nav className="hidden gap-8 md:flex" aria-label="Principal">
            <NavLink href="/biscuits">{t("biscuits")}</NavLink>
            <NavLink href="/coffrets" comingSoon>{t("coffrets")}</NavLink>
            <NavLink href="/abonnement" comingSoon>{t("abonnement")}</NavLink>
            <NavLink href="/journal" comingSoon>{t("journal")}</NavLink>
          </nav>
          <div className="flex items-center gap-5">
            <div className="hidden md:block">
              <LocaleSwitcher currentLocale={locale} />
            </div>
            <CartIcon />
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
```

- [ ] **Step 5: Verify**

```powershell
pnpm typecheck
pnpm dev
```

Visit `/fr` desktop : header sticky 80px, 4 nav links centrés (Coffrets / Abonnement / Journal grisés), `FR ▼` à droite. Resize browser < 768px : nav links disparaissent, hamburger `☰` apparaît, clic ouvre drawer slide-in droite. Stop server.

- [ ] **Step 6: Commit**

```powershell
git add components/layout/ messages/
git commit -m "feat(polish): sticky 80px Header + NavLink active/greyout + MobileNav drawer"
```

---

## Task 5: Footer refactor — 4-col + newsletter + social

**Files:**
- Modify: `components/layout/Footer.tsx`
- Create: `components/common/NewsletterForm.tsx`
- Create: `lib/actions/newsletter.actions.ts`
- Modify: `messages/{fr,nl,de,en}.json` (add `footer.*` keys)

- [ ] **Step 1: Newsletter stub Server Action**

`lib/actions/newsletter.actions.ts` :

```typescript
"use server";
import { z } from "zod";

const Schema = z.object({ email: z.string().email() });

export async function subscribeToNewsletter(raw: unknown): Promise<{ success: boolean; message: string }> {
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: "Email invalide" };
  }
  // Phase 4 will wire this to Resend audience or a custom newsletter store.
  console.log("[newsletter] subscribe stub:", parsed.data.email);
  return { success: true, message: "Merci ! On te tient au courant." };
}
```

- [ ] **Step 2: NewsletterForm component**

`components/common/NewsletterForm.tsx` :

```tsx
"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { subscribeToNewsletter } from "@/lib/actions/newsletter.actions";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await subscribeToNewsletter({ email });
          setMsg({ ok: r.success, text: r.message });
          if (r.success) setEmail("");
        });
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 flex-1 rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2"
        />
        <Button
          type="submit"
          disabled={pending}
          className="bg-honey text-cream hover:bg-honey-dark"
        >
          {pending ? "..." : "S'inscrire"}
        </Button>
      </div>
      {msg && (
        <p className={`text-xs ${msg.ok ? "text-leaf" : "text-terracotta"}`}>{msg.text}</p>
      )}
    </form>
  );
}
```

- [ ] **Step 3: Add footer translations**

Append to each `messages/*.json` under root (or update existing `footer`) :

`fr.json` :
```json
"footer": {
  "tagline": "Biscuits artisanaux belges, faits avec amour à Liège.",
  "copyright": "© {year} BeeCuit — Tous droits réservés",
  "address": "Rue de la Maison 12 · 4000 Liège",
  "hours": "Mer-sam, 10h-18h",
  "columnShop": "Boutique",
  "columnHouse": "Maison",
  "columnHelp": "Aide & légal",
  "newsletterTitle": "Reçois nos nouveautés",
  "newsletterTagline": "Et un -10 % à la première commande.",
  "madeWith": "Fait avec ♥ à Liège",
  "links": {
    "biscuits": "Biscuits",
    "coffrets": "Coffrets",
    "abonnement": "Abonnement",
    "giftCards": "Cartes cadeaux",
    "story": "Notre histoire",
    "journal": "Journal",
    "contact": "Nous contacter",
    "b2b": "Entreprises",
    "faq": "FAQ",
    "shipping": "Livraison",
    "returns": "Retours",
    "terms": "CGV",
    "legal": "Mentions légales",
    "privacy": "Confidentialité",
    "cookies": "Cookies"
  }
}
```

NL/DE/EN : translate naturally (use the spirit of the FR copy, professional tone).

- [ ] **Step 4: Rewrite `components/layout/Footer.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/common/NewsletterForm";
import { Instagram, Facebook } from "lucide-react";

export async function Footer({ locale }: { locale: string }) {
  setRequestLocale(locale);
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cream border-warm-brown/10 mt-24 border-t">
      <Container>
        <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-4">
          <div>
            <p className="text-honey font-display text-2xl">BeeCuit</p>
            <p className="text-warm-brown/80 mt-4 text-sm">{t("tagline")}</p>
            <p className="text-warm-brown/70 mt-4 text-xs">{t("address")}</p>
            <p className="text-warm-brown/70 text-xs">{t("hours")}</p>
          </div>
          <div>
            <p className="text-honey-dark mb-4 text-xs font-semibold uppercase tracking-[0.1em]">{t("columnShop")}</p>
            <ul className="text-warm-brown/80 space-y-2 text-sm">
              <li><Link href="/biscuits" className="hover:text-honey-dark">{t("links.biscuits")}</Link></li>
              <li><Link href="/coffrets" className="hover:text-honey-dark">{t("links.coffrets")}</Link></li>
              <li><Link href="/abonnement" className="hover:text-honey-dark">{t("links.abonnement")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-honey-dark mb-4 text-xs font-semibold uppercase tracking-[0.1em]">{t("columnHouse")}</p>
            <ul className="text-warm-brown/80 space-y-2 text-sm">
              <li><Link href="/notre-histoire" className="hover:text-honey-dark">{t("links.story")}</Link></li>
              <li><Link href="/journal" className="hover:text-honey-dark">{t("links.journal")}</Link></li>
              <li><Link href="/contact" className="hover:text-honey-dark">{t("links.contact")}</Link></li>
              <li><Link href="/entreprises" className="hover:text-honey-dark">{t("links.b2b")}</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-honey-dark mb-4 text-xs font-semibold uppercase tracking-[0.1em]">{t("columnHelp")}</p>
              <ul className="text-warm-brown/80 space-y-2 text-sm">
                <li><Link href="/cgv" className="hover:text-honey-dark">{t("links.terms")}</Link></li>
                <li><Link href="/mentions-legales" className="hover:text-honey-dark">{t("links.legal")}</Link></li>
                <li><Link href="/confidentialite" className="hover:text-honey-dark">{t("links.privacy")}</Link></li>
                <li><Link href="/cookies" className="hover:text-honey-dark">{t("links.cookies")}</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-warm-brown font-display text-base">{t("newsletterTitle")}</p>
              <p className="text-warm-brown/70 mb-3 text-xs">{t("newsletterTagline")}</p>
              <NewsletterForm />
            </div>
          </div>
        </div>
        <div className="border-warm-brown/10 flex flex-col gap-4 border-t py-6 md:flex-row md:items-center md:justify-between">
          <p className="text-warm-brown/60 text-xs">{t("copyright", { year })}</p>
          <p className="text-warm-brown/60 text-xs">{t("madeWith")}</p>
          <div className="text-warm-brown/60 flex gap-4">
            <a href="#" aria-label="Instagram" className="hover:text-honey-dark"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="Facebook" className="hover:text-honey-dark"><Facebook className="h-4 w-4" /></a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
```

- [ ] **Step 5: Verify**

```powershell
pnpm typecheck
pnpm dev
```

Scroll to bottom of `/fr` → footer 4-col visible avec newsletter input + social icons. Soumets un email → toast vert "Merci ! On te tient au courant." Stop server.

- [ ] **Step 6: Commit**

```powershell
git add components/layout/Footer.tsx components/common/NewsletterForm.tsx lib/actions/newsletter.actions.ts messages/
git commit -m "feat(polish): Footer 4-col + newsletter stub + social icons"
```

---

## Task 6: Homepage — Hero section + helper query

**Files:**
- Modify: `lib/queries/catalog.ts` (add `listFeaturedProducts`)
- Create: `components/home/Hero.tsx`
- Modify: `app/[locale]/(shop)/page.tsx` (extract hero only for now)
- Modify: `messages/{fr,nl,de,en}.json` (extend `home.*`)

- [ ] **Step 1: Add hero translations**

In each `messages/*.json` extend `home` :

`fr.json` :
```json
"home": {
  "title": "BeeCuit",
  "tagline": "Biscuits artisanaux de Liège",
  "cta": "Découvrir nos biscuits",
  "languageSwitcher": "Changer de langue",
  "heroEyebrow": "MAISON BEECUIT — LIÈGE",
  "heroTitle": "Le biscuit belge,",
  "heroTitleAccent": "fait à la main.",
  "heroProse": "Spéculoos cuits doucement, sablés au beurre frais belge, macarons à la noisette du Piémont. Tout est fait à Liège, en petites quantités, pour préserver le goût.",
  "heroCtaPrimary": "Découvrir nos biscuits",
  "heroCtaSecondary": "Notre histoire"
}
```

NL/DE/EN : translate professionally (use the spirit of FR — "biscuit belge fait à la main" = "Belgian biscuit, handmade").

- [ ] **Step 2: `lib/queries/catalog.ts` — add `listFeaturedProducts`**

Append to the existing file :

```typescript
export async function listFeaturedProducts(locale: Locale, limit = 3) {
  const featured = await db
    .select({
      id: products.id,
      sku: products.sku,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      primaryImageUrl: sql<string | null>`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
      categoryName: sql<string | null>`(SELECT name FROM category_translations WHERE category_id = ${products.categoryId} AND locale = ${locale} LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
    .orderBy(products.createdAt)
    .limit(limit);

  if (featured.length >= limit) return featured;

  // Fallback : top up with the most recent active products
  const rest = await db
    .select({
      id: products.id,
      sku: products.sku,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      name: productTranslations.name,
      slug: productTranslations.slug,
      shortDescription: productTranslations.shortDescription,
      primaryImageUrl: sql<string | null>`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
      categoryName: sql<string | null>`(SELECT name FROM category_translations WHERE category_id = ${products.categoryId} AND locale = ${locale} LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(eq(products.isActive, true))
    .orderBy(products.createdAt)
    .limit(limit);

  const seen = new Set(featured.map((f) => f.id));
  for (const r of rest) {
    if (!seen.has(r.id) && featured.length < limit) featured.push(r);
  }
  return featured;
}
```

- [ ] **Step 3: Create `components/home/Hero.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Button } from "@/components/ui/button";

export async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations("home");
  return (
    <section className="bg-cream py-20 md:py-32">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            <Eyebrow>{t("heroEyebrow")}</Eyebrow>
            <Heading as="h1" size="display">
              {t("heroTitle")}
              <br />
              <em className="text-honey-dark not-italic font-display">{t("heroTitleAccent")}</em>
            </Heading>
            <Prose>{t("heroProse")}</Prose>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/biscuits">
                <Button className="bg-honey text-cream hover:bg-honey-dark px-6 py-6 text-base">
                  {t("heroCtaPrimary")} →
                </Button>
              </Link>
              <Link href="/notre-histoire">
                <Button variant="outline" className="border-warm-brown/20 text-warm-brown hover:bg-warm-brown/5 px-6 py-6 text-base">
                  {t("heroCtaSecondary")}
                </Button>
              </Link>
            </div>
          </div>
          <div className="bg-cookie/40 ring-warm-brown/10 relative aspect-[3/4] w-full overflow-hidden rounded-2xl ring-1 shadow-xl">
            {/* Hero image placeholder — user replaces with public/images/hero.jpg later */}
            <div className="flex h-full w-full items-center justify-center text-9xl opacity-30">🍪</div>
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Update `app/[locale]/(shop)/page.tsx` to use Hero**

Replace the existing content :

```tsx
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/Hero";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero locale={locale} />
    </>
  );
}
```

Other home sections are added in Task 7. For now the homepage is just Hero + Header + Footer.

- [ ] **Step 5: Verify visually**

```powershell
pnpm dev
```

Visit `/fr`. Expected : sticky header → big hero with eyebrow "MAISON BEECUIT — LIÈGE", massive Fraunces title "Le biscuit belge, fait à la main." (the second line in honey-dark italic), short paragraph, 2 CTA buttons. On the right, a 3/4 portrait card with cookie/40 background + big 🍪 emoji. Below : nothing (sections come Task 7). Stop server.

- [ ] **Step 6: Commit**

```powershell
git add lib/queries/catalog.ts components/home/Hero.tsx "app/[locale]/(shop)/page.tsx" messages/
git commit -m "feat(polish): homepage Hero section + listFeaturedProducts query"
```

---

## Task 7: Homepage — FeaturedProducts, StoryTeaser, CoffretsTeaser, InstagramGrid, NewsletterCTA

**Files:**
- Create: `components/home/FeaturedProducts.tsx`, `StoryTeaser.tsx`, `CoffretsTeaser.tsx`, `InstagramGrid.tsx`, `NewsletterCTA.tsx`
- Modify: `app/[locale]/(shop)/page.tsx` (orchestrate all 6 sections)
- Modify: `messages/{fr,nl,de,en}.json` (add section labels)

- [ ] **Step 1: Add homepage section translations**

Extend `home` in each `messages/*.json`. `fr.json` :
```json
"home": {
  ...existing keys...,
  "featuredEyebrow": "NOS BEST-SELLERS",
  "featuredTitle": "Les biscuits qu'on refait sans cesse",
  "featuredCta": "Voir tout le catalogue",
  "storyEyebrow": "L'HISTOIRE",
  "storyTitle": "Une maison liégeoise depuis 2026",
  "storyProse": "BeeCuit est née d'une obsession : faire du biscuit belge un objet de dégustation, pas un produit industriel. Dans notre atelier rue de la Maison à Liège, chaque fournée sort dorée à la main, surveillée à la minute.",
  "storyCta": "Lire l'histoire complète",
  "coffretsEyebrow": "BIENTÔT",
  "coffretsTitle": "Composez votre coffret",
  "coffretsProse": "Choisis tes biscuits préférés, on assemble pour toi un coffret offert dans un emballage cire d'abeille recyclable. Disponible printemps 2026.",
  "coffretsCta": "M'avertir au lancement",
  "instagramEyebrow": "VIE DE BEECUIT",
  "instagramTitle": "Suivez-nous",
  "instagramHandle": "@beecuit",
  "newsletterTitle": "Reçois nos nouveautés",
  "newsletterAccent": "-10 %",
  "newsletterTaglineSuffix": "à la première commande",
  "newsletterDisclaimer": "Pas de spam, juste les nouveautés mensuelles. Désinscription en 1 clic."
}
```

NL/DE/EN : translate professionally.

- [ ] **Step 2: `components/home/FeaturedProducts.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { listFeaturedProducts, type Locale } from "@/lib/queries/catalog";

export async function FeaturedProducts({ locale }: { locale: string }) {
  const t = await getTranslations("home");
  const products = await listFeaturedProducts(locale as Locale, 3);
  return (
    <Section py="lg">
      <Container>
        <div className="text-center">
          <Eyebrow>{t("featuredEyebrow")}</Eyebrow>
          <Heading as="h2" size="h2" className="mt-3">
            {t("featuredTitle")}
          </Heading>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/biscuits/${p.slug}`} className="group block">
              <div className="bg-cookie/30 aspect-[4/5] overflow-hidden rounded-xl">
                {p.primaryImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.primaryImageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-7xl opacity-30">🍪</div>
                )}
              </div>
              <div className="mt-4 space-y-1">
                {p.categoryName && <Eyebrow>{p.categoryName}</Eyebrow>}
                <p className="text-warm-brown font-display text-xl">{p.name}</p>
                <p className="text-honey-dark font-display text-lg">{(p.basePriceCents / 100).toFixed(2)} €</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/biscuits" className="text-warm-brown hover:text-honey-dark text-sm font-medium underline underline-offset-4">
            {t("featuredCta")} →
          </Link>
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 3: `components/home/StoryTeaser.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";

export async function StoryTeaser() {
  const t = await getTranslations("home");
  return (
    <Section py="lg" bg="surface-elev">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="bg-cookie/40 aspect-square w-full overflow-hidden rounded-2xl">
            <div className="flex h-full w-full items-center justify-center text-9xl opacity-30">👩‍🍳</div>
          </div>
          <div className="space-y-6">
            <Eyebrow>{t("storyEyebrow")}</Eyebrow>
            <Heading as="h2" size="h2">{t("storyTitle")}</Heading>
            <Prose>{t("storyProse")}</Prose>
            <Link href="/notre-histoire" className="text-warm-brown hover:text-honey-dark inline-block text-sm font-medium underline underline-offset-4">
              {t("storyCta")} →
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 4: `components/home/CoffretsTeaser.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Button } from "@/components/ui/button";

export async function CoffretsTeaser() {
  const t = await getTranslations("home");
  return (
    <Section py="lg">
      <Container variant="narrow" className="text-center">
        <Eyebrow>{t("coffretsEyebrow")}</Eyebrow>
        <Heading as="h2" size="h2" className="mt-3">{t("coffretsTitle")}</Heading>
        <Prose className="mx-auto mt-4">{t("coffretsProse")}</Prose>
        <Button
          disabled
          className="bg-warm-brown/10 text-warm-brown/50 mt-8 cursor-not-allowed px-6 py-6 text-base"
        >
          {t("coffretsCta")}
        </Button>
        <div className="mt-12 flex justify-center">
          {/* CSS isometric box mockup teaser */}
          <div className="relative h-32 w-40 [transform:rotateX(15deg)_rotateY(-25deg)] [transform-style:preserve-3d]">
            <div className="bg-cookie border-warm-brown/20 absolute inset-0 rounded border shadow-lg" />
            <div className="bg-honey/80 absolute -top-2 inset-x-0 h-4 origin-bottom rounded-t [transform:rotateX(60deg)]" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 5: `components/home/InstagramGrid.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";

const TINTS = ["bg-cookie/40", "bg-soft-rose", "bg-leaf/30", "bg-honey/30"] as const;

export async function InstagramGrid() {
  const t = await getTranslations("home");
  return (
    <Section py="md">
      <Container>
        <div className="mb-12 text-center">
          <Eyebrow>{t("instagramEyebrow")}</Eyebrow>
          <Heading as="h2" size="h2" className="mt-3">
            {t("instagramTitle")}{" "}
            <a href="https://instagram.com/beecuit" className="text-honey-dark underline underline-offset-4">
              {t("instagramHandle")}
            </a>
          </Heading>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {TINTS.map((bg, i) => (
            <a key={i} href="https://instagram.com/beecuit" className={`aspect-square overflow-hidden rounded-lg ${bg} transition-opacity hover:opacity-80`} aria-label={`Instagram post ${i + 1}`}>
              <div className="flex h-full w-full items-center justify-center text-6xl opacity-30">📷</div>
            </a>
          ))}
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 6: `components/home/NewsletterCTA.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Heading } from "@/components/ui-primitives/Heading";
import { NewsletterForm } from "@/components/common/NewsletterForm";

export async function NewsletterCTA() {
  const t = await getTranslations("home");
  return (
    <Section py="lg" bg="cookie">
      <Container variant="narrow" className="text-center">
        <Heading as="h2" size="h2">
          {t("newsletterTitle")} <em className="text-honey-dark not-italic font-display">{t("newsletterAccent")}</em> {t("newsletterTaglineSuffix")}
        </Heading>
        <div className="mx-auto mt-8 max-w-md">
          <NewsletterForm />
        </div>
        <p className="text-warm-brown/60 mt-4 text-xs">{t("newsletterDisclaimer")}</p>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 7: Orchestrate all sections in `app/[locale]/(shop)/page.tsx`**

```tsx
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { StoryTeaser } from "@/components/home/StoryTeaser";
import { CoffretsTeaser } from "@/components/home/CoffretsTeaser";
import { InstagramGrid } from "@/components/home/InstagramGrid";
import { NewsletterCTA } from "@/components/home/NewsletterCTA";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Hero locale={locale} />
      <FeaturedProducts locale={locale} />
      <StoryTeaser />
      <CoffretsTeaser />
      <InstagramGrid />
      <NewsletterCTA />
    </>
  );
}
```

- [ ] **Step 8: Verify**

```powershell
pnpm typecheck
pnpm dev
```

Visit `/fr`. Scroll : Hero → Featured 3 products → Story 50/50 → Coffrets teaser with CSS box → Instagram 4-grid → Newsletter cookie band. Each section should breathe (py-24+). Stop server.

- [ ] **Step 9: Commit**

```powershell
git add components/home/ "app/[locale]/(shop)/page.tsx" messages/
git commit -m "feat(polish): homepage 6-section composition with all sub-components"
```

---

## Task 8: Catalog polish — sidebar filter + ProductCard 4/5

**Files:**
- Modify: `components/shop/CategoryFilter.tsx` (variant prop)
- Modify: `components/shop/ProductCard.tsx` (aspect 4/5, eyebrow category)
- Modify: `app/[locale]/(shop)/biscuits/page.tsx` (layout with sidebar + page header)
- Modify: `lib/queries/catalog.ts` (add `categoryName` field to `listProductsForLocale`)
- Modify: `messages/{fr,nl,de,en}.json` (catalog page header)

- [ ] **Step 1: Extend catalog message keys**

Append to `home`-section sibling in each `messages/*.json` :

`fr.json` extend `catalog` :
```json
"catalog": {
  ...existing...,
  "pageEyebrow": "NOTRE CATALOGUE",
  "pageProse": "Découvre la sélection BeeCuit, cuite à Liège."
}
```

NL/DE/EN : translate.

- [ ] **Step 2: Extend `lib/queries/catalog.ts` `listProductsForLocale` to also return categoryName**

In the existing `listProductsForLocale` function, extend the SELECT object :

```typescript
.select({
  id: products.id,
  sku: products.sku,
  basePriceCents: products.basePriceCents,
  stockQuantity: products.stockQuantity,
  name: productTranslations.name,
  slug: productTranslations.slug,
  shortDescription: productTranslations.shortDescription,
  primaryImageUrl: sql<string | null>`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
  categoryName: sql<string | null>`(SELECT name FROM category_translations WHERE category_id = ${products.categoryId} AND locale = ${locale} LIMIT 1)`,
})
```

- [ ] **Step 3: Rewrite `components/shop/CategoryFilter.tsx`** with variant prop

```tsx
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Cat = { slug: string; name: string };

export function CategoryFilter({
  categories,
  activeSlug,
  allLabel,
  variant = "chips",
}: {
  categories: Cat[];
  activeSlug?: string;
  allLabel: string;
  variant?: "chips" | "sidebar";
}) {
  const base = "/biscuits";
  if (variant === "sidebar") {
    return (
      <aside className="w-56 shrink-0 hidden md:block">
        <nav className="space-y-1">
          <Link
            href={base}
            className={cn(
              "block rounded px-3 py-2 text-sm transition-colors",
              !activeSlug
                ? "bg-honey/10 text-honey-dark font-medium"
                : "text-warm-brown hover:bg-honey/5",
            )}
          >
            {allLabel}
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={{ pathname: base, query: { categorie: c.slug } }}
              className={cn(
                "block rounded px-3 py-2 text-sm transition-colors",
                activeSlug === c.slug
                  ? "bg-honey/10 text-honey-dark font-medium"
                  : "text-warm-brown hover:bg-honey/5",
              )}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </aside>
    );
  }
  return (
    <nav className="flex flex-wrap gap-2 pb-6 md:hidden">
      <Link
        href={base}
        className={cn(
          "rounded-full border px-3 py-1 text-sm",
          !activeSlug
            ? "border-honey bg-honey/10 text-honey-dark"
            : "border-warm-brown/20 text-warm-brown hover:border-honey/50",
        )}
      >
        {allLabel}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={{ pathname: base, query: { categorie: c.slug } }}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            activeSlug === c.slug
              ? "border-honey bg-honey/10 text-honey-dark"
              : "border-warm-brown/20 text-warm-brown hover:border-honey/50",
          )}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Rewrite `components/shop/ProductCard.tsx`** with aspect 4/5

```tsx
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";

type Props = {
  slug: string;
  name: string;
  primaryImageUrl: string | null;
  categoryName: string | null;
  basePriceCents: number;
  stockQuantity: number;
  outOfStockLabel: string;
};

export function ProductCard(p: Props) {
  const isOut = p.stockQuantity <= 0;
  const priceEur = (p.basePriceCents / 100).toFixed(2);
  return (
    <Link href={`/biscuits/${p.slug}`} className="group block">
      <div className="bg-cookie/30 relative aspect-[4/5] overflow-hidden rounded-xl">
        {p.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.primaryImageUrl}
            alt={p.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl opacity-30">🍪</div>
        )}
        {isOut && (
          <span className="bg-terracotta text-cream absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider">
            {p.outOfStockLabel}
          </span>
        )}
      </div>
      <div className="mt-4 space-y-1">
        {p.categoryName && <Eyebrow>{p.categoryName}</Eyebrow>}
        <p className="text-warm-brown font-display text-lg leading-tight">{p.name}</p>
        <p className="text-honey-dark font-display text-base">{priceEur} €</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: Rewrite `app/[locale]/(shop)/biscuits/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { listActiveCategoriesForLocale, listProductsForLocale, type Locale } from "@/lib/queries/catalog";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { ProductCard } from "@/components/shop/ProductCard";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { locale } = await params;
  const { categorie } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");

  const [cats, prods] = await Promise.all([
    listActiveCategoriesForLocale(locale as Locale),
    listProductsForLocale(locale as Locale, categorie),
  ]);

  return (
    <>
      <Section py="md" bg="surface-elev">
        <Container>
          <Eyebrow>{t("pageEyebrow")}</Eyebrow>
          <Heading as="h1" size="h1" className="mt-3">{t("title")}</Heading>
          <Prose className="mt-4">{t("pageProse")}</Prose>
        </Container>
      </Section>
      <Section py="md">
        <Container>
          <div className="flex flex-col gap-10 md:flex-row">
            <CategoryFilter
              categories={cats}
              activeSlug={categorie}
              allLabel={t("filterAll")}
              variant="sidebar"
            />
            <div className="flex-1">
              <CategoryFilter
                categories={cats}
                activeSlug={categorie}
                allLabel={t("filterAll")}
                variant="chips"
              />
              {prods.length === 0 ? (
                <p className="text-warm-brown/70 py-12 text-center">Aucun biscuit trouvé.</p>
              ) : (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {prods.map((p) => (
                    <ProductCard
                      key={p.id}
                      slug={p.slug}
                      name={p.name}
                      primaryImageUrl={p.primaryImageUrl}
                      categoryName={p.categoryName}
                      basePriceCents={p.basePriceCents}
                      stockQuantity={p.stockQuantity}
                      outOfStockLabel={t("outOfStock")}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
```

Note : `ProductGrid` is no longer used — its logic is inlined here. The old `components/shop/ProductGrid.tsx` can stay (unused) or be deleted in a later cleanup task.

- [ ] **Step 6: Verify**

```powershell
pnpm typecheck
pnpm dev
```

Visit `/fr/biscuits`. Expected : page header with eyebrow "NOTRE CATALOGUE" + big H1. Desktop : sidebar gauche avec liste catégories (active highlighted), grid 3-col avec cards aspect 4/5, photo en haut, eyebrow catégorie + nom + prix en bas. Mobile : sidebar disparaît, chips horizontaux apparaissent en haut. Hover card : image scale subtle. Stop server.

- [ ] **Step 7: Commit**

```powershell
git add components/shop/CategoryFilter.tsx components/shop/ProductCard.tsx "app/[locale]/(shop)/biscuits/page.tsx" lib/queries/catalog.ts messages/
git commit -m "feat(polish): catalog sidebar filter + ProductCard 4/5 portrait"
```

---

## Task 9: Product detail polish — split 60/40 + TrustIndicators + RelatedProducts

**Files:**
- Create: `components/shop/TrustIndicators.tsx`
- Create: `components/shop/RelatedProducts.tsx`
- Modify: `components/shop/ProductImages.tsx` (bigger thumbnails, sticky-friendly)
- Modify: `app/[locale]/(shop)/biscuits/[slug]/page.tsx` (split 60/40 + related)
- Modify: `lib/queries/catalog.ts` (add `listRelatedProducts`)
- Modify: `messages/{fr,nl,de,en}.json` (product page accents)

- [ ] **Step 1: Add product-detail translations**

Extend `catalog` in `messages/*.json`. `fr.json` :
```json
"catalog": {
  ...existing...,
  "trustDelivery": "Livré en 24h Bpost",
  "trustOrigin": "Cuit à Liège",
  "trustNatural": "Sans conservateur",
  "ingredientsTitle": "Ingrédients",
  "allergensTitle": "Allergènes",
  "nutritionTitle": "Valeurs nutritionnelles /100 g",
  "storyTitle": "L'histoire de ce biscuit",
  "relatedTitle": "À découvrir aussi"
}
```

NL/DE/EN : translate.

- [ ] **Step 2: `lib/queries/catalog.ts` — add `listRelatedProducts`**

```typescript
export async function listRelatedProducts(productId: string, locale: Locale, limit = 4) {
  // Find the product's category
  const [src] = await db
    .select({ categoryId: products.categoryId })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!src?.categoryId) {
    // Fallback: 4 most recent active products excluding self
    return db
      .select({
        id: products.id,
        sku: products.sku,
        basePriceCents: products.basePriceCents,
        stockQuantity: products.stockQuantity,
        name: productTranslations.name,
        slug: productTranslations.slug,
        primaryImageUrl: sql<string | null>`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
        categoryName: sql<string | null>`(SELECT name FROM category_translations WHERE category_id = ${products.categoryId} AND locale = ${locale} LIMIT 1)`,
      })
      .from(products)
      .innerJoin(
        productTranslations,
        and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
      )
      .where(and(eq(products.isActive, true), sql`${products.id} != ${productId}`))
      .orderBy(products.createdAt)
      .limit(limit);
  }

  return db
    .select({
      id: products.id,
      sku: products.sku,
      basePriceCents: products.basePriceCents,
      stockQuantity: products.stockQuantity,
      name: productTranslations.name,
      slug: productTranslations.slug,
      primaryImageUrl: sql<string | null>`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
      categoryName: sql<string | null>`(SELECT name FROM category_translations WHERE category_id = ${products.categoryId} AND locale = ${locale} LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(
      and(
        eq(products.isActive, true),
        eq(products.categoryId, src.categoryId),
        sql`${products.id} != ${productId}`,
      ),
    )
    .orderBy(products.createdAt)
    .limit(limit);
}
```

- [ ] **Step 3: `components/shop/TrustIndicators.tsx`**

```tsx
import { Truck, MapPin, Leaf } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function TrustIndicators() {
  const t = await getTranslations("catalog");
  const items = [
    { Icon: Truck, label: t("trustDelivery") },
    { Icon: MapPin, label: t("trustOrigin") },
    { Icon: Leaf, label: t("trustNatural") },
  ];
  return (
    <ul className="border-warm-brown/10 divide-warm-brown/10 divide-y border-y">
      {items.map(({ Icon, label }) => (
        <li key={label} className="flex items-center gap-3 py-3">
          <Icon className="text-honey-dark h-4 w-4 shrink-0" />
          <span className="text-warm-brown/80 text-sm">{label}</span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: `components/shop/RelatedProducts.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Heading } from "@/components/ui-primitives/Heading";
import { ProductCard } from "./ProductCard";
import { listRelatedProducts, type Locale } from "@/lib/queries/catalog";

export async function RelatedProducts({
  productId,
  locale,
}: {
  productId: string;
  locale: string;
}) {
  const t = await getTranslations("catalog");
  const products = await listRelatedProducts(productId, locale as Locale, 4);
  if (products.length === 0) return null;
  return (
    <Section py="lg" bg="surface-elev">
      <Container>
        <Heading as="h2" size="h2" className="mb-10">{t("relatedTitle")}</Heading>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              primaryImageUrl={p.primaryImageUrl}
              categoryName={p.categoryName}
              basePriceCents={p.basePriceCents}
              stockQuantity={p.stockQuantity}
              outOfStockLabel={t("outOfStock")}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 5: Rewrite `components/shop/ProductImages.tsx`** with bigger thumbnails

```tsx
"use client";
import { useState } from "react";

type Img = { url: string; altText: string | null };

export function ProductImages({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) {
    return (
      <div className="bg-cookie/40 aspect-square w-full overflow-hidden rounded-xl">
        <div className="flex h-full w-full items-center justify-center text-9xl opacity-30">🍪</div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="bg-cookie/30 aspect-square w-full overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]?.url}
          alt={images[active]?.altText ?? name}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={`bg-cookie/30 aspect-square overflow-hidden rounded-lg transition-all ${i === active ? "ring-2 ring-honey ring-offset-2" : "opacity-70 hover:opacity-100"}`}
              aria-label={`Image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Rewrite `app/[locale]/(shop)/biscuits/[slug]/page.tsx`** with split 60/40 + related

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getProductBySlug, type Locale } from "@/lib/queries/catalog";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { ProductImages } from "@/components/shop/ProductImages";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { TrustIndicators } from "@/components/shop/TrustIndicators";
import { RelatedProducts } from "@/components/shop/RelatedProducts";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProductBySlug(locale as Locale, slug);
  if (!p) return {};
  return { title: p.seoTitle, description: p.seoDescription };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const product = await getProductBySlug(locale as Locale, slug);
  if (!product) notFound();

  const priceEur = (product.basePriceCents / 100).toFixed(2);
  const isOut = product.stockQuantity <= 0;

  return (
    <>
      <Section py="md">
        <Container>
          <article className="grid grid-cols-1 gap-12 md:grid-cols-[3fr_2fr]">
            <ProductImages images={product.images} name={product.name} />
            <div className="space-y-6 md:sticky md:top-28 md:self-start">
              <Eyebrow>BISCUITS</Eyebrow>
              <Heading as="h1" size="h1">{product.name}</Heading>
              <Prose>{product.shortDescription}</Prose>
              <p className="text-honey-dark font-display text-3xl">{priceEur} €</p>
              <AddToCartButton productId={product.id} label={t("addToCart")} outOfStock={isOut} />
              <TrustIndicators />
              <details className="border-warm-brown/10 border-t pt-4">
                <summary className="text-warm-brown cursor-pointer text-sm font-medium">{t("ingredientsTitle")}</summary>
                <p className="text-warm-brown/80 mt-3 text-sm">{product.ingredients}</p>
              </details>
              {product.allergens.length > 0 && (
                <details className="border-warm-brown/10 border-t pt-4">
                  <summary className="text-warm-brown cursor-pointer text-sm font-medium">{t("allergensTitle")}</summary>
                  <ul className="text-warm-brown/80 mt-3 list-disc pl-5 text-sm">
                    {product.allergens.map((a) => <li key={a}>{a}</li>)}
                  </ul>
                </details>
              )}
              <details className="border-warm-brown/10 border-t pt-4">
                <summary className="text-warm-brown cursor-pointer text-sm font-medium">{t("nutritionTitle")}</summary>
                <table className="text-warm-brown/80 mt-3 w-full text-sm">
                  <tbody>
                    <tr><td>Énergie</td><td className="text-right">{product.nutritionalFactsPer100g.energy_kcal} kcal</td></tr>
                    <tr><td>Matières grasses</td><td className="text-right">{product.nutritionalFactsPer100g.fat_g} g</td></tr>
                    <tr><td>Glucides</td><td className="text-right">{product.nutritionalFactsPer100g.carbs_g} g</td></tr>
                    <tr><td>Protéines</td><td className="text-right">{product.nutritionalFactsPer100g.protein_g} g</td></tr>
                    <tr><td>Sel</td><td className="text-right">{product.nutritionalFactsPer100g.salt_g} g</td></tr>
                  </tbody>
                </table>
              </details>
            </div>
          </article>
        </Container>
      </Section>
      <Section py="lg" bg="surface-elev">
        <Container variant="narrow">
          <Heading as="h2" size="h2" className="mb-6">{t("storyTitle")}</Heading>
          <Prose>{product.longDescription}</Prose>
        </Container>
      </Section>
      <RelatedProducts productId={product.id} locale={locale} />
    </>
  );
}
```

- [ ] **Step 7: Verify**

```powershell
pnpm typecheck
pnpm dev
```

Visit `/fr/biscuits/speculoos-artisanal-200g`. Expected : split 60/40 desktop, big photo left with thumbnails below, sticky info right (eyebrow + H1 + prose + prix + add-to-cart + 3 trust indicators with icons + 3 accordéons). Scroll : section "L'histoire de ce biscuit" pleine largeur, puis "À découvrir aussi" 4 cards. Stop server.

- [ ] **Step 8: Commit**

```powershell
git add components/shop/ "app/[locale]/(shop)/biscuits/[slug]/" lib/queries/catalog.ts messages/
git commit -m "feat(polish): product detail split 60/40 + TrustIndicators + RelatedProducts"
```

---

## Task 10: ComingSoonPage component + 10 routes

**Files:**
- Create: `components/common/ComingSoonPage.tsx`
- Create: `lib/coming-soon-pages.ts`
- Create: 10 `app/[locale]/(shop)/{coffrets,abonnement,journal,notre-histoire,contact,entreprises,cgv,mentions-legales,confidentialite,cookies}/page.tsx`
- Modify: `messages/{fr,nl,de,en}.json` (add `comingSoon.*` keys)

- [ ] **Step 1: Add comingSoon translations**

In each `messages/*.json` add at root :

`fr.json` :
```json
"comingSoon": {
  "eyebrow": "BIENTÔT",
  "backHome": "Retour à l'accueil",
  "when": "Disponible",
  "pages": {
    "coffrets": { "title": "Composez votre coffret", "description": "Choisis tes biscuits préférés, on assemble pour toi un coffret offert dans un emballage cire d'abeille recyclable.", "when": "Printemps 2026" },
    "abonnement": { "title": "Abonnement mensuel BeeCuit", "description": "Reçois chaque mois une box de biscuits surprise, composée par nos soins. Mini, Classique ou Famille — à toi de choisir.", "when": "Printemps 2026" },
    "journal": { "title": "Journal de la maison", "description": "Recettes, savoir-faire, histoires d'abeilles. Tout ce qui se passe en cuisine et hors cuisine, à raison d'un article par mois.", "when": "Été 2026" },
    "notreHistoire": { "title": "Notre histoire", "description": "Qui est derrière BeeCuit, pourquoi ce projet, comment on travaille. Une page sincère qui parle d'artisanat belge.", "when": "Été 2026" },
    "contact": { "title": "Nous contacter", "description": "Un mot, une question, une commande spéciale ? On répond rapidement.", "when": "Printemps 2026" },
    "entreprises": { "title": "BeeCuit pour entreprises", "description": "Coffrets cadeaux pour clients ou collaborateurs, avec ou sans gravure de votre logo. Devis personnalisés.", "when": "Été 2026" },
    "cgv": { "title": "Conditions générales de vente", "description": "Les CGV BeeCuit applicables aux commandes passées sur ce site.", "when": "À la première commande" },
    "mentionsLegales": { "title": "Mentions légales", "description": "Identité de l'éditeur du site, hébergement, médiateur consommation.", "when": "À la première commande" },
    "confidentialite": { "title": "Politique de confidentialité", "description": "Comment nous traitons tes données personnelles, conforme RGPD.", "when": "À la première commande" },
    "cookies": { "title": "Politique des cookies", "description": "Quels cookies nous utilisons et pourquoi, et comment les refuser.", "when": "À la première commande" }
  }
}
```

NL/DE/EN : translate naturally (keep page keys identical for code consistency).

- [ ] **Step 2: `lib/coming-soon-pages.ts`** — config mapping route → message key

```typescript
export const COMING_SOON_PAGES = {
  coffrets: { messageKey: "coffrets" },
  abonnement: { messageKey: "abonnement" },
  journal: { messageKey: "journal" },
  "notre-histoire": { messageKey: "notreHistoire" },
  contact: { messageKey: "contact" },
  entreprises: { messageKey: "entreprises" },
  cgv: { messageKey: "cgv" },
  "mentions-legales": { messageKey: "mentionsLegales" },
  confidentialite: { messageKey: "confidentialite" },
  cookies: { messageKey: "cookies" },
} as const;

export type ComingSoonRoute = keyof typeof COMING_SOON_PAGES;
```

- [ ] **Step 3: `components/common/ComingSoonPage.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Button } from "@/components/ui/button";

export async function ComingSoonPage({ pageKey }: { pageKey: string }) {
  const t = await getTranslations("comingSoon");
  return (
    <Section py="lg">
      <Container variant="narrow" className="text-center">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <Heading as="h1" size="h1" className="mt-3">
          {t(`pages.${pageKey}.title`)}
        </Heading>
        <Prose className="mx-auto mt-6">
          {t(`pages.${pageKey}.description`)}
        </Prose>
        <p className="text-honey-dark mt-8 text-sm font-medium">
          {t("when")} {t(`pages.${pageKey}.when`)}
        </p>
        <Link href="/" className="mt-8 inline-block">
          <Button variant="outline" className="border-warm-brown/20 text-warm-brown hover:bg-warm-brown/5">
            ← {t("backHome")}
          </Button>
        </Link>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 4: Create the 10 page.tsx files**

Each follows the same pattern. Example for `app/[locale]/(shop)/coffrets/page.tsx` :

```tsx
import { setRequestLocale } from "next-intl/server";
import { ComingSoonPage } from "@/components/common/ComingSoonPage";

export default async function CoffretsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ComingSoonPage pageKey="coffrets" />;
}
```

Repeat for the 9 others, just changing the path + `pageKey` :
- `abonnement/page.tsx` → `pageKey="abonnement"`
- `journal/page.tsx` → `pageKey="journal"`
- `notre-histoire/page.tsx` → `pageKey="notreHistoire"`
- `contact/page.tsx` → `pageKey="contact"`
- `entreprises/page.tsx` → `pageKey="entreprises"`
- `cgv/page.tsx` → `pageKey="cgv"`
- `mentions-legales/page.tsx` → `pageKey="mentionsLegales"`
- `confidentialite/page.tsx` → `pageKey="confidentialite"`
- `cookies/page.tsx` → `pageKey="cookies"`

- [ ] **Step 5: Verify**

```powershell
pnpm typecheck
pnpm dev
```

Visit each : `/fr/coffrets`, `/fr/abonnement`, `/fr/journal`, etc. Each shows a centered page with eyebrow "BIENTÔT", title, description, "Disponible {when}" en honey, et bouton "← Retour à l'accueil". Stop server.

- [ ] **Step 6: Commit**

```powershell
git add components/common/ComingSoonPage.tsx lib/coming-soon-pages.ts "app/[locale]/(shop)/coffrets/" "app/[locale]/(shop)/abonnement/" "app/[locale]/(shop)/journal/" "app/[locale]/(shop)/notre-histoire/" "app/[locale]/(shop)/contact/" "app/[locale]/(shop)/entreprises/" "app/[locale]/(shop)/cgv/" "app/[locale]/(shop)/mentions-legales/" "app/[locale]/(shop)/confidentialite/" "app/[locale]/(shop)/cookies/" messages/
git commit -m "feat(polish): ComingSoonPage component + 10 stylized future routes"
```

---

## Task 11: Polish cart, checkout, confirmation pages

**Files:**
- Modify: `app/[locale]/(shop)/panier/page.tsx`
- Modify: `components/shop/CartItemRow.tsx` (round photo)
- Modify: `app/[locale]/(shop)/checkout/page.tsx`
- Modify: `components/shop/CheckoutForm.tsx` (eyebrow legends + better inputs)
- Modify: `components/shop/OrderSummary.tsx` (elevated card)
- Modify: `app/[locale]/(shop)/commande-confirmee/[orderNumber]/page.tsx` (success illustration)

- [ ] **Step 1: Polish `components/shop/CartItemRow.tsx`**

Replace the existing component :

```tsx
"use client";
import { useTransition } from "react";
import { updateQuantity, removeFromCart } from "@/lib/actions/cart.actions";
import { useRouter } from "@/i18n/navigation";
import { X } from "lucide-react";

export function CartItemRow({
  cartItemId,
  name,
  unitPriceCents,
  quantity,
  stockQuantity,
  primaryImageUrl,
}: {
  cartItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  stockQuantity: number;
  primaryImageUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const subtotalEur = ((unitPriceCents * quantity) / 100).toFixed(2);

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="bg-cookie/30 h-20 w-20 shrink-0 overflow-hidden rounded-full">
        {primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primaryImageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl opacity-30">🍪</div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-warm-brown font-display text-base">{name}</p>
        <p className="text-warm-brown/60 text-xs">{(unitPriceCents / 100).toFixed(2)} €</p>
      </div>
      <select
        value={quantity}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await updateQuantity({ cartItemId, quantity: Number(e.target.value) });
            router.refresh();
          })
        }
        className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 rounded border bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2"
      >
        {Array.from({ length: Math.min(stockQuantity, 10) }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <p className="text-honey-dark w-20 text-right font-display text-base">{subtotalEur} €</p>
      <button
        onClick={() =>
          startTransition(async () => {
            await removeFromCart(cartItemId);
            router.refresh();
          })
        }
        disabled={pending}
        className="text-warm-brown/40 hover:text-terracotta transition-colors"
        aria-label="Retirer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Polish `app/[locale]/(shop)/panier/page.tsx`** — replace its body :

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { carts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCartContents } from "@/lib/queries/cart";
import type { Locale } from "@/lib/queries/catalog";
import { CartItemRow } from "@/components/shop/CartItemRow";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";

export const dynamic = "force-dynamic";

async function findCartId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) {
    const [c] = await db.select().from(carts).where(eq(carts.userId, session.user.id)).limit(1);
    return c?.id ?? null;
  }
  const store = await cookies();
  const token = store.get("cart_session_token")?.value;
  if (!token) return null;
  const [c] = await db.select().from(carts).where(eq(carts.sessionToken, token)).limit(1);
  return c?.id ?? null;
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cart");
  const cartId = await findCartId();
  const items = cartId ? await getCartContents(cartId, locale as Locale) : [];

  if (items.length === 0) {
    return (
      <Section py="lg">
        <Container variant="narrow" className="text-center">
          <Eyebrow>MON PANIER</Eyebrow>
          <Heading as="h1" size="h1" className="mt-3">{t("label")}</Heading>
          <p className="text-warm-brown/70 mt-6 mb-8">{t("empty")}</p>
          <Link href="/biscuits">
            <Button className="bg-honey text-cream hover:bg-honey-dark px-6 py-6 text-base">Découvrir nos biscuits →</Button>
          </Link>
        </Container>
      </Section>
    );
  }

  const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const subtotalEur = (subtotalCents / 100).toFixed(2);

  return (
    <Section py="md">
      <Container variant="narrow">
        <Eyebrow>MON PANIER</Eyebrow>
        <Heading as="h1" size="h1" className="mt-3 mb-8">{t("label")}</Heading>
        <div className="border-warm-brown/10 divide-warm-brown/10 divide-y rounded-xl border bg-white px-6">
          {items.map((i) => (
            <CartItemRow
              key={i.cartItemId}
              cartItemId={i.cartItemId}
              name={i.name}
              unitPriceCents={i.unitPriceCents}
              quantity={i.quantity}
              stockQuantity={i.stockQuantity}
              primaryImageUrl={i.primaryImageUrl}
            />
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <span className="text-warm-brown font-display text-xl">{t("subtotal")}</span>
          <span className="text-honey-dark font-display text-3xl">{subtotalEur} €</span>
        </div>
        <p className="text-warm-brown/60 mt-1 text-right text-xs">Livraison et TVA calculées au checkout</p>
        <div className="mt-10 flex items-center justify-between gap-4">
          <Link href="/biscuits" className="text-warm-brown hover:text-honey-dark text-sm font-medium underline underline-offset-4">
            ← Continuer mes achats
          </Link>
          <Link href="/checkout">
            <Button className="bg-honey text-cream hover:bg-honey-dark px-6 py-6 text-base">{t("checkout")} →</Button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 3: Polish `components/shop/CheckoutForm.tsx`** — replace existing input/fieldset rendering with eyebrow legends + better inputs

Keep the form's logic intact ; restyle the JSX. Find the `return (...)` block and replace it with :

```tsx
return (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      setErr(null);
      start(async () => {
        try {
          await createCheckoutSession(
            {
              email,
              newsletterOptIn,
              shippingAddress: ship,
              billingSameAsShipping,
              billingAddress: billingSameAsShipping ? undefined : bill,
              shippingMethod: "bpost_express_24h",
            },
            locale,
          );
        } catch (e2) {
          setErr((e2 as Error).message);
        }
      });
    }}
    className="space-y-10"
  >
    <fieldset className="space-y-4">
      <legend className="text-honey-dark mb-4 text-xs font-semibold uppercase tracking-[0.1em]">CONTACT</legend>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 w-full rounded-md border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2"
        placeholder="email@exemple.com"
      />
      <label className="text-warm-brown/80 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={newsletterOptIn} onChange={(e) => setNewsletter(e.target.checked)} />
        M&apos;abonner à la newsletter BeeCuit
      </label>
    </fieldset>

    <fieldset className="border-warm-brown/10 space-y-4 border-t pt-8">
      <legend className="text-honey-dark mb-4 text-xs font-semibold uppercase tracking-[0.1em]">ADRESSE DE LIVRAISON</legend>
      <div className="grid grid-cols-2 gap-3">
        {input(ship, setShip, "firstName")}
        {input(ship, setShip, "lastName")}
      </div>
      {input(ship, setShip, "line1")}
      {input(ship, setShip, "line2", false)}
      <div className="grid grid-cols-2 gap-3">
        {input(ship, setShip, "postalCode")}
        {input(ship, setShip, "city")}
      </div>
      {input(ship, setShip, "phone", false)}
    </fieldset>

    <fieldset className="border-warm-brown/10 space-y-4 border-t pt-8">
      <legend className="text-honey-dark mb-4 text-xs font-semibold uppercase tracking-[0.1em]">ADRESSE DE FACTURATION</legend>
      <label className="text-warm-brown/80 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={billingSameAsShipping} onChange={(e) => setSame(e.target.checked)} />
        Identique à l&apos;adresse de livraison
      </label>
      {!billingSameAsShipping && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {input(bill, setBill, "firstName")}
            {input(bill, setBill, "lastName")}
          </div>
          {input(bill, setBill, "line1")}
          {input(bill, setBill, "line2", false)}
          <div className="grid grid-cols-2 gap-3">
            {input(bill, setBill, "postalCode")}
            {input(bill, setBill, "city")}
          </div>
        </>
      )}
    </fieldset>

    <fieldset className="border-warm-brown/10 border-t pt-8">
      <legend className="text-honey-dark mb-4 text-xs font-semibold uppercase tracking-[0.1em]">LIVRAISON</legend>
      <label className="border-warm-brown/20 flex items-center gap-3 rounded-md border bg-white p-4 text-sm">
        <input type="radio" checked readOnly />
        <span className="text-warm-brown">bpost Express 24h — tarif calculé selon poids</span>
      </label>
    </fieldset>

    {err && <p className="text-terracotta text-sm">{err}</p>}

    <Button
      type="submit"
      disabled={pending}
      className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base"
    >
      {pending ? "Redirection vers Stripe..." : "Payer avec Stripe →"}
    </Button>
  </form>
);
```

Also update the `input` helper at the top of the component (its className) :

```tsx
function input<K extends keyof SimpleAddress>(target: SimpleAddress, set: (a: SimpleAddress) => void, key: K, required = true) {
  return (
    <input
      type="text"
      required={required}
      value={target[key] ?? ""}
      onChange={(e) => set({ ...target, [key]: e.target.value })}
      placeholder={String(key)}
      className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 w-full rounded-md border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2"
    />
  );
}
```

- [ ] **Step 4: Polish `components/shop/OrderSummary.tsx`** — elevated card

Replace with :

```tsx
type Line = { name: string; unitPriceCents: number; quantity: number };

export function OrderSummary({
  lines,
  shippingCents,
  totalCents,
  vatCents,
}: {
  lines: Line[];
  shippingCents: number;
  totalCents: number;
  vatCents: number;
}) {
  const subtotalCents = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const eur = (c: number) => (c / 100).toFixed(2);
  return (
    <aside className="border-warm-brown/10 sticky top-28 rounded-2xl border bg-white p-6 shadow-md">
      <p className="text-honey-dark mb-6 text-xs font-semibold uppercase tracking-[0.1em]">RÉCAPITULATIF</p>
      <ul className="divide-warm-brown/10 mb-6 divide-y text-sm">
        {lines.map((l, i) => (
          <li key={i} className="flex justify-between py-3">
            <span className="text-warm-brown">{l.name} × {l.quantity}</span>
            <span className="text-warm-brown font-mono">{eur(l.unitPriceCents * l.quantity)} €</span>
          </li>
        ))}
      </ul>
      <div className="border-warm-brown/10 space-y-2 border-t pt-4 text-sm">
        <div className="text-warm-brown flex justify-between"><span>Sous-total</span><span className="font-mono">{eur(subtotalCents)} €</span></div>
        <div className="text-warm-brown flex justify-between"><span>Livraison</span><span className="font-mono">{eur(shippingCents)} €</span></div>
        <div className="text-warm-brown/60 flex justify-between text-xs"><span>dont TVA 6 % incluse</span><span className="font-mono">{eur(vatCents)} €</span></div>
        <div className="border-warm-brown/10 mt-3 flex items-baseline justify-between border-t pt-4">
          <span className="text-warm-brown font-display text-lg">Total</span>
          <span className="text-honey-dark font-display text-2xl">{eur(totalCents)} €</span>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Polish `app/[locale]/(shop)/checkout/page.tsx`** — add page header

Add at the top of the `return` (after the cart redirect logic), wrap the existing grid :

```tsx
return (
  <Section py="md">
    <Container>
      <Eyebrow>PAIEMENT</Eyebrow>
      <Heading as="h1" size="h1" className="mt-3 mb-10">Finalise ta commande</Heading>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_360px]">
        <div>
          <CheckoutForm defaultEmail={session?.user?.email ?? ""} locale={locale as "fr" | "nl" | "de" | "en"} />
        </div>
        <OrderSummary
          lines={items.map((i) => ({ name: i.name, unitPriceCents: i.unitPriceCents, quantity: i.quantity }))}
          shippingCents={totals.shippingCents}
          totalCents={totals.totalCents}
          vatCents={totals.vatCents}
        />
      </div>
    </Container>
  </Section>
);
```

Add imports at top : `import { Container } from "@/components/ui-primitives/Container"; import { Section } from "@/components/ui-primitives/Section"; import { Eyebrow } from "@/components/ui-primitives/Eyebrow"; import { Heading } from "@/components/ui-primitives/Heading";`

- [ ] **Step 6: Polish `app/[locale]/(shop)/commande-confirmee/[orderNumber]/page.tsx`** — success illustration

Replace the body :

```tsx
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui-primitives/Container";
import { Section } from "@/components/ui-primitives/Section";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";
import { Check } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!order) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  const eur = (c: number) => (c / 100).toFixed(2);
  const isPending = order.status === "pending";

  return (
    <Section py="lg">
      <Container variant="narrow" className="text-center">
        <div className="bg-honey/10 mx-auto flex h-24 w-24 items-center justify-center rounded-full">
          <Check className="text-honey-dark h-12 w-12" />
        </div>
        <Heading as="h1" size="h1" className="mt-8">
          {isPending ? "Traitement en cours…" : "Merci !"}
        </Heading>
        <Prose className="mx-auto mt-4">
          {isPending
            ? `Ta commande ${orderNumber} est en cours de validation. Tu recevras un email de confirmation dans quelques instants.`
            : `Ta commande #${orderNumber} est confirmée. On t'envoie l'email de confirmation à l'instant.`}
        </Prose>
        <div className="border-warm-brown/10 mt-10 rounded-2xl border bg-white p-6 text-left">
          <ul className="divide-warm-brown/10 divide-y">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between py-3 text-sm">
                <span className="text-warm-brown">{i.productNameSnapshot} × {i.quantity}</span>
                <span className="text-warm-brown font-mono">{eur(i.lineTotalCents)} €</span>
              </li>
            ))}
          </ul>
          <div className="border-warm-brown/10 mt-3 flex justify-between border-t pt-3 text-base">
            <span className="text-warm-brown font-display">Total</span>
            <span className="text-honey-dark font-display text-xl">{eur(order.totalCents)} €</span>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/biscuits"><Button className="bg-honey text-cream hover:bg-honey-dark px-6 py-6 text-base">Continuer mes achats</Button></Link>
          <Link href="/compte/commandes"><Button variant="outline" className="px-6 py-6 text-base">Voir mes commandes</Button></Link>
        </div>
      </Container>
    </Section>
  );
}
```

- [ ] **Step 7: Verify**

```powershell
pnpm typecheck
pnpm dev
```

Test : add an item to cart → visit `/fr/panier` (cards rondes photos, total Fraunces grand) → click "Passer commande" → `/fr/checkout` (page header + fieldsets stylés + OrderSummary card élevée sticky). Visit `/fr/commande-confirmee/BCT-TEST-123` (404 expected if no such order) — instead, test with a real order from earlier session or skip live test. Stop server.

- [ ] **Step 8: Commit**

```powershell
git add components/shop/CartItemRow.tsx components/shop/CheckoutForm.tsx components/shop/OrderSummary.tsx "app/[locale]/(shop)/panier/" "app/[locale]/(shop)/checkout/" "app/[locale]/(shop)/commande-confirmee/"
git commit -m "feat(polish): cart + checkout + confirmation pages polish"
```

---

## Task 12: Polish account section + sign-in

**Files:**
- Modify: `app/[locale]/(account)/compte/page.tsx`
- Modify: `app/[locale]/(account)/compte/adresses/page.tsx`
- Modify: `app/[locale]/(account)/compte/commandes/page.tsx`
- Modify: `app/[locale]/(account)/compte/commandes/[orderNumber]/page.tsx`
- Modify: `components/account/AccountSidebar.tsx` (active state)
- Modify: `app/[locale]/(shop)/sign-in/page.tsx` (centered card)

- [ ] **Step 1: Polish `components/account/AccountSidebar.tsx`** — active state border

```tsx
"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/compte", label: "Tableau de bord" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/compte/adresses", label: "Mes adresses" },
];

export function AccountSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0">
      <nav className="text-sm">
        <ul className="space-y-1">
          {items.map((i) => {
            const isActive = pathname === i.href || (i.href !== "/compte" && pathname.startsWith(i.href));
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className={cn(
                    "block rounded px-3 py-2 transition-colors",
                    isActive
                      ? "border-honey -ml-[2px] border-l-2 pl-[14px] text-honey-dark font-medium"
                      : "text-warm-brown hover:bg-honey/5 hover:text-honey-dark",
                  )}
                >
                  {i.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Polish `app/[locale]/(account)/compte/page.tsx`** — header eyebrow + card

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui-primitives/Eyebrow";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");
  const session = await auth();

  if (!session?.user) {
    redirect({ href: "/sign-in", locale });
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: `/${locale}` });
  }

  return (
    <section>
      <Eyebrow>MON COMPTE</Eyebrow>
      <Heading as="h1" size="h1" className="mt-3 mb-8">{t("title")}</Heading>
      <div className="border-warm-brown/10 rounded-xl border bg-white p-6">
        <Prose>
          {t("welcome", { name: session!.user!.name ?? session!.user!.email ?? "" })}
        </Prose>
        <p className="text-warm-brown/70 mt-2 text-sm">
          {t("loggedInAs", { email: session!.user!.email ?? "" })}
        </p>
        <form action={handleSignOut} className="mt-6">
          <Button type="submit" variant="outline">
            {(await getTranslations("nav"))("signOut")}
          </Button>
        </form>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Polish `app/[locale]/(account)/compte/adresses/page.tsx`**

Replace the body content (everything between `return (` and `);`) :

```tsx
return (
  <section>
    <Eyebrow>MON COMPTE</Eyebrow>
    <Heading as="h1" size="h1" className="mt-3 mb-8">Mes adresses</Heading>
    <AddressList addresses={rows} />
  </section>
);
```

Add imports : `import { Eyebrow } from "@/components/ui-primitives/Eyebrow"; import { Heading } from "@/components/ui-primitives/Heading";` and remove the old `<h1>` import block.

- [ ] **Step 4: Polish `app/[locale]/(account)/compte/commandes/page.tsx`**

Same pattern : eyebrow + Heading H1 :

```tsx
return (
  <section>
    <Eyebrow>MON COMPTE</Eyebrow>
    <Heading as="h1" size="h1" className="mt-3 mb-8">Mes commandes</Heading>
    <OrderList rows={rows} />
  </section>
);
```

- [ ] **Step 5: Polish `app/[locale]/(account)/compte/commandes/[orderNumber]/page.tsx`**

Wrap the existing OrderDetailCard with an eyebrow + Heading section above. Find the existing `return (` and replace the wrapping JSX (keep all the `<OrderDetailCard ... />` props intact) :

```tsx
return (
  <section>
    <Eyebrow>COMMANDE</Eyebrow>
    <Heading as="h1" size="h1" className="mt-3 mb-8">#{order.orderNumber}</Heading>
    <OrderDetailCard
      orderNumber={order.orderNumber}
      status={order.status}
      totalCents={order.totalCents}
      subtotalCents={order.subtotalCents}
      shippingCents={order.shippingCents}
      taxCents={order.taxCents}
      items={items.map((i) => ({
        productNameSnapshot: i.productNameSnapshot,
        quantity: i.quantity,
        lineTotalCents: i.lineTotalCents,
      }))}
      shippingAddress={order.shippingAddressSnapshot as Record<string, unknown> | null}
      shippingMethod={order.shippingMethod}
      trackingNumber={order.shippingTrackingNumber}
    />
  </section>
);
```

Add imports at top : `import { Eyebrow } from "@/components/ui-primitives/Eyebrow"; import { Heading } from "@/components/ui-primitives/Heading";`

- [ ] **Step 6: Polish `app/[locale]/(shop)/sign-in/page.tsx`** — centered card layout

The existing file has the two views (sign-in form + check-email confirm). Replace the entire body :

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui-primitives/Container";
import { Heading } from "@/components/ui-primitives/Heading";
import { Prose } from "@/components/ui-primitives/Prose";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ check?: string }>;
}) {
  const { locale } = await params;
  const { check } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  if (check === "email") {
    return (
      <section className="min-h-[80vh] bg-cream flex items-center justify-center py-12">
        <Container variant="narrow" className="max-w-md text-center">
          <Link href="/" className="text-honey font-display mb-12 inline-block text-3xl">BeeCuit</Link>
          <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm">
            <div className="bg-honey/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl">📬</div>
            <Heading as="h2" size="h3" className="mt-6">{t("checkEmail")}</Heading>
            <Link href="/" className="text-warm-brown hover:text-honey-dark mt-6 inline-block text-sm underline">{t("back")}</Link>
          </div>
        </Container>
      </section>
    );
  }

  async function handleSignIn(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    await signIn("resend", { email, redirectTo: `/${locale}/compte` });
  }

  return (
    <section className="min-h-[80vh] bg-cream flex items-center justify-center py-12">
      <Container variant="narrow" className="max-w-md">
        <Link href="/" className="text-honey font-display mb-12 block text-center text-3xl">BeeCuit</Link>
        <div className="border-warm-brown/10 rounded-2xl border bg-white p-8 shadow-sm">
          <Heading as="h2" size="h3">{t("signInTitle")}</Heading>
          <Prose className="mt-3">{t("signInDescription")}</Prose>
          <form action={handleSignIn} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-warm-brown text-sm">{t("emailLabel")}</span>
              <input
                type="email"
                name="email"
                required
                placeholder={t("emailPlaceholder")}
                className="border-warm-brown/20 focus:border-honey focus:ring-honey/30 mt-2 block w-full rounded-md border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2"
              />
            </label>
            <Button type="submit" className="bg-honey text-cream hover:bg-honey-dark w-full py-6 text-base">
              {t("submit")} →
            </Button>
          </form>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 7: Verify**

```powershell
pnpm typecheck
pnpm dev
```

Login → `/fr/compte` page header eyebrow + card. Sidebar active link a une border-l honey. Visit `/fr/compte/commandes`, `/fr/compte/adresses` : même style cohérent. Logout puis visiter `/fr/sign-in` : page entièrement centrée verticalement, card crème 480px avec logo BeeCuit dessus. Stop server.

- [ ] **Step 8: Commit**

```powershell
git add "app/[locale]/(account)/" "app/[locale]/(shop)/sign-in/" components/account/AccountSidebar.tsx
git commit -m "feat(polish): account section + sign-in centered card"
```

---

## Task 13: Final smoke + visual QA + commit

**Files:** (none — verification only)

- [ ] **Step 1: Local full smoke**

```powershell
pnpm format
pnpm lint
pnpm typecheck
pnpm dotenv -e .env.local -- pnpm test
```

Expected : everything exits 0. Tests still at 25/25.

- [ ] **Step 2: Build verification**

```powershell
pnpm build
```

Expected : `Compiled successfully`, no TypeScript errors, all pages routed.

- [ ] **Step 3: Visual QA — open each polished page in dev mode**

```powershell
pnpm dev
```

Open in browser and screenshot each :

- `/fr` — Hero + 5 other sections, scroll smooth
- `/fr/biscuits` — sidebar filter desktop, grid cards 4/5
- `/fr/biscuits/speculoos-artisanal-200g` — split 60/40, sticky info, trust indicators, related products
- `/fr/panier` (with 1 item in cart) — rounded photos, big total
- `/fr/checkout` — page header, fieldsets stylés
- `/fr/coffrets` — ComingSoonPage stylized
- `/fr/sign-in` — centered card
- `/fr/compte` (logged in) — eyebrow + card

Test responsive : Chrome DevTools mobile viewport (375×667). Header hamburger appears, sidebar disappears, all sections stack properly.

- [ ] **Step 4: Lighthouse (informal, not blocking)**

Chrome DevTools → Lighthouse → Performance / Accessibility / Best Practices / SEO on `/fr` and `/fr/biscuits`. Target : 90+ on Performance.

Note any regressions vs Phase 1. If significant (< 80), investigate before final commit.

- [ ] **Step 5: Final commit**

If anything was tweaked during QA :

```powershell
git add .
git commit -m "chore(polish): final QA tweaks"
```

Otherwise, this task is just verification, no new commit needed.

---

## Polish complete

After all 13 tasks, the branch `phase-1-ecommerce-base` contains :

- Phase 1 functional code (27 commits from earlier)
- Phase 1 polish (13 task commits + this verification)

Total Phase 1 = code complet + polish complet, prêt pour merge `main` puis activation prod (étapes manuelles décrites dans `2026-05-23-phase-1-ecommerce-base-COMPLETE.md`).

**Next step :** merge to main → push → Vercel auto-deploy → activate Stripe + Blob → real photos via admin uploader → live.

---

**End of plan.**
