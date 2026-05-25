#!/usr/bin/env node
/**
 * Updates coffret images in-place (the seed-coffrets script is skip-if-exists,
 * so editing PHOTOS in source has no effect on an already-seeded DB without
 * this patch). Idempotent: re-running re-applies the same URLs.
 *
 * Photos visuellement validées (inspection JPEG locale) après que le user a
 * signalé que les images d'origine étaient absurdes (portrait, AirPods, soupe).
 */
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

const u = (id) =>
  `https://images.unsplash.com/photo-${id}?fm=jpg&q=75&w=1200&auto=format&fit=crop`;

const MAPPING = {
  "COF-DECO-005": {
    alt: "Assortiment de biscuits artisanaux Au Fil des Saveurs",
    urls: [u("1558961363-fa8fdf82db35"), u("1499636136210-6f4ee915583e")],
  },
  "COF-GOUR-010": {
    alt: "Grande sélection de biscuits gourmands Au Fil des Saveurs",
    urls: [u("1499636136210-6f4ee915583e"), u("1558961363-fa8fdf82db35")],
  },
  "COF-SPAV-003": {
    alt: "Coffret spéculoos et biscuit avoine artisanaux",
    urls: [u("1606058492835-ceaef4cd2bc2"), u("1517686469429-8bdb88b9f907")],
  },
};

(async () => {
  let updated = 0;
  for (const [sku, { alt, urls }] of Object.entries(MAPPING)) {
    const [product] = await sql`SELECT id FROM products WHERE sku = ${sku}`;
    if (!product) {
      console.log(`  ! sku ${sku} not found, skip`);
      continue;
    }
    await sql`DELETE FROM product_images WHERE product_id = ${product.id}`;
    await sql`
      INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
      VALUES
        (${product.id}, ${urls[0]}, ${alt}, 0, true),
        (${product.id}, ${urls[1]}, ${alt}, 1, false)
    `;
    console.log(`  ✓ ${sku}`);
    updated++;
  }
  console.log(`\nDone — ${updated} coffrets updated.`);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
