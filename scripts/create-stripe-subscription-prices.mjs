#!/usr/bin/env node
// One-off setup: creates 1 Stripe Product per format + 9 Prices (3 formats × 3 engagements).
// Idempotent (re-uses existing Stripe Product if found via metadata).
// Outputs 9 env var lines to copy into .env.local + Vercel envs.

import fs from "node:fs";
import Stripe from "stripe";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z_]+)="(.*)"\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);

if (!env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY not found in .env.local");
  process.exit(1);
}
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

// Tailles et prix rebasés 2026-05-25 pour cibler 25-28 €/kg
// (cohérence avec le nouveau catalogue 5 produits à ~27.50 €/kg).
// 1 « biscuit » dans un abonnement = 1 sachet/boîte du catalogue (180-200g).
const FORMATS = {
  MINI: { sizeLabel: "2 sachets", baseCents: 1050 },
  CLASSIQUE: { sizeLabel: "4 sachets", baseCents: 2090 },
  FAMILLE: { sizeLabel: "8 sachets", baseCents: 3990 },
};
const ENGAGEMENTS = {
  NONE: { months: 0, discount: 0 },
  "6M": { months: 6, discount: 5 },
  "12M": { months: 12, discount: 10 },
};

(async () => {
  const products = {};
  for (const [fk, f] of Object.entries(FORMATS)) {
    const slug = fk.toLowerCase();
    const search = await stripe.products.search({
      query: `metadata['beecuit_subscription']:'${slug}'`,
    });
    if (search.data[0]) {
      products[fk] = search.data[0].id;
      console.log(`reuse product ${fk}: ${products[fk]}`);
      continue;
    }
    const p = await stripe.products.create({
      name: `Abonnement Au Fil des Saveurs ${fk[0]}${fk.slice(1).toLowerCase()} (${f.sizeLabel}/mois)`,
      metadata: { beecuit_subscription: slug },
    });
    products[fk] = p.id;
    console.log(`created product ${fk}: ${p.id}`);
  }

  const out = [];
  for (const [fk, f] of Object.entries(FORMATS)) {
    for (const [ek, e] of Object.entries(ENGAGEMENTS)) {
      const amount = Math.round(f.baseCents * (1 - e.discount / 100));
      const price = await stripe.prices.create({
        product: products[fk],
        unit_amount: amount,
        currency: "eur",
        recurring: { interval: "month" },
        tax_behavior: "inclusive",
        metadata: { format: fk.toLowerCase(), engagement_months: String(e.months) },
        nickname: `${fk} ${ek} (${amount / 100} €)`,
      });
      console.log(`  price ${fk}_${ek}: ${price.id} = ${amount / 100} €`);
      out.push(`STRIPE_PRICE_${fk}_${ek}="${price.id}"`);
    }
  }

  console.log("\n=== Paste into .env.local AND Vercel envs ===\n");
  console.log(out.join("\n"));
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
