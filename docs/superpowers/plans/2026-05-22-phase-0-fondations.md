# BeeCuit — Phase 0 (Fondations) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the empty BeeCuit project with a deployable skeleton — Next.js 15 + TS strict + Tailwind v4 + shadcn/ui + ESLint/Prettier + Vitest/Playwright + Drizzle (Neon Postgres) + Auth.js v5 magic-link login + next-intl with FR/NL/DE/EN + a translated homepage + a protected `/compte` page + Vercel deploy + GitHub Actions CI.

**Architecture:** Single Next.js 15 App Router monolith. Postgres on Neon serverless. Drizzle ORM (HTTP driver). Auth.js v5 with Drizzle adapter + Resend magic links. next-intl with URL-prefixed locales. Vercel hosting. All on free tiers.

**Tech Stack:** Next.js 15 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · ESLint v9 (flat config) · Prettier · Vitest · Playwright · Drizzle ORM · @neondatabase/serverless · Auth.js v5 (`next-auth@beta`) · @auth/drizzle-adapter · Resend · React Email · next-intl · pnpm · Vercel · GitHub Actions

**Spec :** `docs/superpowers/specs/2026-05-22-beecuit-design.md`

**Working directory:** `C:\Users\jeanb\Documents\WebAPP\BeeCuit` (Windows, PowerShell)

**Package manager:** pnpm (install via `npm install -g pnpm` if missing; npm works as a fallback by swapping commands)

---

## Prerequisites (manual, one-off)

Before starting, sign up for free accounts:

- [ ] **Node.js 20 LTS** installed (`node -v` ≥ 20.11)
- [ ] **pnpm** installed (`pnpm -v` ≥ 9)
- [ ] **Git** installed (`git --version`)
- [ ] **GitHub** account + a new empty repo `beecuit` (don't initialize with README, .gitignore, or license)
- [ ] **Neon** account at https://console.neon.tech — create a project named `beecuit`; copy the `DATABASE_URL` for the `main` branch
- [ ] **Resend** account at https://resend.com — create an API key named `beecuit-dev`; copy it. (For Phase 0 we'll use the default `onboarding@resend.dev` sender; a verified domain comes later.)
- [ ] **Vercel** account at https://vercel.com — connect GitHub
- [ ] **AUTH_SECRET** — generate one now: `openssl rand -base64 33` (or use `npx auth secret`)

Keep all secrets handy — you'll paste them into `.env.local` at Task 8.

---

## File structure produced by this phase

```
beecuit/
├── .github/workflows/ci.yml
├── .gitignore
├── .env.example
├── .env.local                     # gitignored
├── .prettierrc
├── .prettierignore
├── eslint.config.mjs
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── tsconfig.json
├── playwright.config.ts
├── vitest.config.ts
├── components.json                # shadcn config
├── README.md
├── middleware.ts                  # next-intl + auth
├── docs/superpowers/
│   ├── specs/2026-05-22-beecuit-design.md
│   └── plans/2026-05-22-phase-0-fondations.md
├── i18n/
│   ├── routing.ts
│   └── request.ts
├── messages/
│   ├── fr.json
│   ├── nl.json
│   ├── de.json
│   └── en.json
├── lib/
│   ├── auth.ts
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── schemas/
│   │       ├── auth.ts            # users, accounts, sessions, verification_tokens
│   │       ├── products.ts
│   │       └── orders.ts
│   └── utils.ts
├── drizzle/                       # generated migrations
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── api/auth/[...nextauth]/route.ts
│   └── [locale]/
│       ├── layout.tsx
│       ├── page.tsx               # translated home
│       ├── sign-in/page.tsx       # magic-link sign-in
│       └── compte/page.tsx        # protected test page
├── components/ui/button.tsx       # shadcn smoke test
├── tests/
│   ├── e2e/
│   │   ├── home.spec.ts
│   │   └── auth.spec.ts
│   └── unit/
│       └── db.test.ts
└── public/
    └── favicon.ico
```

---

## Task 1: Initialize git + commit existing spec

**Files:**
- Create: `.gitignore` (replaced by Next.js init in Task 2 — temporary placeholder fine)
- Create: `README.md`

- [ ] **Step 1: Initialize git in project root**

Run in PowerShell from `C:\Users\jeanb\Documents\WebAPP\BeeCuit`:

```powershell
git init
git config user.name "Jean-Baptiste Dhondt"
git config user.email "jeanbaptiste.dhondt1@gmail.com"
git branch -m main
```

Expected: `Initialized empty Git repository in ...\BeeCuit\.git\`

- [ ] **Step 2: Create a minimal `.gitignore`**

Create `.gitignore` at the root:

```
# To be replaced by Next.js .gitignore in Task 2
node_modules/
.env*
!.env.example
.next/
out/
dist/
*.log
.DS_Store
Thumbs.db
.vercel
.idea/
.vscode/
```

- [ ] **Step 3: Create a minimal `README.md`**

Create `README.md` at the root:

```markdown
# BeeCuit

Boutique e-commerce belge premium pour biscuits artisanaux — full-stack Next.js 15.

## Stack
Next.js 15 · TypeScript · Tailwind v4 · shadcn/ui · Drizzle ORM · Neon · Auth.js v5 · next-intl · Stripe · React Three Fiber · Vercel

## Documentation
- **Spec :** `docs/superpowers/specs/2026-05-22-beecuit-design.md`
- **Plans :** `docs/superpowers/plans/`

## Dev
```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Languages
FR (default) · NL · DE · EN
```

- [ ] **Step 4: Initial commit**

```powershell
git add .gitignore README.md docs/
git commit -m "chore: initial commit with spec and plan"
```

Expected: 1 commit with the spec, plan, README, and gitignore.

- [ ] **Step 5: Create GitHub remote and push**

After creating the empty GitHub repo `beecuit`:

```powershell
git remote add origin https://github.com/<your-username>/beecuit.git
git push -u origin main
```

Expected: branch `main` published on GitHub.

---

## Task 2: Bootstrap Next.js 15 + TypeScript strict

**Files:**
- Modify: `.gitignore` (replaced)
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx` (temporary, deleted in Task 11)
- Create: `app/globals.css` (replaced in Task 4)

- [ ] **Step 1: Run create-next-app in the current directory**

```powershell
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*" --use-pnpm --no-turbopack
```

When prompted to overwrite, answer **Yes** for `.gitignore` and `README.md` (we'll re-add our content). Confirm any other prompts with defaults.

Expected: Next.js boilerplate installed, ~250 packages.

- [ ] **Step 2: Restore the project README (was overwritten)**

Re-create `README.md` with the content from Task 1 Step 3.

- [ ] **Step 3: Tighten `tsconfig.json` to strict + extras**

Open `tsconfig.json` and replace the `compilerOptions` block with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": false,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "dist", "playwright-report", "test-results"]
}
```

- [ ] **Step 4: Verify dev server starts and type-checks pass**

```powershell
pnpm dev
```

Open http://localhost:3000 → the default Next.js welcome page should render. Stop the server (Ctrl+C).

```powershell
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```powershell
git add .
git commit -m "feat: bootstrap Next.js 15 with strict TypeScript"
```

---

## Task 3: Tailwind v4 setup with BeeCuit design tokens

**Files:**
- Modify: `app/globals.css`
- Verify: `postcss.config.mjs`
- Delete: `tailwind.config.ts` (if present — v4 uses CSS config)

- [ ] **Step 1: Verify Tailwind v4 is installed via create-next-app**

```powershell
pnpm list tailwindcss
```

Expected: version `^4.x`. If you see `^3.x`, upgrade:

```powershell
pnpm add -D tailwindcss@latest @tailwindcss/postcss@latest
pnpm remove autoprefixer postcss-import 2>$null
```

- [ ] **Step 2: Verify `postcss.config.mjs`**

Open `postcss.config.mjs`. It should contain:

```javascript
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
```

If different, replace its content with the above.

- [ ] **Step 3: Remove obsolete v3 config file**

If `tailwind.config.ts` or `tailwind.config.js` exists at the root, delete it. Tailwind v4 uses CSS-based config exclusively.

- [ ] **Step 4: Replace `app/globals.css` with BeeCuit theme**

Open `app/globals.css` and replace its entire content with:

```css
@import "tailwindcss";

@theme {
  /* — BeeCuit palette — */
  --color-honey: #e4a11b;
  --color-honey-dark: #b07a0e;
  --color-cream: #fbf6ee;
  --color-terracotta: #c97757;
  --color-warm-brown: #4a332a;
  --color-cookie: #c68b5a;
  --color-soft-rose: #e8d2c5;
  --color-leaf: #708b58;

  /* — Typography — */
  --font-display: "Fraunces", ui-serif, Georgia, serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* — Radius & shadows — */
  --radius-sm: 0.375rem;
  --radius: 0.625rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}

@layer base {
  html {
    color-scheme: light;
  }
  body {
    background-color: var(--color-cream);
    color: var(--color-warm-brown);
    font-family: var(--font-body);
    font-feature-settings: "ss01", "cv11";
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    font-weight: 500;
    letter-spacing: -0.02em;
  }
}
```

- [ ] **Step 5: Replace `app/page.tsx` with a token smoke-test**

Replace `app/page.tsx`:

```tsx
export default function RootPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center space-y-4">
        <h1 className="text-5xl text-honey">BeeCuit</h1>
        <p className="text-warm-brown">Tailwind v4 tokens OK</p>
        <button className="px-6 py-3 rounded-lg bg-honey text-cream font-medium hover:bg-honey-dark transition">
          Bouton test
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Verify the page renders with the palette**

```powershell
pnpm dev
```

Open http://localhost:3000 → background cream, title in honey, button hover dark honey. Stop server.

- [ ] **Step 7: Commit**

```powershell
git add app/globals.css app/page.tsx postcss.config.mjs
git commit -m "feat: tailwind v4 with BeeCuit design tokens"
```

---

## Task 4: shadcn/ui init + Button smoke component

**Files:**
- Create: `components.json`
- Create: `components/ui/button.tsx`
- Create: `lib/utils.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Initialize shadcn/ui (Tailwind v4 mode)**

```powershell
pnpm dlx shadcn@latest init
```

Answer prompts:
- Which color would you like to use as a base color? → `Neutral`
- Would you like to use CSS variables for theming? → `Yes`

Expected: `components.json`, `lib/utils.ts`, updated `app/globals.css` (shadcn adds its own variables — keep them, they live alongside ours).

- [ ] **Step 2: Re-apply BeeCuit tokens to `app/globals.css`**

After shadcn init, re-open `app/globals.css`. shadcn will have added `@layer base { :root { --background: ... } }` blocks. Make sure your `@theme { }` block from Task 3 is still at the top. If shadcn moved it, put it back. Final file should start with:

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme {
  /* BeeCuit tokens — see Task 3 step 4 */
  --color-honey: #e4a11b;
  /* ... rest of tokens ... */
}

/* shadcn variables and @layer base blocks follow ... */
```

(`tw-animate-css` is added by shadcn for animations.)

- [ ] **Step 3: Add the Button component**

```powershell
pnpm dlx shadcn@latest add button
```

Expected: `components/ui/button.tsx` created, dependencies installed.

- [ ] **Step 4: Replace `app/page.tsx` with shadcn Button smoke test**

```tsx
import { Button } from "@/components/ui/button";

export default function RootPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center space-y-4">
        <h1 className="text-5xl text-honey">BeeCuit</h1>
        <p className="text-warm-brown">shadcn/ui OK</p>
        <Button className="bg-honey text-cream hover:bg-honey-dark">
          Bouton shadcn
        </Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Verify dev render**

```powershell
pnpm dev
```

Open http://localhost:3000 → page should render with shadcn Button. Stop server.

- [ ] **Step 6: Commit**

```powershell
git add components.json components/ lib/utils.ts app/
git commit -m "feat: shadcn/ui init with Button"
```

---

## Task 5: ESLint v9 + Prettier setup

**Files:**
- Modify: `eslint.config.mjs`
- Create: `.prettierrc`
- Create: `.prettierignore`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Install Prettier and Tailwind plugin**

```powershell
pnpm add -D prettier prettier-plugin-tailwindcss eslint-config-prettier
```

- [ ] **Step 2: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100,
  "arrowParens": "always",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 3: Create `.prettierignore`**

```
node_modules
.next
dist
out
public
pnpm-lock.yaml
*.md
drizzle
playwright-report
test-results
.vercel
```

- [ ] **Step 4: Extend `eslint.config.mjs` to disable conflicts with Prettier**

Replace `eslint.config.mjs` with:

```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    ignores: ["drizzle/**", ".next/**", "playwright-report/**", "test-results/**"],
  },
];

export default eslintConfig;
```

- [ ] **Step 5: Add format + lint scripts to `package.json`**

Open `package.json` and replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "lint:fix": "next lint --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 6: Verify lint + format pass**

```powershell
pnpm format
pnpm lint
pnpm typecheck
```

Expected: all three pass with no errors.

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "chore: add Prettier + ESLint conflict resolution"
```

---

## Task 6: Vitest setup with one passing unit test

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/unit/sanity.test.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Install Vitest + jsdom**

```powershell
pnpm add -D vitest @vitejs/plugin-react jsdom @types/node
```

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    globals: true,
    coverage: {
      reporter: ["text", "html"],
      exclude: ["tests/**", "drizzle/**", "**/*.config.*"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 3: Write the failing sanity test**

Create `tests/unit/sanity.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("can run a test", () => {
    expect(1 + 1).toBe(2);
  });

  it("can resolve the @/ alias", async () => {
    const utils = await import("@/lib/utils");
    expect(typeof utils.cn).toBe("function");
  });
});
```

- [ ] **Step 4: Add Vitest scripts to `package.json`**

Inside the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Run tests — expected: 2 pass**

```powershell
pnpm test
```

Expected: `Test Files  1 passed (1)` and `Tests  2 passed (2)`.

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "test: Vitest setup with sanity tests"
```

---

## Task 7: Playwright setup with one passing E2E test

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/home.spec.ts`
- Modify: `package.json` (scripts)
- Modify: `.gitignore`

- [ ] **Step 1: Install Playwright**

```powershell
pnpm add -D @playwright/test
pnpm dlx playwright install chromium
```

Expected: Chromium downloads (~150 MB).

- [ ] **Step 2: Create `playwright.config.ts`**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Add Playwright artifacts to `.gitignore`**

Append to `.gitignore`:

```
# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

- [ ] **Step 4: Write the failing E2E test**

Create `tests/e2e/home.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("home page renders BeeCuit title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("BeeCuit");
});
```

- [ ] **Step 5: Add Playwright scripts to `package.json`**

Inside `"scripts"`, add:

```json
"e2e": "playwright test",
"e2e:ui": "playwright test --ui"
```

- [ ] **Step 6: Run the E2E test — expected: 1 pass**

```powershell
pnpm e2e
```

Expected: `1 passed` (Playwright will start the dev server, run the test, kill the server).

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "test: Playwright setup with home page smoke test"
```

---

## Task 8: Environment variables structure

**Files:**
- Create: `.env.example`
- Create: `.env.local` (gitignored)
- Create: `lib/env.ts`

- [ ] **Step 1: Install env validation library**

```powershell
pnpm add zod @t3-oss/env-nextjs
```

- [ ] **Step 2: Create `.env.example`**

```bash
# ── Database ──────────────────────────────────────────────────
DATABASE_URL="postgres://USER:PASSWORD@HOST/DB?sslmode=require"

# ── Auth.js v5 ────────────────────────────────────────────────
AUTH_SECRET="run: openssl rand -base64 33"
AUTH_URL="http://localhost:3000"

# ── Resend (magic links) ──────────────────────────────────────
AUTH_RESEND_KEY="re_..."
AUTH_EMAIL_FROM="BeeCuit <onboarding@resend.dev>"

# ── Public app config ─────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

- [ ] **Step 3: Copy `.env.example` to `.env.local` and fill in real values**

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` and replace each placeholder with the real values gathered in Prerequisites (Neon `DATABASE_URL`, generated `AUTH_SECRET`, Resend `AUTH_RESEND_KEY`).

- [ ] **Step 4: Create typed env loader `lib/env.ts`**

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(32),
    AUTH_URL: z.string().url().optional(),
    AUTH_RESEND_KEY: z.string().startsWith("re_"),
    AUTH_EMAIL_FROM: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY,
    AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

- [ ] **Step 5: Verify env loads without throwing**

```powershell
pnpm typecheck
pnpm tsx -e "import './lib/env'; console.log('env OK')"
```

If `pnpm tsx` not installed:

```powershell
pnpm add -D tsx
pnpm tsx -e "import('./lib/env').then(() => console.log('env OK'))"
```

Expected: `env OK`.

- [ ] **Step 6: Verify `.env.local` is gitignored**

```powershell
git status
```

Expected: `.env.local` does NOT appear in untracked files. (Next.js default `.gitignore` includes `.env*` already.)

- [ ] **Step 7: Commit**

```powershell
git add .env.example lib/env.ts package.json pnpm-lock.yaml
git commit -m "feat: typed env validation with t3-env + zod"
```

---

## Task 9: Drizzle ORM + Neon connection

**Files:**
- Create: `drizzle.config.ts`
- Create: `lib/db/index.ts`
- Create: `lib/db/schema.ts` (placeholder)
- Modify: `package.json` (scripts)

- [ ] **Step 1: Install Drizzle and Neon driver**

```powershell
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit
```

- [ ] **Step 2: Create `drizzle.config.ts`**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
```

- [ ] **Step 3: Create `lib/db/index.ts`**

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { env } from "@/lib/env";

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export type Database = typeof db;
```

- [ ] **Step 4: Create placeholder `lib/db/schema.ts`**

```typescript
// Barrel export — populated in Tasks 10-12.
export {};
```

- [ ] **Step 5: Add Drizzle scripts to `package.json`**

Inside `"scripts"`, add:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 6: Add `dotenv` loader so drizzle-kit picks up `.env.local`**

drizzle-kit reads from `.env` by default — to make it read `.env.local`, install and use `dotenv-cli`:

```powershell
pnpm add -D dotenv-cli
```

Update the four db scripts in `package.json`:

```json
"db:generate": "dotenv -e .env.local -- drizzle-kit generate",
"db:migrate": "dotenv -e .env.local -- drizzle-kit migrate",
"db:push": "dotenv -e .env.local -- drizzle-kit push",
"db:studio": "dotenv -e .env.local -- drizzle-kit studio"
```

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat: Drizzle ORM connected to Neon Postgres"
```

---

## Task 10: Drizzle schema — Auth.js v5 tables

**Files:**
- Create: `lib/db/schemas/auth.ts`
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0000_init_auth.sql` (generated)

- [ ] **Step 1: Create `lib/db/schemas/auth.ts`**

These match the Auth.js v5 Drizzle adapter expected shape (with our own additions: `role`, `preferred_locale`).

```typescript
import {
  pgTable,
  text,
  timestamp,
  primaryKey,
  integer,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["customer", "b2b", "admin"]);
export const locale = pgEnum("locale", ["fr", "nl", "de", "en"]);

export const users = pgTable("users", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: userRole("role").notNull().default("customer"),
  preferredLocale: locale("preferred_locale").notNull().default("fr"),
  newsletterOptIn: boolean("newsletter_opt_in").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);
```

- [ ] **Step 2: Re-export from `lib/db/schema.ts`**

Replace `lib/db/schema.ts` with:

```typescript
export * from "./schemas/auth";
```

- [ ] **Step 3: Generate the migration**

```powershell
pnpm db:generate
```

Expected: `drizzle/0000_<name>.sql` and `drizzle/meta/_journal.json` created.

- [ ] **Step 4: Apply the migration to Neon**

```powershell
pnpm db:migrate
```

Expected: tables created. Verify in Neon console (Tables tab).

- [ ] **Step 5: Verify with a tiny query**

Create `tests/unit/db.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

describe("db connection", () => {
  it("can query users table (should be empty)", async () => {
    const rows = await db.select().from(users).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  });
});
```

Run it (loading env from `.env.local`):

```powershell
pnpm dotenv -e .env.local -- pnpm test
```

Expected: `3 passed` (sanity x2 + db connection x1).

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "feat(db): Auth.js tables via Drizzle"
```

---

## Task 11: Drizzle schema — products (minimal Phase 0)

**Files:**
- Create: `lib/db/schemas/products.ts`
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0001_products.sql` (generated)

The full products schema with translations comes in Phase 1. Phase 0 only needs the table to exist for migrations to work.

- [ ] **Step 1: Create `lib/db/schemas/products.ts`**

```typescript
import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const productType = pgEnum("product_type", [
  "biscuit",
  "coffret",
  "subscription_plan",
]);

export const products = pgTable("products", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  type: productType("type").notNull(),
  slug: text("slug").notNull().unique(),
  sku: text("sku").notNull().unique(),
  basePriceCents: integer("base_price_cents").notNull(),
  weightGrams: integer("weight_grams").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  stockQuantity: integer("stock_quantity"),
  thumbnailUrl: text("thumbnail_url"),
  model3dUrl: text("model_3d_url"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
```

- [ ] **Step 2: Add to `lib/db/schema.ts` barrel**

```typescript
export * from "./schemas/auth";
export * from "./schemas/products";
```

- [ ] **Step 3: Generate and apply migration**

```powershell
pnpm db:generate
pnpm db:migrate
```

Expected: `drizzle/0001_*.sql` created, `products` table appears in Neon.

- [ ] **Step 4: Add products to the db test**

Append to `tests/unit/db.test.ts`:

```typescript
import { products } from "@/lib/db/schema";

describe("products table", () => {
  it("is queryable", async () => {
    const rows = await db.select().from(products).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  });
});
```

Run:

```powershell
pnpm dotenv -e .env.local -- pnpm test
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```powershell
git add .
git commit -m "feat(db): products table (minimal Phase 0)"
```

---

## Task 12: Drizzle schema — orders (minimal Phase 0)

**Files:**
- Create: `lib/db/schemas/orders.ts`
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0002_orders.sql` (generated)

- [ ] **Step 1: Create `lib/db/schemas/orders.ts`**

```typescript
import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const orders = pgTable("orders", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  guestEmail: text("guest_email"),
  status: orderStatus("status").notNull().default("pending"),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull().default("EUR"),
  locale: text("locale").notNull().default("fr"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { mode: "date" }),
});
```

- [ ] **Step 2: Add to `lib/db/schema.ts` barrel**

```typescript
export * from "./schemas/auth";
export * from "./schemas/products";
export * from "./schemas/orders";
```

- [ ] **Step 3: Generate and apply migration**

```powershell
pnpm db:generate
pnpm db:migrate
```

Expected: `drizzle/0002_*.sql` created, `orders` table appears in Neon.

- [ ] **Step 4: Add orders to the db test**

Append to `tests/unit/db.test.ts`:

```typescript
import { orders } from "@/lib/db/schema";

describe("orders table", () => {
  it("is queryable", async () => {
    const rows = await db.select().from(orders).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  });
});
```

Run:

```powershell
pnpm dotenv -e .env.local -- pnpm test
```

Expected: `5 passed`.

- [ ] **Step 5: Commit**

```powershell
git add .
git commit -m "feat(db): orders table (minimal Phase 0)"
```

---

## Task 13: next-intl setup with 4 locales

**Files:**
- Create: `i18n/routing.ts`
- Create: `i18n/request.ts`
- Create: `messages/fr.json`
- Create: `messages/nl.json`
- Create: `messages/de.json`
- Create: `messages/en.json`
- Create: `middleware.ts`
- Modify: `next.config.ts`
- Delete: `app/page.tsx` (root) — replaced by `app/[locale]/page.tsx`
- Create: `app/[locale]/layout.tsx`
- Create: `app/[locale]/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install next-intl**

```powershell
pnpm add next-intl
```

- [ ] **Step 2: Create `i18n/routing.ts`**

```typescript
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["fr", "nl", "de", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 3: Create `i18n/request.ts`**

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as never)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 4: Create message files for the 4 locales**

`messages/fr.json`:

```json
{
  "home": {
    "title": "BeeCuit",
    "tagline": "Biscuits artisanaux de Liège",
    "cta": "Découvrir nos coffrets",
    "languageSwitcher": "Changer de langue"
  },
  "nav": {
    "home": "Accueil",
    "biscuits": "Biscuits",
    "coffrets": "Coffrets",
    "compose": "Composer mon coffret",
    "subscription": "Abonnement",
    "business": "Entreprises",
    "journal": "Journal",
    "account": "Mon compte",
    "signIn": "Se connecter",
    "signOut": "Se déconnecter"
  },
  "auth": {
    "signInTitle": "Se connecter à BeeCuit",
    "signInDescription": "Reçois un lien de connexion par email — pas de mot de passe.",
    "emailLabel": "Adresse email",
    "emailPlaceholder": "ton@email.com",
    "submit": "Envoyer le lien",
    "checkEmail": "Vérifie ta boîte email — un lien t'attend",
    "back": "Retour"
  },
  "account": {
    "title": "Mon compte",
    "welcome": "Bonjour {name}",
    "loggedInAs": "Connecté en tant que {email}"
  }
}
```

`messages/nl.json`:

```json
{
  "home": {
    "title": "BeeCuit",
    "tagline": "Ambachtelijke koekjes uit Luik",
    "cta": "Ontdek onze dozen",
    "languageSwitcher": "Taal wijzigen"
  },
  "nav": {
    "home": "Home",
    "biscuits": "Koekjes",
    "coffrets": "Dozen",
    "compose": "Stel je doos samen",
    "subscription": "Abonnement",
    "business": "Bedrijven",
    "journal": "Journal",
    "account": "Mijn account",
    "signIn": "Inloggen",
    "signOut": "Uitloggen"
  },
  "auth": {
    "signInTitle": "Inloggen bij BeeCuit",
    "signInDescription": "Ontvang een loginlink per e-mail — geen wachtwoord nodig.",
    "emailLabel": "E-mailadres",
    "emailPlaceholder": "jouw@email.com",
    "submit": "Stuur de link",
    "checkEmail": "Controleer je inbox — een link wacht op je",
    "back": "Terug"
  },
  "account": {
    "title": "Mijn account",
    "welcome": "Hallo {name}",
    "loggedInAs": "Ingelogd als {email}"
  }
}
```

`messages/de.json`:

```json
{
  "home": {
    "title": "BeeCuit",
    "tagline": "Handwerkliche Kekse aus Lüttich",
    "cta": "Entdecke unsere Boxen",
    "languageSwitcher": "Sprache wechseln"
  },
  "nav": {
    "home": "Startseite",
    "biscuits": "Kekse",
    "coffrets": "Boxen",
    "compose": "Box zusammenstellen",
    "subscription": "Abonnement",
    "business": "Unternehmen",
    "journal": "Journal",
    "account": "Mein Konto",
    "signIn": "Anmelden",
    "signOut": "Abmelden"
  },
  "auth": {
    "signInTitle": "Bei BeeCuit anmelden",
    "signInDescription": "Erhalte einen Login-Link per E-Mail — kein Passwort nötig.",
    "emailLabel": "E-Mail-Adresse",
    "emailPlaceholder": "deine@email.com",
    "submit": "Link senden",
    "checkEmail": "Prüfe deinen Posteingang — ein Link wartet auf dich",
    "back": "Zurück"
  },
  "account": {
    "title": "Mein Konto",
    "welcome": "Hallo {name}",
    "loggedInAs": "Angemeldet als {email}"
  }
}
```

`messages/en.json`:

```json
{
  "home": {
    "title": "BeeCuit",
    "tagline": "Artisan biscuits from Liège",
    "cta": "Discover our boxes",
    "languageSwitcher": "Change language"
  },
  "nav": {
    "home": "Home",
    "biscuits": "Biscuits",
    "coffrets": "Boxes",
    "compose": "Compose your box",
    "subscription": "Subscription",
    "business": "Business",
    "journal": "Journal",
    "account": "My account",
    "signIn": "Sign in",
    "signOut": "Sign out"
  },
  "auth": {
    "signInTitle": "Sign in to BeeCuit",
    "signInDescription": "Receive a sign-in link by email — no password needed.",
    "emailLabel": "Email address",
    "emailPlaceholder": "your@email.com",
    "submit": "Send link",
    "checkEmail": "Check your inbox — a link is waiting",
    "back": "Back"
  },
  "account": {
    "title": "My account",
    "welcome": "Hello {name}",
    "loggedInAs": "Signed in as {email}"
  }
}
```

- [ ] **Step 5: Create `middleware.ts`**

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all paths except:
    // - /api/
    // - /_next/
    // - /_vercel/
    // - paths with a file extension (favicon.ico, robots.txt, etc.)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
```

- [ ] **Step 6: Wire next-intl into `next.config.ts`**

Replace `next.config.ts` with:

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: Delete the root `app/page.tsx`**

```powershell
Remove-Item app/page.tsx
```

- [ ] **Step 8: Update root `app/layout.tsx` to be locale-agnostic**

```tsx
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

(The actual `<html>` and `<body>` move to `app/[locale]/layout.tsx`.)

- [ ] **Step 9: Create `app/[locale]/layout.tsx`**

```tsx
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 10: Create translated homepage `app/[locale]/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { routing } from "@/i18n/routing";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center space-y-6 max-w-xl px-6">
        <h1 className="text-6xl text-honey">{t("title")}</h1>
        <p className="text-warm-brown text-xl">{t("tagline")}</p>
        <Button className="bg-honey text-cream hover:bg-honey-dark">
          {t("cta")}
        </Button>

        <nav className="flex justify-center gap-3 pt-12 text-sm" aria-label={t("languageSwitcher")}>
          {routing.locales.map((l) => (
            <Link
              key={l}
              href="/"
              locale={l}
              className={`uppercase tracking-wide ${l === locale ? "text-honey-dark font-bold underline" : "text-warm-brown hover:text-honey-dark"}`}
            >
              {l}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
```

- [ ] **Step 11: Update E2E test for the new locale-prefixed URL**

Replace `tests/e2e/home.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

const expected = {
  fr: { title: "BeeCuit", tagline: "Biscuits artisanaux de Liège" },
  nl: { title: "BeeCuit", tagline: "Ambachtelijke koekjes uit Luik" },
  de: { title: "BeeCuit", tagline: "Handwerkliche Kekse aus Lüttich" },
  en: { title: "BeeCuit", tagline: "Artisan biscuits from Liège" },
} as const;

for (const [locale, content] of Object.entries(expected)) {
  test(`home page renders in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(content.title);
    await expect(page.getByText(content.tagline)).toBeVisible();
  });
}

test("root path redirects to default locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/fr$/);
});
```

- [ ] **Step 12: Verify the locales work in dev**

```powershell
pnpm dev
```

Test these URLs:
- http://localhost:3000/ → redirects to `/fr`
- http://localhost:3000/fr → "Biscuits artisanaux de Liège"
- http://localhost:3000/nl → "Ambachtelijke koekjes uit Luik"
- http://localhost:3000/de → "Handwerkliche Kekse aus Lüttich"
- http://localhost:3000/en → "Artisan biscuits from Liège"

Stop server.

- [ ] **Step 13: Run E2E**

```powershell
pnpm e2e
```

Expected: `5 passed` (4 locales + root redirect).

- [ ] **Step 14: Commit**

```powershell
git add .
git commit -m "feat(i18n): next-intl with FR/NL/DE/EN locales"
```

---

## Task 14: Auth.js v5 with Resend magic links + Drizzle adapter

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/[locale]/sign-in/page.tsx`
- Create: `app/[locale]/compte/page.tsx`
- Modify: `middleware.ts` (extend to gate `/compte`)
- Modify: `app/[locale]/layout.tsx` (no change for now, but verify)

- [ ] **Step 1: Install Auth.js v5 + adapter + Resend**

```powershell
pnpm add next-auth@beta @auth/drizzle-adapter resend
```

- [ ] **Step 2: Create `lib/auth.ts`**

```typescript
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { env } from "@/lib/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: [
    Resend({
      apiKey: env.AUTH_RESEND_KEY,
      from: env.AUTH_EMAIL_FROM,
      async sendVerificationRequest(params) {
        const { identifier, url, provider } = params;

        if (process.env.NODE_ENV !== "production") {
          console.log("\n[auth] Magic link for", identifier);
          console.log("[auth]", url, "\n");
        }

        const { Resend: ResendClient } = await import("resend");
        const resend = new ResendClient(provider.apiKey as string);
        const result = await resend.emails.send({
          from: provider.from as string,
          to: identifier,
          subject: "Ton lien de connexion BeeCuit",
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #4a332a;">
              <h1 style="color: #e4a11b; font-size: 28px; margin-bottom: 16px;">BeeCuit</h1>
              <p>Clique sur le lien ci-dessous pour te connecter. Il est valable 24 heures.</p>
              <p style="margin: 24px 0;">
                <a href="${url}" style="display: inline-block; background: #e4a11b; color: #fbf6ee; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                  Se connecter à BeeCuit
                </a>
              </p>
              <p style="font-size: 12px; color: #888;">Si tu n'as pas demandé ce lien, tu peux ignorer cet email.</p>
            </div>
          `,
          text: `Lien de connexion BeeCuit : ${url}`,
        });

        if (result.error) {
          throw new Error(`Resend error: ${result.error.message}`);
        }
      },
    }),
  ],
  pages: {
    signIn: "/fr/sign-in",
    verifyRequest: "/fr/sign-in?check=email",
  },
  trustHost: true,
});
```

- [ ] **Step 3: Create the API route**

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Create the sign-in page `app/[locale]/sign-in/page.tsx`**

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

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
      <main className="min-h-screen flex items-center justify-center bg-cream">
        <div className="max-w-md text-center space-y-4 p-6">
          <h1 className="text-3xl text-honey">📬</h1>
          <p className="text-warm-brown">{t("checkEmail")}</p>
          <Link href="/" className="text-sm underline text-warm-brown hover:text-honey-dark">
            {t("back")}
          </Link>
        </div>
      </main>
    );
  }

  async function handleSignIn(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    await signIn("resend", { email, redirectTo: `/${locale}/compte` });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream">
      <form action={handleSignIn} className="max-w-md w-full space-y-4 p-6">
        <h1 className="text-3xl text-honey">{t("signInTitle")}</h1>
        <p className="text-warm-brown">{t("signInDescription")}</p>
        <label className="block">
          <span className="text-sm text-warm-brown">{t("emailLabel")}</span>
          <input
            type="email"
            name="email"
            required
            placeholder={t("emailPlaceholder")}
            className="mt-1 block w-full rounded-md border border-warm-brown/20 bg-white px-3 py-2 text-warm-brown focus:border-honey focus:outline-none focus:ring-2 focus:ring-honey/30"
          />
        </label>
        <Button type="submit" className="w-full bg-honey text-cream hover:bg-honey-dark">
          {t("submit")}
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Create the protected `/compte` page**

`app/[locale]/compte/page.tsx`:

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
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
    <main className="min-h-screen flex items-center justify-center bg-cream">
      <div className="max-w-md w-full space-y-4 p-6">
        <h1 className="text-3xl text-honey">{t("title")}</h1>
        <p className="text-warm-brown">
          {t("welcome", { name: session!.user!.name ?? session!.user!.email ?? "" })}
        </p>
        <p className="text-sm text-warm-brown/70">
          {t("loggedInAs", { email: session!.user!.email ?? "" })}
        </p>
        <form action={handleSignOut}>
          <Button type="submit" variant="outline">
            {(await getTranslations("nav"))("signOut")}
          </Button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Extend `middleware.ts` to combine next-intl + auth gating**

Replace `middleware.ts` with:

```typescript
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { auth } from "./lib/auth";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PATHS = ["/compte"];

function isProtected(pathname: string): boolean {
  return routing.locales.some((locale) =>
    PROTECTED_PATHS.some((p) => pathname.startsWith(`/${locale}${p}`)),
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isProtected(pathname)) {
    const session = await auth();
    if (!session?.user) {
      const locale = pathname.split("/")[1] ?? routing.defaultLocale;
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/sign-in`;
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 7: Write E2E auth tests**

Create `tests/e2e/auth.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("unauthenticated /compte redirects to /sign-in", async ({ page }) => {
  await page.goto("/fr/compte");
  await expect(page).toHaveURL(/\/fr\/sign-in$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Se connecter");
});

test("sign-in page renders the email form", async ({ page }) => {
  await page.goto("/fr/sign-in");
  await expect(page.getByLabel("Adresse email")).toBeVisible();
  await expect(page.getByRole("button", { name: /envoyer le lien/i })).toBeVisible();
});

test("submitting an email shows the check-email confirmation", async ({ page }) => {
  await page.goto("/fr/sign-in");
  await page.getByLabel("Adresse email").fill(`test+${Date.now()}@example.com`);
  await page.getByRole("button", { name: /envoyer le lien/i }).click();
  await expect(page).toHaveURL(/check=email/);
  await expect(page.getByText(/v[ée]rifie ta bo[îi]te email/i)).toBeVisible();
});
```

- [ ] **Step 8: Verify locally**

```powershell
pnpm dev
```

- Visit http://localhost:3000/fr/compte → redirects to `/fr/sign-in`
- Enter `jeanbaptiste.dhondt1@gmail.com` → submit → URL shows `?check=email`
- Check the terminal — in dev mode the magic link URL is logged. Copy it, paste it in your browser → lands on `/fr/compte` showing your email.

Stop server.

- [ ] **Step 9: Run E2E**

```powershell
pnpm e2e
```

Expected: `8 passed` (5 home + 3 auth).

- [ ] **Step 10: Commit**

```powershell
git add .
git commit -m "feat(auth): Auth.js v5 magic-link login with Drizzle adapter + Resend"
```

---

## Task 15: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-test-build:
    name: Lint · Typecheck · Test · Build
    runs-on: ubuntu-latest
    timeout-minutes: 15

    env:
      SKIP_ENV_VALIDATION: "true"
      DATABASE_URL: "postgres://placeholder:placeholder@localhost:5432/placeholder"
      AUTH_SECRET: "ci-placeholder-secret-at-least-32-characters-long"
      AUTH_RESEND_KEY: "re_placeholder_ci_key"
      AUTH_EMAIL_FROM: "BeeCuit <onboarding@resend.dev>"
      NEXT_PUBLIC_APP_URL: "http://localhost:3000"

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Format check
        run: pnpm format:check

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Unit tests (without DB)
        run: pnpm vitest run tests/unit/sanity.test.ts

      - name: Build
        run: pnpm build
```

**Note:** the DB tests are excluded from CI because they need a real Neon URL — they run locally instead. The build step still works because `SKIP_ENV_VALIDATION=true` bypasses zod validation, and Next.js doesn't connect to the DB at build time (we only use it in Server Actions / API routes, not in `getStaticProps`).

- [ ] **Step 2: Commit and push**

```powershell
git add .github/
git commit -m "ci: GitHub Actions for lint/typecheck/test/build"
git push
```

- [ ] **Step 3: Verify the CI run on GitHub**

Open https://github.com/<your-username>/beecuit/actions → the workflow should be green.

If it fails:
- Format check failure → run `pnpm format` locally + commit
- Lint failure → fix reported issues + commit
- Build failure → reproduce locally with `SKIP_ENV_VALIDATION=true pnpm build` and fix

---

## Task 16: Vercel deploy

**Files:**
- Create: `vercel.json` (only if needed for explicit settings — usually not)

- [ ] **Step 1: Install Vercel CLI globally**

```powershell
pnpm add -g vercel
```

- [ ] **Step 2: Link the project**

```powershell
vercel link
```

Follow prompts:
- Set up and deploy? **Yes**
- Which scope? Your personal account.
- Link to existing project? **No**
- Project name? `beecuit`
- Directory? `./`
- Override settings? **No**

This creates `.vercel/` (gitignored).

- [ ] **Step 3: Add env vars to Vercel**

```powershell
vercel env add DATABASE_URL production
# Paste your Neon DATABASE_URL when prompted

vercel env add AUTH_SECRET production
# Paste your AUTH_SECRET

vercel env add AUTH_RESEND_KEY production
# Paste your Resend API key

vercel env add AUTH_EMAIL_FROM production
# Paste: BeeCuit <onboarding@resend.dev>

vercel env add NEXT_PUBLIC_APP_URL production
# Will be your Vercel URL, e.g. https://beecuit.vercel.app
# (You can update this after first deploy if needed)
```

Repeat for `preview` and `development` environments if you want previews to work fully.

**Important:** also add an `AUTH_URL` env var to `production` only — set it to your production URL (e.g., `https://beecuit.vercel.app`). This is required by Auth.js for production redirects.

```powershell
vercel env add AUTH_URL production
# Paste: https://beecuit.vercel.app
```

- [ ] **Step 4: Deploy to production**

```powershell
vercel --prod
```

Expected: deployment succeeds, URL printed. Open it.

Test:
- `/` redirects to `/fr`
- Each locale renders
- `/fr/compte` redirects to sign-in
- Sign-in submission works (this time you'll receive a real email)

- [ ] **Step 5: Connect GitHub for auto-deploys**

In Vercel dashboard → Project settings → Git → Connect Git Repository → choose `beecuit`. Auto-deploys on `main` are now enabled.

- [ ] **Step 6: Commit any Vercel config that emerged**

```powershell
git add .gitignore vercel.json 2>$null
git commit -m "chore: vercel deploy configuration" --allow-empty
git push
```

(Add `.vercel/` to gitignore if not already there.)

---

## Task 17: End-to-end smoke verification

**Files:** (no new files — full system validation)

- [ ] **Step 1: Local smoke pass**

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm dotenv -e .env.local -- pnpm test
pnpm e2e
pnpm build
```

Expected: every command exits 0. **5 tests passing in Vitest, 8 in Playwright.**

- [ ] **Step 2: Production smoke pass**

Open the Vercel URL and verify manually:

- [ ] Root URL `/` redirects to `/fr`
- [ ] `/fr` shows "Biscuits artisanaux de Liège"
- [ ] `/nl` shows "Ambachtelijke koekjes uit Luik"
- [ ] `/de` shows "Handwerkliche Kekse aus Lüttich"
- [ ] `/en` shows "Artisan biscuits from Liège"
- [ ] Language switcher links work between locales
- [ ] `/fr/compte` redirects to `/fr/sign-in` while logged out
- [ ] Submitting the sign-in form sends an email to `jeanbaptiste.dhondt1@gmail.com`
- [ ] Clicking the link in the email lands on `/fr/compte` with your email displayed
- [ ] Sign out returns to `/fr`
- [ ] Browser DevTools → Network shows the homepage HTML contains `lang="fr"` (or appropriate locale)
- [ ] No console errors in browser DevTools
- [ ] Lighthouse score (DevTools → Lighthouse → Performance, Mobile) ≥ 90 for the homepage

- [ ] **Step 3: Document phase completion**

Create `docs/superpowers/plans/2026-05-22-phase-0-fondations-COMPLETE.md` with:

```markdown
# Phase 0 — Completion Report (2026-XX-XX)

## Status: ✅ Complete

## Production URL
https://beecuit.vercel.app (or your domain)

## Verified
- Next.js 15 + TS strict + Tailwind v4 + shadcn/ui — running
- Drizzle + Neon — connected, 3 tables (users, accounts, sessions, verification_tokens, products, orders)
- next-intl 4 locales (FR/NL/DE/EN) — all rendering
- Auth.js v5 magic links via Resend — magic link received and login completed end-to-end
- Vercel — production deployed, GitHub auto-deploy active
- GitHub Actions — green pipeline (lint, typecheck, test, build)

## Test counts
- Vitest unit: 5 (sanity x2, db x3)
- Playwright E2E: 8 (4 locales + redirect + 3 auth)

## Next phase
See spec section 10, Phase 1 — E-commerce de base.
```

- [ ] **Step 4: Final commit**

```powershell
git add docs/
git commit -m "docs: Phase 0 completion report"
git push
```

---

## Phase 0 done. Next steps

Phase 0 produces a deployable skeleton. The next plan to write is **Phase 1 — E-commerce de base** (catalogue products + page liste + page détail without 3D + admin CRUD products + cart + checkout Stripe + webhooks + emails confirmation + shipping rates + basic account area).

When ready, run brainstorming again with target "Phase 1" or invoke `superpowers:writing-plans` referencing the spec.

---

**End of plan.**
