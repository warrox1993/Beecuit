# Phase 1 — Completion Report (2026-05-23)

## Status: ✅ Code complete, ⏳ awaiting prod activation (Stripe keys + Vercel deploy + manual smoke)

## Branch
`phase-1-ecommerce-base` (27 commits over the day, on top of Phase 0 main)

## Production URL
https://beecuit.vercel.app (still serving Phase 0 — needs merge + redeploy + real Stripe/Blob credentials)

## What's built

### Customer flow
- Layout shell with Header (logo, nav, locale switcher, cart icon with live count badge) + Footer
- Catalog list `/biscuits` with category filter chips (8 seeded products in 4 locales)
- Product detail `/biscuits/[slug]` with image gallery, price, allergens, nutritional facts, SEO metadata
- Cart Server Actions (anonymous via `cart_session_token` cookie + auth + merge on login)
- AddToCartButton with quantity selector
- Cart page `/panier` with quantity adjustment + remove
- Checkout page `/checkout` with single-page form (contact + shipping + billing + delivery method)
- Stripe Checkout Session creation with order draft + tax rate
- Order confirmation page `/commande-confirmee/[orderNumber]`
- Account section under `(account)` route group : dashboard, addresses CRUD, orders list, order detail

### Admin flow
- `/admin/*` protected by `role === 'admin'` check
- Dashboard with 7 KPI cards
- Products CRUD with strict 4-locale (FR/NL/DE/EN) translations validated by Zod
- Image upload via Vercel Blob (set primary + delete)
- Categories CRUD with 4-locale translations
- Orders list + detail with "Mark shipped" action + automatic tracking email
- Shipping rates editor (bpost Express tiers)

### Infrastructure
- Stripe webhook `/api/webhooks/stripe` with HMAC signature verification + idempotency via `stripe_webhook_events` table
- Resend transactional emails (`OrderConfirmation` + `OrderShipped`) wired into webhook + admin actions
- 10 new DB tables + 2 enums migrated on Neon (categories, category_translations, product_translations, product_images, addresses, carts, cart_items, order_items, shipping_rates, stripe_webhook_events)
- Order number sequence `BCT-YYYY-NNNNNN`
- Server Actions throughout (no custom API routes except the Stripe webhook)

### Tests
- **Vitest** : 25 passing (sanity, DB queries, slug/order-number/totals/shipping helpers, cart-actions integration, webhook signature, webhook idempotency, ProductSchema 4-locale validation)
- **Playwright E2E** : 10 passing, 3 skipped
  - Passing : home FR/NL/DE/EN, root redirect, auth sign-in form, check-email view, /compte redirect-to-sign-in, catalog browse + add to cart, out-of-stock badge
  - Skipped (pending manual setup) : full Stripe checkout (needs real `sk_test_*`), admin product form validation (needs storage state), admin mark-shipped (needs paid test order)

## What's NOT yet activated in production

These are the manual steps Jean-Baptiste needs to do before Phase 1 is live:

1. **Stripe account setup** (1× — one-off)
   - Activate Bancontact + Card in Stripe Dashboard → Payment methods
   - Create Tax Rate : 6 % inclusive, type VAT, country BE, name "TVA Belgique 6% Alimentation". Copy the `txr_xxx`.
   - Copy `sk_test_xxx`, `pk_test_xxx` (test mode first), eventually `sk_live_xxx` for prod

2. **Vercel Blob token**
   - Vercel dashboard → Storage → Create a Blob store named `beecuit-images`
   - Copy `BLOB_READ_WRITE_TOKEN`

3. **Update `.env.local`** with real values, replacing the 5 placeholders :
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_TAX_RATE_ID`
   - `BLOB_READ_WRITE_TOKEN`
   - `STRIPE_WEBHOOK_SECRET` (left until step 5)

4. **Merge `phase-1-ecommerce-base` → `main` + push**
   ```powershell
   git checkout main
   git merge phase-1-ecommerce-base
   git push origin main
   ```
   This triggers a Vercel production deploy.

5. **Configure Stripe webhook on prod**
   - Stripe Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://beecuit.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`
   - Copy the signing secret (`whsec_xxx`)
   - Add it as `STRIPE_WEBHOOK_SECRET` in Vercel project env vars (Production + Preview + Development)

6. **Add the 5 new Phase 1 env vars to Vercel** (Production, Preview, Development) :
   - `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_TAX_RATE_ID`, `BLOB_READ_WRITE_TOKEN`

7. **Production smoke test** (~10 min)
   - `https://beecuit.vercel.app/` redirects to `/fr`
   - `/fr/biscuits` shows the 8 seeded products
   - Add to cart → cart icon badge shows count
   - Checkout form → "Payer avec Stripe" → Stripe Checkout page
   - Use real test card `4242 4242 4242 4242`, future expiry, any CVC → pay
   - Redirected to `/fr/commande-confirmee/BCT-...`
   - Confirmation email arrives at the email used at checkout (check Resend dashboard https://resend.com/emails)
   - Login as admin → `/admin/commandes` shows the new order → mark as shipped with bpost tracking number → shipped email arrives

8. **Optional polish before launch**
   - Replace `picsum.photos` placeholder images with real product photos via the admin image uploader
   - Verify Resend domain (currently `onboarding@resend.dev`) — for proper deliverability, switch to a verified domain like `noreply@beecuit.be` (requires DNS records)
   - Restore `revalidate = 60` on `/biscuits` for ISR caching (was changed to `force-dynamic` during Task 26 debugging)

## Issues caught + fixed during Task 26 E2E setup

- Apostrophe ESLint rule broke the dev server on all routes (one HTML-entity escape)
- Cart cookie `secure: true` prevented cookie storage on `http://localhost` in dev (now env-conditional)
- ISR `revalidate = 60` on the catalog page caused Next.js 15 dev mode to attempt static path generation and 500 (switched to `force-dynamic`; revisit for prod caching post-Phase 1)

## Open deferred items (acknowledged, not blockers)

- Hardening DB constraints flagged in Task 3 review (FK on products.categoryId, CHECK on cart_items.quantity > 0, partial unique on product_images.isPrimary, etc.) — defer to Phase 5 hardening pass
- Admin storage state for E2E tests (Phase 5)
- 2FA TOTP for admin (Phase 5)
- Real Resend domain verification (Phase 5)
- Sentry + PostHog (Phase 4-5)

## Stats

- Commits on `phase-1-ecommerce-base` : 27
- LOC added : ~5800 (lib + components + pages + tests)
- Tests added : Vitest 22 new, Playwright 5 new files (10 active + 3 skipped)
- Estimation initiale spec : 4-5 sem solo. Réel avec subagent-driven : ~5 h de session (très dense, beaucoup de subagents).

## Next phase

When prod smoke test passes + at least 3 real test purchases have completed end-to-end :

→ Phase 2 — Coffrets pré-composés + Abonnement + B2B + livraison étendue (bpost points retrait, Mondial Relay, Click & Collect).
