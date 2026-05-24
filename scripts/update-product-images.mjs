#!/usr/bin/env node
// Replaces placeholder picsum.photos URLs with curated Unsplash photos matching biscuit descriptions.
// Reads DATABASE_URL from .env.local. Idempotent (delete + re-insert per product).

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

// Each entry: SKU -> ordered [primaryUrl, secondaryUrl] + altText.
// URLs are Unsplash CDN, w=1200 for product detail, hotlink-friendly.
const u = (id, ix) =>
  `https://images.unsplash.com/photo-${id}?fm=jpg&q=75&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=${ix}`;

const MAPPING = {
  "BCT-COOK-CHOC-250": {
    alt: "Cookies pépites chocolat sur plan de travail bois",
    urls: [
      u("1499636136210-6f4ee915583e", "M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2hvY29sYXRlJTIwY2hpcCUyMGNvb2tpZXN8ZW58MHx8MHx8fDA%3D"),
      u("1558961363-fa8fdf82db35", "M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2hvY29sYXRlJTIwY2hpcCUyMGNvb2tpZXN8ZW58MHx8MHx8fDA%3D"),
    ],
  },
  "BCT-FLOR-AMAN-200": {
    alt: "Florentins aux amandes nappés de chocolat noir",
    urls: [
      u("1743623173731-37b6d72a01c2", "M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmxvcmVudGluZSUyMGNvb2tpZXxlbnwwfHwwfHx8MA%3D%3D"),
      u("1726733969863-c5544cde7186", "M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZmxvcmVudGluZSUyMGNvb2tpZXxlbnwwfHwwfHx8MA%3D%3D"),
    ],
  },
  "BCT-GALE-BEUR-150": {
    alt: "Galettes pur beurre fermier, dorées",
    urls: [
      u("1611082191524-1c049443f288", "M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YnV0dGVyJTIwY29va2llfGVufDB8fDB8fHww"),
      u("1511730609347-730e2da3da59", "M3wxMjA3fDB8MHxzZWFyY2h8M3x8YnV0dGVyJTIwY29va2llfGVufDB8fDB8fHww"),
    ],
  },
  "BCT-MACA-NOIS-006": {
    alt: "Macarons à la noisette du Piémont",
    urls: [
      u("1558326567-98ae2405596b", "M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWFjYXJvbnxlbnwwfHwwfHx8MA%3D%3D"),
      u("1558024920-b41e1887dc32", "M3wxMjA3fDB8MHxzZWFyY2h8M3x8bWFjYXJvbnxlbnwwfHwwfHx8MA%3D%3D"),
    ],
  },
  "BCT-SABL-CHOC-180": {
    alt: "Sablés fondants au chocolat noir belge",
    urls: [
      u("1694349494624-386eb9c633bb", "M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2hvY29sYXRlJTIwc2hvcnRicmVhZHxlbnwwfHwwfHx8MA%3D%3D"),
      u("1573829831297-2038252d19e3", "M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2hvY29sYXRlJTIwc2hvcnRicmVhZHxlbnwwfHwwfHx8MA%3D%3D"),
    ],
  },
  "BCT-SPEC-200": {
    alt: "Spéculoos artisanal belge, croustillant et épicé",
    urls: [
      u("1606058492835-ceaef4cd2bc2", "M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BlY3Vsb29zfGVufDB8fDB8fHww"),
      u("1665844190955-692de472faeb", "M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3BlY3Vsb29zfGVufDB8fDB8fHww"),
    ],
  },
  "BCT-SPEC-SG-180": {
    alt: "Spéculoos sans gluten, texture croustillante",
    urls: [
      // ordre inversé pour différencier visuellement de SPEC-200
      u("1665844190955-692de472faeb", "M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3BlY3Vsb29zfGVufDB8fDB8fHww"),
      u("1606058492835-ceaef4cd2bc2", "M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BlY3Vsb29zfGVufDB8fDB8fHww"),
    ],
  },
  "BCT-SPRI-VANI-200": {
    alt: "Sablés Spritz en forme d'étoile, parfumés à la vanille",
    urls: [
      u("1643493969852-38c266c2333d", "M3wxMjA3fDB8MHxzZWFyY2h8MXx8c3ByaXR6JTIwY29va2llfGVufDB8fDB8fHww"),
      u("1643493969809-63c876a7a582", "M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3ByaXR6JTIwY29va2llfGVufDB8fDB8fHww"),
    ],
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
  console.log(`\nDone — ${updated} products updated.`);
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
