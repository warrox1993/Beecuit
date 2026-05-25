// Catalog seed data — Au Fil des Saveurs.
//
// Nouveau catalogue 2026-05-25 : 5 produits validés par la cliente, 3 catégories.
// Cible prix : ~27,50 €/kg avec arrondi psychologique (.50/.90).
//
// Le seed (scripts/seed/index.ts) utilise IMAGE_URLS pour insérer les vraies photos
// Unsplash directement, sans passer par picsum.photos + un script de patch.

export const CATEGORIES = [
  {
    slug: "speculoos",
    names: { fr: "Spéculoos", nl: "Speculoos", de: "Spekulatius", en: "Speculoos" },
  },
  {
    slug: "coco",
    names: { fr: "Rochers Coco", nl: "Kokosrotsjes", de: "Kokosmakronen", en: "Coconut Rocks" },
  },
  {
    slug: "avoine",
    names: { fr: "Avoine", nl: "Haver", de: "Hafer", en: "Oat" },
  },
] as const;

type Trans = {
  name: string;
  shortDescription: string;
  longDescription: string;
  ingredients: string;
  allergens: string[];
  seoTitle: string;
  seoDescription: string;
};

type Image = { url: string; altText: string };

export const PRODUCTS: Array<{
  sku: string;
  categorySlug: string;
  basePriceCents: number;
  weightGrams: number;
  stockQuantity: number;
  isFeatured: boolean;
  nutritionalFactsPer100g: {
    energy_kcal: number;
    fat_g: number;
    carbs_g: number;
    protein_g: number;
    salt_g: number;
  };
  translations: Record<"fr" | "nl" | "de" | "en", Trans>;
  images: [Image, Image];
}> = [
  // ──────────────────────────────────────────────────────────────────────────
  // BCT-SPEC-GROS-200 — Spéculoos gros 200g
  // ──────────────────────────────────────────────────────────────────────────
  {
    sku: "BCT-SPEC-GROS-200",
    categorySlug: "speculoos",
    basePriceCents: 550,
    weightGrams: 200,
    stockQuantity: 50,
    isFeatured: true,
    nutritionalFactsPer100g: {
      energy_kcal: 468,
      fat_g: 18.5,
      carbs_g: 70.0,
      protein_g: 6.2,
      salt_g: 0.55,
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1606058492835-ceaef4cd2bc2?fm=jpg&q=75&w=1200&auto=format&fit=crop",
        altText: "Grands spéculoos belges artisanaux, dorés et croustillants",
      },
      {
        url: "https://images.unsplash.com/photo-1665844190955-692de472faeb?fm=jpg&q=75&w=1200&auto=format&fit=crop",
        altText: "Spéculoos disposés en éventail sur un plan de travail bois",
      },
    ],
    translations: {
      fr: {
        name: "Spéculoos Gros 200g",
        shortDescription:
          "Grands spéculoos belges aux épices traditionnelles — texture croustillante, casse franche, parfaits pour le café.",
        longDescription:
          "Nos grands spéculoos sont préparés selon une recette transmise par la cliente, à base de cassonade brune belge, de beurre fermier, de cannelle de Ceylan, de gingembre et de muscade fraîche. Cuits lentement sur des plaques épaisses pour développer cette croûte ambrée et ce parfum d'épices chaudes si reconnaissables. Format généreux : un seul biscuit suffit pour accompagner un café noir. Sachet kraft refermable de 200g pour préserver le croquant.",
        ingredients:
          "Farine de blé, cassonade brune, beurre (lait), épices (cannelle, gingembre, muscade, clou de girofle), levure chimique, sel.",
        allergens: ["Gluten", "Lait"],
        seoTitle: "Spéculoos Gros 200g artisanal belge — Au Fil des Saveurs",
        seoDescription:
          "Grands spéculoos belges artisanaux : cassonade brune, beurre fermier, épices traditionnelles. Cuits lentement, parfaits pour le café. Sachet 200g.",
      },
      nl: {
        name: "Grote Speculoos 200g",
        shortDescription:
          "Grote Belgische speculoos met traditionele specerijen — knapperige textuur, perfect bij de koffie.",
        longDescription:
          "Onze grote speculoos worden bereid volgens een familierecept, met Belgische bruine basterdsuiker, boerderijboter, Ceylonkaneel, gember en verse nootmuskaat. Langzaam gebakken op dikke platen om die karakteristieke amberkleur en het warme specerijenaroma te ontwikkelen. Royaal formaat: één koekje volstaat bij een zwarte koffie. Hersluitbare kraftzak van 200g om de knapperigheid te bewaren.",
        ingredients:
          "Tarwebloem, bruine basterdsuiker, boter (melk), specerijen (kaneel, gember, nootmuskaat, kruidnagel), rijsmiddel, zout.",
        allergens: ["Gluten", "Melk"],
        seoTitle: "Grote Speculoos 200g ambachtelijk Belgisch — Au Fil des Saveurs",
        seoDescription:
          "Grote ambachtelijke Belgische speculoos: bruine suiker, boerderijboter, traditionele specerijen. Langzaam gebakken, perfect bij de koffie. Zak 200g.",
      },
      de: {
        name: "Großer Spekulatius 200g",
        shortDescription:
          "Große belgische Spekulatius mit traditionellen Gewürzen — knusprige Textur, ideal zum Kaffee.",
        longDescription:
          "Unsere großen Spekulatius werden nach einem Familienrezept zubereitet, mit belgischem braunem Zucker, Bauernbutter, Ceylon-Zimt, Ingwer und frischer Muskatnuss. Langsam auf dicken Blechen gebacken, um die typische Bernsteinkrust und das warme Gewürzaroma zu entwickeln. Großzügiges Format: ein Keks reicht, um einen schwarzen Kaffee zu begleiten. Wiederverschließbarer Kraftbeutel mit 200g, der die Knusprigkeit bewahrt.",
        ingredients:
          "Weizenmehl, brauner Zucker, Butter (Milch), Gewürze (Zimt, Ingwer, Muskatnuss, Gewürznelke), Backtriebmittel, Salz.",
        allergens: ["Gluten", "Milch"],
        seoTitle: "Großer Spekulatius 200g handwerklich belgisch — Au Fil des Saveurs",
        seoDescription:
          "Großer handwerklicher belgischer Spekulatius: brauner Zucker, Bauernbutter, traditionelle Gewürze. Langsam gebacken, ideal zum Kaffee. Beutel 200g.",
      },
      en: {
        name: "Large Speculoos 200g",
        shortDescription:
          "Large Belgian speculoos with traditional spices — crisp texture, clean snap, perfect with coffee.",
        longDescription:
          "Our large speculoos are made to a recipe passed down by the owner, using Belgian brown sugar, farmhouse butter, Ceylon cinnamon, ginger and fresh nutmeg. Slow-baked on heavy plates to develop that signature amber crust and warm spice aroma. Generous size: a single biscuit is enough to enjoy alongside a black coffee. Resealable kraft bag, 200g, to keep them crisp.",
        ingredients:
          "Wheat flour, brown sugar, butter (milk), spices (cinnamon, ginger, nutmeg, clove), raising agent, salt.",
        allergens: ["Gluten", "Milk"],
        seoTitle: "Large Speculoos 200g artisan Belgian — Au Fil des Saveurs",
        seoDescription:
          "Large artisan Belgian speculoos: brown sugar, farmhouse butter, traditional spices. Slow-baked, perfect with coffee. 200g resealable bag.",
      },
    },
  },
  // ──────────────────────────────────────────────────────────────────────────
  // BCT-SPEC-PETIT-200 — Spéculoos petit 200g
  // ──────────────────────────────────────────────────────────────────────────
  {
    sku: "BCT-SPEC-PETIT-200",
    categorySlug: "speculoos",
    basePriceCents: 550,
    weightGrams: 200,
    stockQuantity: 50,
    isFeatured: true,
    nutritionalFactsPer100g: {
      energy_kcal: 470,
      fat_g: 18.8,
      carbs_g: 70.2,
      protein_g: 6.3,
      salt_g: 0.55,
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1665844190955-692de472faeb?fm=jpg&q=75&w=1200&auto=format&fit=crop",
        altText: "Petits spéculoos belges en empilement, prêts à accompagner un café",
      },
      {
        url: "https://images.unsplash.com/photo-1606058492835-ceaef4cd2bc2?fm=jpg&q=75&w=1200&auto=format&fit=crop",
        altText: "Petits spéculoos artisanaux disposés sur soucoupe blanche",
      },
    ],
    translations: {
      fr: {
        name: "Spéculoos Petit 200g",
        shortDescription:
          "La version mignonnette : petits spéculoos à croquer en une bouchée, même recette, mêmes épices.",
        longDescription:
          "Mêmes ingrédients que nos grands spéculoos — cassonade brune, beurre fermier, cannelle, gingembre, muscade — mais en format mini, parfait à grignoter, à servir avec une tasse à thé ou à émietter sur un yaourt nature. Idéal aussi pour les enfants : moins d'épaisseur, plus de croustillant, et la quantité parfaite pour un goûter sans excès. Sachet refermable de 200g.",
        ingredients:
          "Farine de blé, cassonade brune, beurre (lait), épices (cannelle, gingembre, muscade, clou de girofle), levure chimique, sel.",
        allergens: ["Gluten", "Lait"],
        seoTitle: "Spéculoos Petit format 200g artisanal — Au Fil des Saveurs",
        seoDescription:
          "Petits spéculoos belges artisanaux : même recette traditionnelle, format mini parfait à grignoter ou à servir avec le thé. Sachet 200g.",
      },
      nl: {
        name: "Kleine Speculoos 200g",
        shortDescription:
          "De mini-versie: kleine speculoos in één hap, zelfde recept, zelfde specerijen.",
        longDescription:
          "Dezelfde ingrediënten als onze grote speculoos — bruine basterdsuiker, boerderijboter, kaneel, gember, nootmuskaat — maar in miniformaat, perfect om te knabbelen, bij een kopje thee te serveren of over een natuuryoghurt te verkruimelen. Ook ideaal voor kinderen: dunner, knapperiger, de perfecte hoeveelheid voor een tussendoortje. Hersluitbare zak van 200g.",
        ingredients:
          "Tarwebloem, bruine basterdsuiker, boter (melk), specerijen (kaneel, gember, nootmuskaat, kruidnagel), rijsmiddel, zout.",
        allergens: ["Gluten", "Melk"],
        seoTitle: "Kleine Speculoos 200g ambachtelijk — Au Fil des Saveurs",
        seoDescription:
          "Kleine ambachtelijke Belgische speculoos: hetzelfde traditionele recept, miniformaat perfect om te knabbelen of bij de thee. Zak 200g.",
      },
      de: {
        name: "Kleiner Spekulatius 200g",
        shortDescription:
          "Die Mini-Version: kleine Spekulatius zum Knabbern, gleiches Rezept, gleiche Gewürze.",
        longDescription:
          "Dieselben Zutaten wie unsere großen Spekulatius — brauner Zucker, Bauernbutter, Zimt, Ingwer, Muskat — aber im Miniformat, perfekt zum Knabbern, zum Tee zu reichen oder über einen Naturjoghurt zu zerbröseln. Auch ideal für Kinder: dünner, knuspriger, die perfekte Menge für eine Zwischenmahlzeit. Wiederverschließbarer Beutel mit 200g.",
        ingredients:
          "Weizenmehl, brauner Zucker, Butter (Milch), Gewürze (Zimt, Ingwer, Muskatnuss, Gewürznelke), Backtriebmittel, Salz.",
        allergens: ["Gluten", "Milch"],
        seoTitle: "Kleiner Spekulatius 200g handwerklich — Au Fil des Saveurs",
        seoDescription:
          "Kleine handwerkliche belgische Spekulatius: gleiches traditionelles Rezept, Miniformat perfekt zum Knabbern oder zum Tee. Beutel 200g.",
      },
      en: {
        name: "Small Speculoos 200g",
        shortDescription:
          "The mini version: bite-size speculoos, same recipe, same spices.",
        longDescription:
          "Same ingredients as our large speculoos — brown sugar, farmhouse butter, cinnamon, ginger, nutmeg — but in miniature format, perfect to nibble, to serve with a cup of tea or to crumble over a plain yoghurt. Ideal too for children: thinner, crunchier, the perfect amount for a snack. 200g resealable bag.",
        ingredients:
          "Wheat flour, brown sugar, butter (milk), spices (cinnamon, ginger, nutmeg, clove), raising agent, salt.",
        allergens: ["Gluten", "Milk"],
        seoTitle: "Small Speculoos 200g artisan — Au Fil des Saveurs",
        seoDescription:
          "Small artisan Belgian speculoos: same traditional recipe, bite-size format perfect to nibble or serve with tea. 200g bag.",
      },
    },
  },
  // ──────────────────────────────────────────────────────────────────────────
  // BCT-COCO-CHOC-180 — Rocher coco enrobé chocolat 180g
  // ──────────────────────────────────────────────────────────────────────────
  {
    sku: "BCT-COCO-CHOC-180",
    categorySlug: "coco",
    basePriceCents: 490,
    weightGrams: 180,
    stockQuantity: 40,
    isFeatured: true,
    nutritionalFactsPer100g: {
      energy_kcal: 482,
      fat_g: 27.5,
      carbs_g: 52.0,
      protein_g: 5.8,
      salt_g: 0.12,
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1551529834-525807d6b4f3?fm=jpg&q=75&w=1200&auto=format&fit=crop",
        altText: "Rochers coco enrobés de chocolat noir, alignés sur ardoise",
      },
      {
        url: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?fm=jpg&q=75&w=1200&auto=format&fit=crop",
        altText: "Rocher coco chocolat avec éclats de coco visibles en coupe",
      },
    ],
    translations: {
      fr: {
        name: "Rocher Coco Chocolat 180g",
        shortDescription:
          "Petits dômes de coco râpée enrobés de chocolat noir belge — fondants à cœur, croquants en surface.",
        longDescription:
          "Nos rochers coco enrobés sont préparés à la main : coco râpée fine et blancs d'œufs montés, façonnés en petits dômes, dorés au four pour obtenir une croûte légèrement caramélisée, puis trempés un à un dans un chocolat noir belge à 60% de cacao. Le contraste entre la coque chocolatée croquante et le cœur moelleux de coco fait toute la signature de ce biscuit. Boîte de 180g, environ 12 rochers selon le calibrage.",
        ingredients:
          "Noix de coco râpée, sucre, blancs d'œufs, chocolat noir 60% (pâte de cacao, sucre, beurre de cacao, émulsifiant : lécithine de soja), sel.",
        allergens: ["Œufs", "Soja"],
        seoTitle: "Rocher Coco enrobé chocolat noir 180g — Au Fil des Saveurs",
        seoDescription:
          "Rochers coco artisanaux enrobés de chocolat noir belge 60%. Fondants à cœur, croquants en surface. Boîte de 180g, environ 12 pièces.",
      },
      nl: {
        name: "Kokosrotsje Chocolade 180g",
        shortDescription:
          "Kleine kokoskoepeltjes omhuld met Belgische pure chocolade — zacht van binnen, knapperig van buiten.",
        longDescription:
          "Onze omhulde kokosrotsjes worden met de hand bereid: fijne geraspte kokos en opgeklopt eiwit, in kleine koepeltjes gevormd, in de oven gebakken voor een licht gekarameliseerde korst, en daarna één voor één gedoopt in Belgische pure chocolade van 60% cacao. Het contrast tussen de knapperige chocoladeschelp en het zachte kokoshart maakt de signature van dit koekje. Doos van 180g, ongeveer 12 rotsjes naargelang het kaliber.",
        ingredients:
          "Geraspte kokosnoot, suiker, eiwit, pure chocolade 60% (cacaomassa, suiker, cacaoboter, emulgator: sojalecithine), zout.",
        allergens: ["Eieren", "Soja"],
        seoTitle: "Kokosrotsje omhuld met pure chocolade 180g — Au Fil des Saveurs",
        seoDescription:
          "Ambachtelijke kokosrotsjes omhuld met Belgische pure chocolade 60%. Zacht van binnen, knapperig van buiten. Doos 180g, ongeveer 12 stuks.",
      },
      de: {
        name: "Kokosmakrone Schokolade 180g",
        shortDescription:
          "Kleine Kokoskuppeln, in belgischer Zartbitterschokolade getaucht — weich im Kern, knusprig außen.",
        longDescription:
          "Unsere überzogenen Kokosmakronen werden von Hand zubereitet: fein geriebene Kokosnuss und aufgeschlagenes Eiweiß, zu kleinen Kuppeln geformt, im Ofen für eine leicht karamellisierte Kruste gebacken und dann einzeln in belgische Zartbitterschokolade mit 60% Kakao getaucht. Der Kontrast zwischen der knusprigen Schokoladenhülle und dem weichen Kokoskern macht die Signatur dieses Gebäcks aus. Schachtel mit 180g, je nach Kaliber etwa 12 Makronen.",
        ingredients:
          "Geriebene Kokosnuss, Zucker, Eiweiß, Zartbitterschokolade 60% (Kakaomasse, Zucker, Kakaobutter, Emulgator: Sojalecithin), Salz.",
        allergens: ["Eier", "Soja"],
        seoTitle: "Kokosmakrone mit Zartbitterschokolade 180g — Au Fil des Saveurs",
        seoDescription:
          "Handwerkliche Kokosmakronen mit belgischer Zartbitterschokolade 60% überzogen. Weich im Kern, knusprig außen. Schachtel 180g, ca. 12 Stück.",
      },
      en: {
        name: "Coconut Rock Chocolate 180g",
        shortDescription:
          "Little coconut domes coated in Belgian dark chocolate — soft inside, crunchy outside.",
        longDescription:
          "Our coated coconut rocks are hand-made: finely grated coconut and whipped egg whites, shaped into small domes, oven-baked to a lightly caramelised crust, then dipped one by one in Belgian dark chocolate at 60% cocoa. The contrast between the crisp chocolate shell and the tender coconut core is the signature of this biscuit. 180g box, about 12 rocks depending on size.",
        ingredients:
          "Grated coconut, sugar, egg whites, dark chocolate 60% (cocoa mass, sugar, cocoa butter, emulsifier: soy lecithin), salt.",
        allergens: ["Eggs", "Soy"],
        seoTitle: "Coconut Rock dark chocolate coated 180g — Au Fil des Saveurs",
        seoDescription:
          "Artisan coconut rocks coated in Belgian dark chocolate 60%. Soft inside, crunchy outside. 180g box, about 12 pieces.",
      },
    },
  },
  // ──────────────────────────────────────────────────────────────────────────
  // BCT-COCO-NATU-180 — Rocher coco nature 180g
  // ──────────────────────────────────────────────────────────────────────────
  {
    sku: "BCT-COCO-NATU-180",
    categorySlug: "coco",
    basePriceCents: 490,
    weightGrams: 180,
    stockQuantity: 40,
    isFeatured: false,
    nutritionalFactsPer100g: {
      energy_kcal: 425,
      fat_g: 22.0,
      carbs_g: 48.0,
      protein_g: 5.2,
      salt_g: 0.08,
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?fm=jpg&q=75&w=1200&auto=format&fit=crop",
        altText: "Rochers coco nature dorés, façonnés à la main et alignés",
      },
      {
        url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?fm=jpg&q=75&w=1200&auto=format&fit=crop",
        altText: "Rochers coco nature en boîte cadeau ouverte sur fond clair",
      },
    ],
    translations: {
      fr: {
        name: "Rocher Coco Nature 180g",
        shortDescription:
          "Dômes de coco râpée juste dorés au four — moelleux, parfumés, sans chocolat pour laisser parler la coco.",
        longDescription:
          "La version pure de notre rocher coco : coco râpée fine, blancs d'œufs montés en neige, juste assez de sucre pour caraméliser légèrement la surface, et c'est tout. Cuits jusqu'à ce que la croûte soit dorée et le cœur encore moelleux. Sans chocolat, sans matière grasse ajoutée — le goût de la coco est mis en avant. Boîte de 180g, environ 12 rochers.",
        ingredients:
          "Noix de coco râpée, sucre, blancs d'œufs, sel.",
        allergens: ["Œufs"],
        seoTitle: "Rocher Coco nature 180g artisanal — Au Fil des Saveurs",
        seoDescription:
          "Rochers coco nature artisanaux, juste dorés au four. Sans chocolat, moelleux, parfumés. Boîte de 180g, environ 12 pièces.",
      },
      nl: {
        name: "Kokosrotsje Naturel 180g",
        shortDescription:
          "Kokoskoepeltjes net goudbruin gebakken — zacht, geurig, zonder chocolade om de kokos te laten spreken.",
        longDescription:
          "De pure versie van ons kokosrotsje: fijne geraspte kokos, opgeklopt eiwit, net genoeg suiker om het oppervlak licht te karamelliseren, en dat is alles. Gebakken tot de korst goudbruin is en het hart nog zacht. Zonder chocolade, zonder toegevoegd vet — de smaak van de kokos staat centraal. Doos van 180g, ongeveer 12 rotsjes.",
        ingredients:
          "Geraspte kokosnoot, suiker, eiwit, zout.",
        allergens: ["Eieren"],
        seoTitle: "Kokosrotsje naturel 180g ambachtelijk — Au Fil des Saveurs",
        seoDescription:
          "Ambachtelijke naturel kokosrotsjes, net goudbruin gebakken. Zonder chocolade, zacht, geurig. Doos 180g, ongeveer 12 stuks.",
      },
      de: {
        name: "Kokosmakrone Natur 180g",
        shortDescription:
          "Kokoskuppeln, gerade goldbraun gebacken — weich, duftend, ohne Schokolade, um die Kokosnuss sprechen zu lassen.",
        longDescription:
          "Die pure Version unserer Kokosmakrone: fein geriebene Kokosnuss, aufgeschlagenes Eiweiß, gerade so viel Zucker, um die Oberfläche leicht zu karamellisieren, und das war's. So lange gebacken, bis die Kruste goldbraun und der Kern noch weich ist. Ohne Schokolade, ohne zugesetztes Fett — der Kokosgeschmack steht im Vordergrund. Schachtel mit 180g, etwa 12 Makronen.",
        ingredients:
          "Geriebene Kokosnuss, Zucker, Eiweiß, Salz.",
        allergens: ["Eier"],
        seoTitle: "Kokosmakrone natur 180g handwerklich — Au Fil des Saveurs",
        seoDescription:
          "Handwerkliche natur Kokosmakronen, gerade goldbraun gebacken. Ohne Schokolade, weich, duftend. Schachtel 180g, ca. 12 Stück.",
      },
      en: {
        name: "Coconut Rock Natural 180g",
        shortDescription:
          "Coconut domes baked to a soft gold — tender, fragrant, no chocolate so the coconut speaks for itself.",
        longDescription:
          "The pure version of our coconut rock: finely grated coconut, whipped egg whites, just enough sugar to lightly caramelise the surface, and that's all. Baked until the crust is golden and the core still soft. No chocolate, no added fat — the coconut flavour takes centre stage. 180g box, about 12 rocks.",
        ingredients:
          "Grated coconut, sugar, egg whites, salt.",
        allergens: ["Eggs"],
        seoTitle: "Coconut Rock natural 180g artisan — Au Fil des Saveurs",
        seoDescription:
          "Artisan natural coconut rocks, baked to a soft gold. No chocolate, tender, fragrant. 180g box, about 12 pieces.",
      },
    },
  },
  // ──────────────────────────────────────────────────────────────────────────
  // BCT-AVOI-200 — Biscuit à l'avoine 200g
  // ──────────────────────────────────────────────────────────────────────────
  {
    sku: "BCT-AVOI-200",
    categorySlug: "avoine",
    basePriceCents: 550,
    weightGrams: 200,
    stockQuantity: 50,
    isFeatured: true,
    nutritionalFactsPer100g: {
      energy_kcal: 445,
      fat_g: 19.5,
      carbs_g: 60.0,
      protein_g: 8.0,
      salt_g: 0.40,
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?fm=jpg&q=75&w=1200&auto=format&fit=crop",
        altText: "Biscuits à l'avoine épais, dorés, posés sur un torchon de lin",
      },
      {
        url: "https://images.unsplash.com/photo-1568051243851-f9b136146e97?fm=jpg&q=75&w=1200&auto=format&fit=crop",
        altText: "Biscuits avoine empilés près d'un bol de flocons d'avoine",
      },
    ],
    translations: {
      fr: {
        name: "Biscuit Avoine 200g",
        shortDescription:
          "Gros biscuits rustiques aux flocons d'avoine et cassonade — texture dense, légèrement moelleuse, parfaits pour le petit-déj.",
        longDescription:
          "Notre biscuit avoine est ce qu'on appelle dans le métier un biscuit \"de table\" : épais, généreux, à la texture dense mais légèrement moelleuse en cœur. Préparé avec des flocons d'avoine complets, de la cassonade brune pour la note caramélisée, du beurre fermier et une pincée de cannelle. Aucun arôme artificiel : juste les ingrédients de base, dans leurs bonnes proportions. Excellent au petit-déjeuner trempé dans un café au lait, ou à 16h avec un thé. Sachet refermable de 200g.",
        ingredients:
          "Flocons d'avoine, farine de blé, cassonade brune, beurre (lait), œufs, cannelle, levure chimique, sel.",
        allergens: ["Gluten", "Avoine", "Lait", "Œufs"],
        seoTitle: "Biscuit Avoine 200g artisanal belge — Au Fil des Saveurs",
        seoDescription:
          "Biscuits avoine artisanaux : flocons complets, cassonade brune, beurre fermier, cannelle. Texture dense et moelleuse. Sachet 200g.",
      },
      nl: {
        name: "Haverkoekje 200g",
        shortDescription:
          "Grote rustieke koekjes met haverlokken en bruine suiker — dense, lichtjes zachte textuur, perfect bij het ontbijt.",
        longDescription:
          "Ons haverkoekje is wat in het vak een \"tafelkoekje\" heet: dik, royaal, met een dichte maar in het hart lichtjes zachte textuur. Bereid met volle haverlokken, bruine basterdsuiker voor de gekarameliseerde toets, boerderijboter en een snufje kaneel. Geen kunstmatige aroma's: enkel de basisingrediënten, in de juiste verhoudingen. Heerlijk bij het ontbijt gedoopt in een koffie verkeerd, of om 16 uur bij een thee. Hersluitbare zak van 200g.",
        ingredients:
          "Haverlokken, tarwebloem, bruine basterdsuiker, boter (melk), eieren, kaneel, rijsmiddel, zout.",
        allergens: ["Gluten", "Haver", "Melk", "Eieren"],
        seoTitle: "Haverkoekje 200g ambachtelijk Belgisch — Au Fil des Saveurs",
        seoDescription:
          "Ambachtelijke haverkoekjes: volle lokken, bruine suiker, boerderijboter, kaneel. Dense en zachte textuur. Zak 200g.",
      },
      de: {
        name: "Haferkeks 200g",
        shortDescription:
          "Große rustikale Kekse mit Haferflocken und braunem Zucker — dichte, leicht weiche Textur, perfekt zum Frühstück.",
        longDescription:
          "Unser Haferkeks ist das, was in der Branche ein \"Tischkeks\" genannt wird: dick, großzügig, mit einer dichten, aber im Kern leicht weichen Textur. Zubereitet mit Vollkorn-Haferflocken, braunem Zucker für die karamellisierte Note, Bauernbutter und einer Prise Zimt. Keine künstlichen Aromen: nur die Grundzutaten in den richtigen Verhältnissen. Hervorragend zum Frühstück, in einen Milchkaffee getunkt, oder um 16 Uhr zum Tee. Wiederverschließbarer Beutel mit 200g.",
        ingredients:
          "Haferflocken, Weizenmehl, brauner Zucker, Butter (Milch), Eier, Zimt, Backtriebmittel, Salz.",
        allergens: ["Gluten", "Hafer", "Milch", "Eier"],
        seoTitle: "Haferkeks 200g handwerklich belgisch — Au Fil des Saveurs",
        seoDescription:
          "Handwerkliche Haferkekse: Vollkornflocken, brauner Zucker, Bauernbutter, Zimt. Dichte und weiche Textur. Beutel 200g.",
      },
      en: {
        name: "Oat Biscuit 200g",
        shortDescription:
          "Big rustic oat biscuits with brown sugar — dense, slightly chewy texture, perfect for breakfast.",
        longDescription:
          "Our oat biscuit is what the trade calls a \"table biscuit\": thick, generous, with a dense but slightly chewy core. Made with whole rolled oats, brown sugar for the caramel note, farmhouse butter and a pinch of cinnamon. No artificial flavours: just the basics, in the right proportions. Excellent for breakfast dipped in a café au lait, or at four o'clock with a cup of tea. 200g resealable bag.",
        ingredients:
          "Rolled oats, wheat flour, brown sugar, butter (milk), eggs, cinnamon, raising agent, salt.",
        allergens: ["Gluten", "Oats", "Milk", "Eggs"],
        seoTitle: "Oat Biscuit 200g artisan Belgian — Au Fil des Saveurs",
        seoDescription:
          "Artisan oat biscuits: whole rolled oats, brown sugar, farmhouse butter, cinnamon. Dense, chewy texture. 200g bag.",
      },
    },
  },
];

export const SHIPPING_RATES = [
  {
    method: "bpost_express_24h",
    country: "BE",
    weightGramsMax: 1000,
    priceCents: 550,
    freeShippingThresholdCents: 5000,
    sortOrder: 1,
  },
  {
    method: "bpost_express_24h",
    country: "BE",
    weightGramsMax: 2000,
    priceCents: 750,
    freeShippingThresholdCents: 5000,
    sortOrder: 2,
  },
  {
    method: "bpost_express_24h",
    country: "BE",
    weightGramsMax: 5000,
    priceCents: 1200,
    freeShippingThresholdCents: 5000,
    sortOrder: 3,
  },
];

export const ADMIN_EMAIL = "jeanbaptiste.dhondt1@gmail.com";
