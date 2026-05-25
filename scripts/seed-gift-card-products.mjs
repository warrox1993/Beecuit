#!/usr/bin/env node
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z_]+)="(.*)"\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const sql = neon(env.DATABASE_URL);

const TIERS = [
  { sku: "GIFT-015", cents: 1500, label: "15 €" },
  { sku: "GIFT-025", cents: 2500, label: "25 €" },
  { sku: "GIFT-050", cents: 5000, label: "50 €" },
  { sku: "GIFT-075", cents: 7500, label: "75 €" },
  { sku: "GIFT-100", cents: 10000, label: "100 €" },
];
const LOCALES = ["fr", "nl", "en", "de"];

(async () => {
  for (const t of TIERS) {
    const existing = await sql`SELECT id FROM products WHERE sku = ${t.sku}`;
    if (existing.length > 0) {
      console.log(`skip ${t.sku}`);
      continue;
    }
    const [prod] = await sql`
      INSERT INTO products (type, sku, base_price_cents, weight_grams, stock_quantity, is_active, is_featured)
      VALUES ('gift_card', ${t.sku}, ${t.cents}, 0, 999999, true, false)
      RETURNING id
    `;
    for (const loc of LOCALES) {
      const slug = "carte-cadeau-" + t.cents / 100 + "-euros" + (loc === "fr" ? "" : "-" + loc);
      const name = "Carte cadeau " + t.label;
      const desc =
        "Une carte cadeau Au Fil des Saveurs de " +
        t.label +
        " à offrir par email. Valable 12 mois sur tous les biscuits et coffrets.";
      await sql`
        INSERT INTO product_translations
          (product_id, locale, name, slug, short_description, long_description, ingredients, allergens, nutritional_facts_per_100g, seo_title, seo_description)
        VALUES (
          ${prod.id}, ${loc},
          ${name}, ${slug},
          ${"Carte cadeau Au Fil des Saveurs " + t.label}, ${desc},
          '—', ARRAY[]::text[],
          '{"energy_kcal":0,"fat_g":0,"carbs_g":0,"protein_g":0,"salt_g":0}'::jsonb,
          ${name + " Au Fil des Saveurs"},
          ${"Carte cadeau " + t.label + " Au Fil des Saveurs à offrir, valable 12 mois"}
        )
      `;
    }
    console.log(`✓ ${t.sku}`);
  }
  console.log("\nDone.");
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
