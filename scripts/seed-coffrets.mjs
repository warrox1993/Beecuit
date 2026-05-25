#!/usr/bin/env node
/**
 * Seed coffrets — Au Fil des Saveurs.
 *
 * 3 coffrets validés par la cliente (mai 2026) :
 *   - COF-DECO-005    Découverte           1× chaque biscuit (5 unités)   -15%
 *   - COF-GOUR-010    Gourmand             2× chaque biscuit (10 unités)  -20%
 *   - COF-SPAV-003    Spéculoos & Avoine   1× spec gros + petit + avoine  -12%
 *
 * Idempotent : ne re-crée pas un coffret qui existe déjà.
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

// Photos visuellement validées (inspection JPEG locale) : assiette/bol de
// biscuits gourmands plutôt que les anciens placeholders Unsplash random qui
// retournaient portraits, AirPods, soupe, etc. (les IDs HEAD-200 OK ne
// garantissent JAMAIS le contenu visuel — vérifier les bytes systématiquement).
const PHOTOS = {
  decouverte: [
    // bol de cookies aux pépites sur tissu sombre — mood cosy gourmand
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    // cookies aux pépites étalés sur papier sulfurisé, vue de dessus
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  ],
  gourmand: [
    // cookies abondance top-view (format gourmand 10 pièces)
    "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    // bol cookies tissu sombre (ordre inversé vs Découverte pour différencier)
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  ],
  spav: [
    // spéculoos artisanal belge (validé Phase 1 + biscuit Spec Gros)
    "https://images.unsplash.com/photo-1606058492835-ceaef4cd2bc2?fm=jpg&q=75&w=1200&auto=format&fit=crop",
    // biscuit avoine épais sur lin (validé sur la fiche produit Avoine)
    "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  ],
};

const COFFRETS = [
  {
    sku: "COF-DECO-005",
    weightGrams: 960, // 200+200+180+180+200
    discountPercent: 15,
    photos: PHOTOS.decouverte,
    isFeatured: true,
    translations: {
      fr: {
        name: "Coffret Découverte",
        slug: "coffret-decouverte",
        shortDesc:
          "Un panaché de nos 5 biscuits pour découvrir toute la maison Au Fil des Saveurs.",
        longDesc:
          "Le coffret idéal pour offrir ou pour se faire plaisir une première fois : un de chaque — grands et petits spéculoos, rochers coco chocolat et nature, biscuit avoine. Présenté dans une boîte kraft élégante avec ruban naturel, prêt à offrir. Remise -15% sur le prix au détail.",
      },
      nl: {
        name: "Ontdekkingsdoos",
        slug: "ontdekkingsdoos",
        shortDesc:
          "Een proeverij van onze 5 koekjes om het hele huis Au Fil des Saveurs te ontdekken.",
        longDesc:
          "De ideale doos om te schenken of zichzelf voor het eerst te trakteren: één van elk — grote en kleine speculoos, kokosrotsjes chocolade en naturel, haverkoekje. Gepresenteerd in een elegante kraftdoos met natuurlijk lint, klaar om te schenken. -15% korting op de detailprijs.",
      },
      de: {
        name: "Entdeckungs-Box",
        slug: "entdeckungs-box",
        shortDesc:
          "Eine Auswahl unserer 5 Kekse, um das ganze Haus Au Fil des Saveurs zu entdecken.",
        longDesc:
          "Die ideale Box zum Verschenken oder um sich selbst ein erstes Mal etwas zu gönnen: einer von jedem — große und kleine Spekulatius, Kokosmakronen Schokolade und natur, Haferkeks. In einer eleganten Kraftschachtel mit Naturband präsentiert, fertig zum Verschenken. -15% Rabatt auf den Einzelpreis.",
      },
      en: {
        name: "Discovery Box",
        slug: "discovery-box",
        shortDesc:
          "A medley of our 5 biscuits to discover all of Au Fil des Saveurs.",
        longDesc:
          "The ideal box to gift — or to treat yourself for the first time: one of each — large and small speculoos, chocolate and natural coconut rocks, oat biscuit. Presented in an elegant kraft box with natural ribbon, ready to gift. 15% off the retail price.",
      },
    },
    contents: [
      { sku: "BCT-SPEC-GROS-200", qty: 1 },
      { sku: "BCT-SPEC-PETIT-200", qty: 1 },
      { sku: "BCT-COCO-CHOC-180", qty: 1 },
      { sku: "BCT-COCO-NATU-180", qty: 1 },
      { sku: "BCT-AVOI-200", qty: 1 },
    ],
  },
  {
    sku: "COF-GOUR-010",
    weightGrams: 1920, // 2× chaque
    discountPercent: 20,
    photos: PHOTOS.gourmand,
    isFeatured: true,
    translations: {
      fr: {
        name: "Coffret Gourmand",
        slug: "coffret-gourmand",
        shortDesc:
          "Le grand format pour les vrais amateurs : 2× chaque biscuit, près de 2 kg de plaisir.",
        longDesc:
          "Pour les passionnés et les grandes tablées : deux sachets/boîtes de chacun de nos 5 biscuits. Près de 2 kg de gourmandise artisanale liégeoise, présentée dans une boîte kraft double épaisseur avec ruban. Le format idéal pour un cadeau d'entreprise, un anniversaire, ou simplement pour ne plus tomber en rupture trop vite. Remise -20% sur le prix au détail.",
      },
      nl: {
        name: "Gourmand-Doos",
        slug: "gourmand-doos",
        shortDesc:
          "Het grote formaat voor echte liefhebbers: 2× elk koekje, bijna 2 kg genot.",
        longDesc:
          "Voor passionnels en grote tafelgezelschappen: twee zakken/dozen van elk van onze 5 koekjes. Bijna 2 kg ambachtelijk Luiks genot, gepresenteerd in een dubbel-dikke kraftdoos met lint. Het ideale formaat voor een bedrijfsgeschenk, een verjaardag, of gewoon om niet te snel zonder te zitten. -20% korting op de detailprijs.",
      },
      de: {
        name: "Genießer-Box",
        slug: "geniesser-box",
        shortDesc:
          "Das große Format für echte Liebhaber: 2× jeder Keks, fast 2 kg Genuss.",
        longDesc:
          "Für Liebhaber und große Tafelrunden: zwei Beutel/Schachteln von jedem unserer 5 Kekse. Fast 2 kg handwerklicher Lütticher Genuss, in einer doppelt dicken Kraftschachtel mit Band präsentiert. Das ideale Format für ein Firmengeschenk, einen Geburtstag oder einfach um nicht zu schnell aufzubrauchen. -20% Rabatt auf den Einzelpreis.",
      },
      en: {
        name: "Gourmand Box",
        slug: "gourmand-box",
        shortDesc:
          "The large format for true enthusiasts: 2× each biscuit, nearly 2 kg of pleasure.",
        longDesc:
          "For enthusiasts and big tables: two bags/boxes of each of our 5 biscuits. Nearly 2 kg of artisan Liège indulgence, presented in a double-thick kraft box with ribbon. The ideal format for a corporate gift, a birthday, or simply not to run out too quickly. 20% off the retail price.",
      },
    },
    contents: [
      { sku: "BCT-SPEC-GROS-200", qty: 2 },
      { sku: "BCT-SPEC-PETIT-200", qty: 2 },
      { sku: "BCT-COCO-CHOC-180", qty: 2 },
      { sku: "BCT-COCO-NATU-180", qty: 2 },
      { sku: "BCT-AVOI-200", qty: 2 },
    ],
  },
  {
    sku: "COF-SPAV-003",
    weightGrams: 600, // 200+200+200
    discountPercent: 12,
    photos: PHOTOS.spav,
    isFeatured: false,
    translations: {
      fr: {
        name: "Coffret Spéculoos & Avoine",
        slug: "coffret-speculoos-avoine",
        shortDesc:
          "Le trio des classiques : 1 spéculoos gros + 1 spéculoos petit + 1 biscuit avoine.",
        longDesc:
          "Le coffret pensé pour ceux qui aiment les biscuits secs traditionnels. Réunit nos deux formats de spéculoos (grand pour le café, petit pour le thé) et notre biscuit avoine rustique pour le petit-déjeuner. Sans coco, sans chocolat — uniquement les fondamentaux. Présenté dans une boîte kraft avec ruban. Remise -12% sur le prix au détail.",
      },
      nl: {
        name: "Doos Speculoos & Haver",
        slug: "doos-speculoos-haver",
        shortDesc:
          "Het trio van klassiekers: 1 grote speculoos + 1 kleine speculoos + 1 haverkoekje.",
        longDesc:
          "De doos bedacht voor wie van traditionele droge koekjes houdt. Verenigt onze twee speculoos-formaten (groot voor de koffie, klein voor de thee) en ons rustieke haverkoekje voor het ontbijt. Zonder kokos, zonder chocolade — alleen de basics. Gepresenteerd in een kraftdoos met lint. -12% korting op de detailprijs.",
      },
      de: {
        name: "Box Spekulatius & Hafer",
        slug: "box-spekulatius-hafer",
        shortDesc:
          "Das Trio der Klassiker: 1 großer Spekulatius + 1 kleiner Spekulatius + 1 Haferkeks.",
        longDesc:
          "Die Box für Liebhaber traditioneller trockener Kekse. Vereint unsere beiden Spekulatius-Formate (groß zum Kaffee, klein zum Tee) und unseren rustikalen Haferkeks zum Frühstück. Ohne Kokos, ohne Schokolade — nur die Grundlagen. In einer Kraftschachtel mit Band präsentiert. -12% Rabatt auf den Einzelpreis.",
      },
      en: {
        name: "Speculoos & Oat Box",
        slug: "speculoos-oat-box",
        shortDesc:
          "The classic trio: 1 large speculoos + 1 small speculoos + 1 oat biscuit.",
        longDesc:
          "The box for lovers of traditional dry biscuits. Brings together our two speculoos formats (large for coffee, small for tea) and our rustic oat biscuit for breakfast. No coconut, no chocolate — just the fundamentals. Presented in a kraft box with ribbon. 12% off the retail price.",
      },
    },
    contents: [
      { sku: "BCT-SPEC-GROS-200", qty: 1 },
      { sku: "BCT-SPEC-PETIT-200", qty: 1 },
      { sku: "BCT-AVOI-200", qty: 1 },
    ],
  },
];

const LOCALES = ["fr", "nl", "en", "de"];

(async () => {
  const allBiscuits = await sql`SELECT id, sku FROM products WHERE type = 'biscuit'`;
  const skuToId = Object.fromEntries(allBiscuits.map((b) => [b.sku, b.id]));

  for (const c of COFFRETS) {
    console.log(`\n→ ${c.sku} (${c.translations.fr.name})`);
    const existing = await sql`SELECT id FROM products WHERE sku = ${c.sku}`;
    if (existing.length > 0) {
      console.log("  ↳ already exists, skip");
      continue;
    }

    const [prod] = await sql`
      INSERT INTO products (type, sku, base_price_cents, weight_grams, stock_quantity, discount_percent, is_active, is_featured)
      VALUES ('coffret', ${c.sku}, 0, ${c.weightGrams}, 0, ${c.discountPercent}, true, ${c.isFeatured})
      RETURNING id
    `;
    console.log("  ↳ product inserted", prod.id);

    for (const loc of LOCALES) {
      const t = c.translations[loc];
      await sql`
        INSERT INTO product_translations
          (product_id, locale, name, slug, short_description, long_description, ingredients, allergens, nutritional_facts_per_100g, seo_title, seo_description)
        VALUES (
          ${prod.id}, ${loc}, ${t.name}, ${t.slug},
          ${t.shortDesc}, ${t.longDesc}, '—', ARRAY[]::text[],
          '{"energy_kcal":0,"fat_g":0,"carbs_g":0,"protein_g":0,"salt_g":0}'::jsonb,
          ${t.name}, ${t.shortDesc}
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
        VALUES (${prod.id}, ${c.photos[i]}, ${c.translations.fr.name}, ${i}, ${i === 0})
      `;
    }
    console.log(`  ↳ ${c.photos.length} photos inserted`);
  }

  console.log("\nDone.");
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
