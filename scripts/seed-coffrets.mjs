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

const PHOTOS = {
  decouverte: [
    "https://images.unsplash.com/photo-1634188023615-7e08901193b6?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1598839950984-034f6dc7b495?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  ],
  gourmand: [
    "https://images.unsplash.com/photo-1676292943577-65f74f4a52e2?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1491821893533-80f535044695?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  ],
  chocolat: [
    "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1573829831297-2038252d19e3?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  ],
  sansGluten: [
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1665844190955-692de472faeb?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  ],
};

const COFFRETS = [
  {
    sku: "COF-DECO-006",
    weightGrams: 350,
    discountPercent: 15,
    photos: PHOTOS.decouverte,
    name: "Coffret Découverte",
    slug: "coffret-decouverte",
    shortDesc: "Une sélection panachée pour découvrir l'univers BeeCuit.",
    longDesc:
      "Spéculoos artisanal, cookies pépites chocolat, sablés au beurre — l'introduction parfaite à notre savoir-faire liégeois. Présenté dans une boîte kraft élégante, prêt à offrir.",
    contents: [
      { sku: "BCT-SPEC-200", qty: 2 },
      { sku: "BCT-COOK-CHOC-250", qty: 2 },
      { sku: "BCT-GALE-BEUR-150", qty: 2 },
    ],
  },
  {
    sku: "COF-GOUR-012",
    weightGrams: 700,
    discountPercent: 20,
    photos: PHOTOS.gourmand,
    name: "Coffret Gourmand",
    slug: "coffret-gourmand",
    shortDesc: "12 biscuits pour les vrais amateurs.",
    longDesc:
      "Cookies pépites chocolat, macarons noisette du Piémont, florentins amandes. Un assortiment généreux pour les passionnés.",
    contents: [
      { sku: "BCT-COOK-CHOC-250", qty: 4 },
      { sku: "BCT-MACA-NOIS-006", qty: 4 },
      { sku: "BCT-FLOR-AMAN-200", qty: 4 },
    ],
  },
  {
    sku: "COF-CHOC-012",
    weightGrams: 650,
    discountPercent: 18,
    photos: PHOTOS.chocolat,
    name: "Coffret Chocolat",
    slug: "coffret-chocolat",
    shortDesc: "Tout pour les amoureux du chocolat.",
    longDesc:
      "Sablés au chocolat noir belge, cookies pépites chocolat, florentins enrobés. Une orgie de cacao.",
    contents: [
      { sku: "BCT-SABL-CHOC-180", qty: 6 },
      { sku: "BCT-COOK-CHOC-250", qty: 4 },
      { sku: "BCT-FLOR-AMAN-200", qty: 2 },
    ],
  },
  {
    sku: "COF-SG-006",
    weightGrams: 350,
    discountPercent: 12,
    photos: PHOTOS.sansGluten,
    name: "Coffret Sans Gluten",
    slug: "coffret-sans-gluten",
    shortDesc: "Tout le goût, sans le gluten.",
    longDesc:
      "Spéculoos sans gluten et macarons noisette pour les régimes spéciaux qui ne renoncent pas au plaisir.",
    contents: [
      { sku: "BCT-SPEC-SG-180", qty: 4 },
      { sku: "BCT-MACA-NOIS-006", qty: 2 },
    ],
  },
];

const LOCALES = ["fr", "nl", "en", "de"];

(async () => {
  const allBiscuits = await sql`SELECT id, sku FROM products WHERE type = 'biscuit'`;
  const skuToId = Object.fromEntries(allBiscuits.map((b) => [b.sku, b.id]));

  for (const c of COFFRETS) {
    console.log(`\n→ ${c.sku} (${c.name})`);
    const existing = await sql`SELECT id FROM products WHERE sku = ${c.sku}`;
    if (existing.length > 0) {
      console.log("  ↳ already exists, skip");
      continue;
    }

    const [prod] = await sql`
      INSERT INTO products (type, sku, base_price_cents, weight_grams, stock_quantity, discount_percent, is_active, is_featured)
      VALUES ('coffret', ${c.sku}, 0, ${c.weightGrams}, 0, ${c.discountPercent}, true, true)
      RETURNING id
    `;
    console.log("  ↳ product inserted", prod.id);

    for (const loc of LOCALES) {
      await sql`
        INSERT INTO product_translations
          (product_id, locale, name, slug, short_description, long_description, ingredients, allergens, nutritional_facts_per_100g, seo_title, seo_description)
        VALUES (
          ${prod.id}, ${loc}, ${c.name}, ${loc === "fr" ? c.slug : c.slug + "-" + loc},
          ${c.shortDesc}, ${c.longDesc}, '—', ARRAY[]::text[],
          '{"energy_kcal":0,"fat_g":0,"carbs_g":0,"protein_g":0,"salt_g":0}'::jsonb,
          ${c.name}, ${c.shortDesc}
        )
      `;
    }
    console.log("  ↳ 4 translations inserted");

    for (const item of c.contents) {
      const biscuitId = skuToId[item.sku];
      if (!biscuitId) {
        console.log(`  ⚠ biscuit ${item.sku} not found, skip`);
        continue;
      }
      await sql`INSERT INTO coffret_contents (coffret_id, biscuit_id, quantity) VALUES (${prod.id}, ${biscuitId}, ${item.qty})`;
    }
    console.log(`  ↳ ${c.contents.length} contents inserted`);

    for (let i = 0; i < c.photos.length; i++) {
      await sql`
        INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
        VALUES (${prod.id}, ${c.photos[i]}, ${c.name}, ${i}, ${i === 0})
      `;
    }
    console.log(`  ↳ ${c.photos.length} photos inserted`);
  }

  console.log("\nDone.");
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
