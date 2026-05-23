export const CATEGORIES = [
  { slug: "sables", names: { fr: "Sablés", nl: "Zandkoekjes", de: "Sandgebäck", en: "Shortbreads" } },
  { slug: "speculoos", names: { fr: "Spéculoos", nl: "Speculoos", de: "Spekulatius", en: "Spéculoos" } },
  { slug: "chocolat", names: { fr: "Chocolat", nl: "Chocolade", de: "Schokolade", en: "Chocolate" } },
  { slug: "saisonniers", names: { fr: "Saisonniers", nl: "Seizoensgebonden", de: "Saisonal", en: "Seasonal" } },
  { slug: "sans-gluten", names: { fr: "Sans Gluten", nl: "Glutenvrij", de: "Glutenfrei", en: "Gluten-Free" } },
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

export const PRODUCTS: Array<{
  sku: string;
  categorySlug: string;
  basePriceCents: number;
  weightGrams: number;
  stockQuantity: number;
  isFeatured: boolean;
  nutritionalFactsPer100g: { energy_kcal: number; fat_g: number; carbs_g: number; protein_g: number; salt_g: number };
  translations: Record<"fr" | "nl" | "de" | "en", Trans>;
  imageCount: number;
}> = [
  // BCT-SPEC-200 — Spéculoos artisanal 200g
  {
    sku: "BCT-SPEC-200",
    categorySlug: "speculoos",
    basePriceCents: 690,
    weightGrams: 200,
    stockQuantity: 50,
    isFeatured: true,
    nutritionalFactsPer100g: { energy_kcal: 468, fat_g: 18.5, carbs_g: 70.0, protein_g: 6.2, salt_g: 0.55 },
    imageCount: 2,
    translations: {
      fr: {
        name: "Spéculoos artisanal 200g",
        shortDescription: "Le classique belge dans toute sa gloire épicée — cuit lentement au four pour une texture croustillante parfaite.",
        longDescription:
          "Nos spéculoos artisanaux sont préparés selon une recette transmise de génération en génération, avec un mélange soigneusement dosé de cassonade brune, de cannelle, de gingembre et de muscade. Cuits lentement sur des plaques en acier épaisses, ils développent cette couleur ambrée et ce croquant si particulier qui fait tout le charme du vrai spéculoos belge. Idéals avec un café du matin ou un chocolat chaud hivernal.",
        ingredients:
          "Farine de blé, cassonade brune, beurre (lait), épices (cannelle, gingembre, muscade, clou de girofle), levure chimique, sel.",
        allergens: ["Gluten", "Lait"],
        seoTitle: "Spéculoos artisanal belge 200g — BeeCuit",
        seoDescription:
          "Découvrez nos spéculoos artisanaux belges : une recette traditionnelle aux épices douces, cuits au four pour un croustillant irrésistible. 200g de pur bonheur.",
      },
      nl: {
        name: "Ambachtelijke speculoos 200g",
        shortDescription: "De Belgische klassieker in al zijn gekruide glorie — langzaam gebakken voor een perfecte knapperige textuur.",
        longDescription:
          "Onze ambachtelijke speculoos worden bereid volgens een recept dat van generatie op generatie is doorgegeven, met een zorgvuldig afgemeten mengsel van bruine basterdsuiker, kaneel, gember en nootmuskaat. Langzaam gebakken op dikke stalen platen ontwikkelen ze die karakteristieke amberkleur en dat onweerstaanbare knapperige karakter van echte Belgische speculoos. Perfect bij een ochtendkoffie of een warme winterse chocolademelk.",
        ingredients:
          "Tarwebloem, bruine basterdsuiker, boter (melk), specerijen (kaneel, gember, nootmuskaat, kruidnagel), rijsmiddel, zout.",
        allergens: ["Gluten", "Melk"],
        seoTitle: "Ambachtelijke Belgische speculoos 200g — BeeCuit",
        seoDescription:
          "Ontdek onze ambachtelijke Belgische speculoos: een traditioneel recept met zachte specerijen, gebakken voor een onweerstaanbare knapperigheid. 200g puur genot.",
      },
      de: {
        name: "Handgemachter Spekulatius 200g",
        shortDescription: "Der belgische Klassiker in seiner ganzen würzigen Pracht — langsam gebacken für eine perfekt knusprige Textur.",
        longDescription:
          "Unsere handgemachten Spekulatius werden nach einem Rezept zubereitet, das von Generation zu Generation weitergegeben wurde, mit einer sorgfältig abgestimmten Mischung aus braunem Zucker, Zimt, Ingwer und Muskatnuss. Langsam auf dicken Stahlblechen gebacken, entwickeln sie die charakteristische Bernsteinfarbe und das unwiderstehliche Knuspern, das echten belgischen Spekulatius ausmacht. Ideal zu einem Morgenkaffee oder einer heißen Winterschokolade.",
        ingredients:
          "Weizenmehl, brauner Zucker, Butter (Milch), Gewürze (Zimt, Ingwer, Muskatnuss, Nelken), Backpulver, Salz.",
        allergens: ["Gluten", "Milch"],
        seoTitle: "Handgemachter belgischer Spekulatius 200g — BeeCuit",
        seoDescription:
          "Entdecken Sie unseren handgemachten belgischen Spekulatius: ein traditionelles Rezept mit sanften Gewürzen, für unwiderstehliche Knusprigkeit gebacken. 200g purer Genuss.",
      },
      en: {
        name: "Artisan Spéculoos 200g",
        shortDescription: "The Belgian classic in all its spiced glory — slow-baked for a perfectly crisp, snappy texture.",
        longDescription:
          "Our artisan spéculoos are made following a recipe passed down through generations, with a carefully balanced blend of dark brown sugar, cinnamon, ginger and nutmeg. Slow-baked on thick steel trays, they develop that beautiful amber colour and unmistakable snap that defines a true Belgian spéculoos. Perfect alongside a morning coffee or a steaming winter hot chocolate.",
        ingredients:
          "Wheat flour, dark brown sugar, butter (milk), spices (cinnamon, ginger, nutmeg, cloves), baking powder, salt.",
        allergens: ["Gluten", "Milk"],
        seoTitle: "Artisan Belgian Spéculoos 200g — BeeCuit",
        seoDescription:
          "Discover our artisan Belgian spéculoos: a traditional recipe with gentle spices, baked for irresistible crispness. 200g of pure delight.",
      },
    },
  },

  // BCT-SABL-CHOC-180 — Sablé chocolat noir 180g
  {
    sku: "BCT-SABL-CHOC-180",
    categorySlug: "sables",
    basePriceCents: 850,
    weightGrams: 180,
    stockQuantity: 50,
    isFeatured: false,
    nutritionalFactsPer100g: { energy_kcal: 510, fat_g: 27.0, carbs_g: 62.0, protein_g: 6.5, salt_g: 0.45 },
    imageCount: 2,
    translations: {
      fr: {
        name: "Sablé chocolat noir 180g",
        shortDescription: "Un sablé fondant enrichi de morceaux de chocolat noir belge — douceur intense à chaque bouchée.",
        longDescription:
          "Fabriqués avec du beurre de qualité supérieure et enrichis de généreux éclats de chocolat noir belge 70 %, ces sablés offrent un équilibre parfait entre la friabilité beurrée du biscuit et l'amertume élégante du grand cacao. La recette, simple dans ses ingrédients mais exigeante dans sa réalisation, donne un résultat à la fois fondant et légèrement croquant. À savourer à la pause de l'après-midi, accompagnés d'un thé noir fumé ou d'un verre de lait froid.",
        ingredients:
          "Farine de blé, beurre (lait), sucre, chocolat noir 70 % (cacao, sucre, beurre de cacao, vanille), œufs, sel.",
        allergens: ["Gluten", "Lait", "Œufs"],
        seoTitle: "Sablé chocolat noir 180g — BeeCuit",
        seoDescription:
          "Nos sablés au chocolat noir belge : beurre de qualité, éclats de cacao 70 %, texture fondante irrésistible. 180g de gourmandise pure.",
      },
      nl: {
        name: "Chocolade zandkoekje 180g",
        shortDescription: "Een smeltend zandkoekje verrijkt met stukjes Belgische pure chocolade — intense zoetheid bij elke hap.",
        longDescription:
          "Gemaakt met superieure boter en verrijkt met royale stukjes Belgische pure chocolade 70%, bieden deze zandkoekjes een perfect evenwicht tussen de brokkelige boterkwaliteit van het koekje en de elegante bitterheid van de beste cacao. Het recept, eenvoudig in zijn ingrediënten maar veeleisend in zijn bereiding, levert een resultaat dat zowel smeltend als licht knapperig is. Te genieten tijdens de namiddagpauze, bij een zwarte thee of een glas koude melk.",
        ingredients:
          "Tarwebloem, boter (melk), suiker, pure chocolade 70% (cacao, suiker, cacaoboter, vanille), eieren, zout.",
        allergens: ["Gluten", "Melk", "Eieren"],
        seoTitle: "Pure chocolade zandkoekje 180g — BeeCuit",
        seoDescription:
          "Onze zandkoekjes met Belgische pure chocolade: kwaliteitsboter, 70% cacao stukjes, onweerstaanbare smeltende textuur. 180g puur genot.",
      },
      de: {
        name: "Zartbitter-Sandgebäck 180g",
        shortDescription: "Ein zartes Mürbegebäck mit belgischer Zartbitterschokolade — intensive Süße bei jedem Bissen.",
        longDescription:
          "Mit erstklassiger Butter und großzügigen Stücken belgischer Zartbitterschokolade 70% hergestellt, bieten diese Sandgebäcke eine perfekte Balance zwischen der buttrigen Mürbe des Kekses und der eleganten Bitterkeit des feinen Kakaos. Das Rezept, schlicht in seinen Zutaten, aber anspruchsvoll in der Zubereitung, liefert ein Ergebnis, das sowohl zart schmelzend als auch leicht knusprig ist. Ideal zur Nachmittagspause, begleitet von einem Schwarztee oder einem Glas kalter Milch.",
        ingredients:
          "Weizenmehl, Butter (Milch), Zucker, Zartbitterschokolade 70% (Kakao, Zucker, Kakaobutter, Vanille), Eier, Salz.",
        allergens: ["Gluten", "Milch", "Eier"],
        seoTitle: "Zartbitter-Sandgebäck 180g — BeeCuit",
        seoDescription:
          "Unser Sandgebäck mit belgischer Zartbitterschokolade: Qualitätsbutter, 70% Kakaostücke, unwiderstehlich zarte Textur. 180g purer Genuss.",
      },
      en: {
        name: "Dark Chocolate Shortbread 180g",
        shortDescription: "A melt-in-the-mouth shortbread enriched with Belgian 70% dark chocolate chips — deep, indulgent flavour in every bite.",
        longDescription:
          "Made with top-grade butter and loaded with generous pieces of Belgian 70% dark chocolate, these shortbreads strike a perfect balance between buttery crumble and the elegant bitterness of fine cacao. The recipe — simple in ingredients, exacting in execution — delivers a result that is at once melt-in-the-mouth and ever so slightly snappy. Savour them at the afternoon break alongside a smoky black tea or a cold glass of milk.",
        ingredients:
          "Wheat flour, butter (milk), sugar, dark chocolate 70% (cocoa, sugar, cocoa butter, vanilla), eggs, salt.",
        allergens: ["Gluten", "Milk", "Eggs"],
        seoTitle: "Dark Chocolate Shortbread 180g — BeeCuit",
        seoDescription:
          "Our dark chocolate shortbreads: quality butter, Belgian 70% cacao pieces, irresistibly melt-in-the-mouth texture. 180g of pure indulgence.",
      },
    },
  },

  // BCT-MACA-NOIS-006 — Macaron noisette x6
  {
    sku: "BCT-MACA-NOIS-006",
    categorySlug: "sables",
    basePriceCents: 1200,
    weightGrams: 90,
    stockQuantity: 50,
    isFeatured: true,
    nutritionalFactsPer100g: { energy_kcal: 445, fat_g: 22.0, carbs_g: 55.0, protein_g: 7.8, salt_g: 0.20 },
    imageCount: 2,
    translations: {
      fr: {
        name: "Macaron noisette x6",
        shortDescription: "Six macarons moelleux à la noisette du Piémont — une douceur délicate avec une légère note torréfiée.",
        longDescription:
          "Chaque macaron est composé d'une coque légèrement croquante à l'extérieur et tendre à l'intérieur, avec une ganache onctueuse à la pâte de noisette du Piémont. La noisette, soigneusement torréfiée avant d'être incorporée, apporte ses notes caramélisées et profondes qui subliment la douceur du biscuit. Une confection délicate, idéale pour offrir ou pour transformer une pause ordinaire en véritable instant de plaisir.",
        ingredients:
          "Sucre glace, poudre d'amandes, pâte de noisettes du Piémont (noisettes), blancs d'œufs, crème fraîche (lait), beurre (lait), chocolat blanc (sucre, beurre de cacao, lait entier, vanille).",
        allergens: ["Gluten", "Lait", "Œufs", "Fruits à coque"],
        seoTitle: "Macarons noisette du Piémont x6 — BeeCuit",
        seoDescription:
          "Six macarons artisanaux à la noisette du Piémont : coques délicates, ganache onctueuse et notes torréfiées pour un moment de pur raffinement.",
      },
      nl: {
        name: "Hazelnoot macaron x6",
        shortDescription: "Zes zachte hazelnootmacarons met Piëmontese hazelnoten — een delicate zoetheid met een lichte geroosterde toets.",
        longDescription:
          "Elke macaron bestaat uit een licht knapperige buitenkant en een zacht binnenste, met een romige ganache van Piëmontese hazelnootpasta. De hazelnoot, zorgvuldig geroosterd voor verwerking, brengt zijn gekarameliseerde en diepe noten die de zoetheid van het koekje naar een hoger niveau tillen. Een delicate creatie, ideaal als cadeau of om een gewone pauze te transformeren in een echt genietsmoment.",
        ingredients:
          "Poedersuiker, amandelpoeder, Piëmontese hazelnootpasta (hazelnoten), eiwitten, slagroom (melk), boter (melk), witte chocolade (suiker, cacaoboter, volle melk, vanille).",
        allergens: ["Gluten", "Melk", "Eieren", "Noten"],
        seoTitle: "Piëmontese hazelnoot macarons x6 — BeeCuit",
        seoDescription:
          "Zes ambachtelijke hazelnootmacarons met Piëmontese hazelnoten: delicate koekjes, romige ganache en geroosterde noten voor een moment van puur verfijning.",
      },
      de: {
        name: "Haselnuss-Macaron x6",
        shortDescription: "Sechs zarte Piemonteser Haselnuss-Macarons — delikate Süße mit einer leichten gerösteten Note.",
        longDescription:
          "Jeder Macaron besteht aus einer leicht knusprigen Außenschale und einem zarten Inneren, mit einer cremigen Ganache aus Piemonteser Haselnusspaste. Die sorgfältig gerösteten Haselnüsse bringen ihre karamellierten und tiefen Noten, die die Süße des Gebäcks auf ein neues Niveau heben. Eine delikate Kreation, ideal als Geschenk oder um eine gewöhnliche Pause in einen echten Genussmoment zu verwandeln.",
        ingredients:
          "Puderzucker, Mandelmehl, Piemonteser Haselnusspaste (Haselnüsse), Eiweiß, Sahne (Milch), Butter (Milch), weiße Schokolade (Zucker, Kakaobutter, Vollmilch, Vanille).",
        allergens: ["Gluten", "Milch", "Eier", "Schalenfrüchte"],
        seoTitle: "Piemonteser Haselnuss-Macarons x6 — BeeCuit",
        seoDescription:
          "Sechs handgemachte Haselnuss-Macarons mit Piemonteser Haselnüssen: zarte Schalen, cremige Ganache und geröstete Noten für einen Moment purer Raffinesse.",
      },
      en: {
        name: "Hazelnut Macaron x6",
        shortDescription: "Six pillowy Piedmont hazelnut macarons — delicate sweetness with a gentle, toasty depth.",
        longDescription:
          "Each macaron features a slightly crisp outer shell giving way to a tender, chewy centre, filled with a silky Piedmont hazelnut ganache. The hazelnuts are carefully toasted before blending, coaxing out their caramelised, nutty depth and lifting the sweetness of the biscuit into something truly special. A refined confection, perfect as a gift or for turning an ordinary break into a moment of genuine pleasure.",
        ingredients:
          "Icing sugar, almond flour, Piedmont hazelnut paste (hazelnuts), egg whites, cream (milk), butter (milk), white chocolate (sugar, cocoa butter, whole milk, vanilla).",
        allergens: ["Gluten", "Milk", "Eggs", "Tree nuts"],
        seoTitle: "Piedmont Hazelnut Macarons x6 — BeeCuit",
        seoDescription:
          "Six artisan hazelnut macarons with Piedmont hazelnuts: delicate shells, silky ganache and toasted notes for a moment of pure refinement.",
      },
    },
  },

  // BCT-COOK-CHOC-250 — Cookies pépites chocolat 250g
  {
    sku: "BCT-COOK-CHOC-250",
    categorySlug: "chocolat",
    basePriceCents: 990,
    weightGrams: 250,
    stockQuantity: 50,
    isFeatured: false,
    nutritionalFactsPer100g: { energy_kcal: 490, fat_g: 24.0, carbs_g: 63.0, protein_g: 6.0, salt_g: 0.60 },
    imageCount: 2,
    translations: {
      fr: {
        name: "Cookies pépites chocolat 250g",
        shortDescription: "Des cookies généreux, légèrement dorés en surface et fondants au cœur — avec de vraies pépites de chocolat belge.",
        longDescription:
          "Ces cookies sont tout ce qu'un bon cookie devrait être : dorés à l'extérieur, légèrement moelleux et fondants à l'intérieur, avec de grosses pépites de chocolat belge qui se nichent dans chaque bouchée. La recette utilise du beurre non salé de qualité, de la cassonade pour une douceur profonde et une touche de vanille naturelle. Conditionnés en sachet de 250g, ils font le bonheur des petits et des grands — au goûter, en dessert ou simplement quand l'envie se fait sentir.",
        ingredients:
          "Farine de blé, beurre (lait), sucre, cassonade, pépites de chocolat belge (cacao, sucre, beurre de cacao), œufs, extrait de vanille naturelle, levure chimique, sel.",
        allergens: ["Gluten", "Lait", "Œufs"],
        seoTitle: "Cookies pépites de chocolat belge 250g — BeeCuit",
        seoDescription:
          "Des cookies artisanaux avec de vraies pépites de chocolat belge : croustillants dehors, fondants dedans. Le sachet de 250g idéal pour les gourmands.",
      },
      nl: {
        name: "Chocoladechip cookies 250g",
        shortDescription: "Royale koekjes, licht goudbruin aan de buitenkant en smeltend van binnen — met echte Belgische chocoladechips.",
        longDescription:
          "Deze cookies zijn alles wat een goed koekje moet zijn: goudbruin aan de buitenkant, licht zacht en smeltend van binnen, met grote stukjes Belgische chocolade die in elke hap genesteld zitten. Het recept gebruikt kwaliteits-ongezouten boter, bruine suiker voor een diepe zoetheid en een vleugje natuurlijke vanille. Verpakt in een zak van 250g, maken ze groot en klein blij — bij de vieruurtje, als dessert of gewoon wanneer de trek toeslaat.",
        ingredients:
          "Tarwebloem, boter (melk), suiker, bruine suiker, Belgische chocoladechips (cacao, suiker, cacaoboter), eieren, natuurlijk vanille-extract, rijsmiddel, zout.",
        allergens: ["Gluten", "Melk", "Eieren"],
        seoTitle: "Belgische chocoladechip cookies 250g — BeeCuit",
        seoDescription:
          "Ambachtelijke cookies met echte Belgische chocoladechips: knapperig van buiten, smeltend van binnen. De ideale zak van 250g voor de echte zoetekauw.",
      },
      de: {
        name: "Schokoladenchip-Cookies 250g",
        shortDescription: "Großzügige Cookies, außen leicht goldbraun und innen zart schmelzend — mit echten belgischen Schokoladenchips.",
        longDescription:
          "Diese Cookies sind alles, was ein guter Keks sein sollte: außen goldbraun, innen leicht weich und schmelzend, mit großen Stücken belgischer Schokolade in jedem Bissen. Das Rezept verwendet hochwertige ungesalzene Butter, braunen Zucker für eine tiefe Süße und einen Hauch natürlicher Vanille. Im 250g-Beutel verpackt erfreuen sie Groß und Klein — als Nachmittagssnack, Dessert oder einfach wann immer die Lust aufkommt.",
        ingredients:
          "Weizenmehl, Butter (Milch), Zucker, brauner Zucker, belgische Schokoladenchips (Kakao, Zucker, Kakaobutter), Eier, natürliches Vanilleextrakt, Backpulver, Salz.",
        allergens: ["Gluten", "Milch", "Eier"],
        seoTitle: "Belgische Schokoladenchip-Cookies 250g — BeeCuit",
        seoDescription:
          "Handgemachte Cookies mit echten belgischen Schokoladenchips: außen knusprig, innen schmelzend. Der ideale 250g-Beutel für echte Naschkatzen.",
      },
      en: {
        name: "Chocolate Chip Cookies 250g",
        shortDescription: "Generous cookies, lightly golden on the outside and soft in the middle — loaded with real Belgian chocolate chips.",
        longDescription:
          "These cookies are everything a great cookie should be: golden on the outside, slightly chewy and melting on the inside, with big pieces of Belgian chocolate tucked into every bite. The recipe calls for quality unsalted butter, brown sugar for a deeper caramel sweetness, and a hint of natural vanilla. Packed in a 250g bag, they are a crowd-pleaser for all ages — at snack time, as dessert, or simply when the craving strikes.",
        ingredients:
          "Wheat flour, butter (milk), sugar, brown sugar, Belgian chocolate chips (cocoa, sugar, cocoa butter), eggs, natural vanilla extract, baking powder, salt.",
        allergens: ["Gluten", "Milk", "Eggs"],
        seoTitle: "Belgian Chocolate Chip Cookies 250g — BeeCuit",
        seoDescription:
          "Artisan cookies with real Belgian chocolate chips: crisp outside, soft and gooey inside. The perfect 250g bag for true chocolate lovers.",
      },
    },
  },

  // BCT-GALE-BEUR-150 — Galettes pur beurre 150g
  {
    sku: "BCT-GALE-BEUR-150",
    categorySlug: "sables",
    basePriceCents: 590,
    weightGrams: 150,
    stockQuantity: 50,
    isFeatured: false,
    nutritionalFactsPer100g: { energy_kcal: 495, fat_g: 25.5, carbs_g: 62.0, protein_g: 5.5, salt_g: 0.80 },
    imageCount: 2,
    translations: {
      fr: {
        name: "Galettes pur beurre 150g",
        shortDescription: "Des galettes rondes et fondantes, façonnées à la main avec du pur beurre fermier — la simplicité à l'état pur.",
        longDescription:
          "Ces galettes pur beurre sont le témoignage de la puissance des bons ingrédients. Fabriquées avec du beurre fermier de qualité supérieure, de la farine de blé et une touche de sel fin, elles développent à la cuisson une saveur beurrée profonde et une texture qui fond en bouche. Rondes, régulières, légèrement dorées : elles incarnent l'élégance du biscuit classique. Un accompagnement parfait pour le thé de l'après-midi ou une simple douceur après le repas.",
        ingredients:
          "Farine de blé, beurre fermier (lait), sucre, sel fin.",
        allergens: ["Gluten", "Lait"],
        seoTitle: "Galettes pur beurre artisanales 150g — BeeCuit",
        seoDescription:
          "Nos galettes pur beurre : beurre fermier de qualité, texture fondante, saveur authentique. Un classique indémodable en sachet de 150g.",
      },
      nl: {
        name: "Pure boter galetten 150g",
        shortDescription: "Ronde, smeltende galetten, met de hand gevormd met pure boerenboter — eenvoud in zijn puurste vorm.",
        longDescription:
          "Deze pure boter galetten zijn een bewijs van de kracht van goede ingrediënten. Gemaakt met superieure boerenboter, tarwebloem en een vleugje fijn zout, ontwikkelen ze tijdens het bakken een diepe boterse smaak en een textuur die smelt in de mond. Rond, regelmatig, licht goudbruin: ze belichamen de elegantie van het klassieke koekje. Een perfecte begeleider voor de namiddagthee of een eenvoudige verwennerij na de maaltijd.",
        ingredients:
          "Tarwebloem, boerenboter (melk), suiker, fijn zout.",
        allergens: ["Gluten", "Melk"],
        seoTitle: "Ambachtelijke pure boter galetten 150g — BeeCuit",
        seoDescription:
          "Onze pure boter galetten: kwaliteitsboerenboter, smeltende textuur, authentieke smaak. Een tijdloze klassieker in een zak van 150g.",
      },
      de: {
        name: "Reine Butter-Galetten 150g",
        shortDescription: "Runde, zart schmelzende Galetten, von Hand geformt mit echter Landbutter — Einfachheit in reinster Form.",
        longDescription:
          "Diese reinen Butter-Galetten sind ein Zeugnis der Kraft guter Zutaten. Mit hochwertiger Landbutter, Weizenmehl und einer Prise feinem Salz entwickeln sie beim Backen ein tiefes Butteararoma und eine Textur, die auf der Zunge zergeht. Rund, gleichmäßig, leicht goldbraun: Sie verkörpern die Eleganz des klassischen Kekses. Eine perfekte Begleitung zum Nachmittagstee oder als einfache Süßigkeit nach dem Essen.",
        ingredients:
          "Weizenmehl, Landbutter (Milch), Zucker, feines Salz.",
        allergens: ["Gluten", "Milch"],
        seoTitle: "Handgemachte reine Butter-Galetten 150g — BeeCuit",
        seoDescription:
          "Unsere reinen Butter-Galetten: Qualitätslandbutter, schmelzende Textur, authentischer Geschmack. Ein zeitloser Klassiker im 150g-Beutel.",
      },
      en: {
        name: "Pure Butter Shortbread Rounds 150g",
        shortDescription: "Round, melt-in-the-mouth rounds shaped by hand with pure farmhouse butter — simplicity at its finest.",
        longDescription:
          "These pure butter rounds are a testament to the power of excellent ingredients. Made with top-grade farmhouse butter, wheat flour and a touch of fine salt, they develop a deep, rounded butter flavour and a texture that dissolves on the tongue. Perfectly round, evenly golden: they embody the timeless elegance of a classic biscuit. A natural partner for afternoon tea, or a quiet indulgence to finish a meal.",
        ingredients:
          "Wheat flour, farmhouse butter (milk), sugar, fine salt.",
        allergens: ["Gluten", "Milk"],
        seoTitle: "Artisan Pure Butter Shortbread Rounds 150g — BeeCuit",
        seoDescription:
          "Our pure butter shortbread rounds: quality farmhouse butter, melt-in-the-mouth texture, authentic flavour. A timeless classic in a 150g bag.",
      },
    },
  },

  // BCT-SPEC-SG-180 — Spéculoos sans gluten 180g
  {
    sku: "BCT-SPEC-SG-180",
    categorySlug: "sans-gluten",
    basePriceCents: 790,
    weightGrams: 180,
    stockQuantity: 50,
    isFeatured: false,
    nutritionalFactsPer100g: { energy_kcal: 452, fat_g: 19.0, carbs_g: 66.0, protein_g: 4.5, salt_g: 0.50 },
    imageCount: 2,
    translations: {
      fr: {
        name: "Spéculoos sans gluten 180g",
        shortDescription: "La saveur authentique du spéculoos belge revisitée sans gluten — aussi croustillant et épicé que l'original.",
        longDescription:
          "Élaborés pour que personne ne soit exclu du plaisir du spéculoos, ces biscuits sans gluten réinterprètent la recette traditionnelle avec un mélange de farine de riz et de fécule de maïs. Le résultat est étonnant : la même texture croustillante, le même bouquet d'épices chaudes — cannelle, gingembre, muscade — et la même couleur ambrée caractéristique. Certifiés sans gluten, ils sont également exempts de tout allergène à base de blé. Idéaux pour tous ceux qui souhaitent savourer un vrai goût belge sans compromis.",
        ingredients:
          "Farine de riz, fécule de maïs, cassonade brune, huile de noix de coco, épices (cannelle, gingembre, muscade, clou de girofle), levure chimique (sans gluten), sel.",
        allergens: ["Lait"],
        seoTitle: "Spéculoos sans gluten belge 180g — BeeCuit",
        seoDescription:
          "Des spéculoos sans gluten avec toute la saveur de l'original : épices chaudes, texture croustillante, certifiés sans gluten. 180g de plaisir accessible à tous.",
      },
      nl: {
        name: "Glutenvrije speculoos 180g",
        shortDescription: "De authentieke smaak van Belgische speculoos herdacht zonder gluten — even knapperig en gekruid als het origineel.",
        longDescription:
          "Ontwikkeld zodat niemand het genot van speculoos hoeft te missen, herinterpreteren deze glutenvrije koekjes het traditionele recept met een mengsel van rijstmeel en maïszetmeel. Het resultaat is verrassend: dezelfde knapperige textuur, hetzelfde boeket van warme specerijen — kaneel, gember, nootmuskaat — en dezelfde karakteristieke amberkleur. Gecertificeerd glutenvrij en vrij van alle op tarwe gebaseerde allergenen. Ideaal voor iedereen die wil genieten van een echte Belgische smaak zonder compromis.",
        ingredients:
          "Rijstmeel, maïszetmeel, bruine basterdsuiker, kokosolie, specerijen (kaneel, gember, nootmuskaat, kruidnagel), glutenvrij rijsmiddel, zout.",
        allergens: ["Melk"],
        seoTitle: "Belgische glutenvrije speculoos 180g — BeeCuit",
        seoDescription:
          "Glutenvrije speculoos met alle smaak van het origineel: warme specerijen, knapperige textuur, gecertificeerd glutenvrij. 180g plezier voor iedereen.",
      },
      de: {
        name: "Glutenfreier Spekulatius 180g",
        shortDescription: "Der authentische Geschmack belgischen Spekulatius neu gedacht ohne Gluten — genauso knusprig und würzig wie das Original.",
        longDescription:
          "Entwickelt damit niemand das Vergnügen von Spekulatius verpassen muss, interpretieren diese glutenfreien Kekse das traditionelle Rezept mit einer Mischung aus Reismehl und Maisstärke neu. Das Ergebnis ist überraschend: dieselbe knusprige Textur, dasselbe Bouquet warmer Gewürze — Zimt, Ingwer, Muskatnuss — und dieselbe charakteristische Bernsteinfarbe. Glutenfrei zertifiziert und frei von allen weizenhaltigen Allergenen. Ideal für alle, die einen echten belgischen Geschmack ohne Kompromiss genießen möchten.",
        ingredients:
          "Reismehl, Maisstärke, brauner Zucker, Kokosöl, Gewürze (Zimt, Ingwer, Muskatnuss, Nelken), glutenfreies Backpulver, Salz.",
        allergens: ["Milch"],
        seoTitle: "Belgischer glutenfreier Spekulatius 180g — BeeCuit",
        seoDescription:
          "Glutenfreier Spekulatius mit dem vollen Geschmack des Originals: warme Gewürze, knusprige Textur, glutenfrei zertifiziert. 180g Genuss für alle.",
      },
      en: {
        name: "Gluten-Free Spéculoos 180g",
        shortDescription: "The authentic taste of Belgian spéculoos reimagined without gluten — just as crisp and spiced as the original.",
        longDescription:
          "Crafted so no one misses out on the pleasure of spéculoos, these gluten-free biscuits reinterpret the traditional recipe using a blend of rice flour and corn starch. The result is genuinely surprising: the same crisp texture, the same bouquet of warming spices — cinnamon, ginger, nutmeg — and that same characteristic amber colour. Certified gluten-free and free from all wheat-based allergens. Perfect for anyone who wants a true Belgian taste without compromise.",
        ingredients:
          "Rice flour, corn starch, dark brown sugar, coconut oil, spices (cinnamon, ginger, nutmeg, cloves), gluten-free baking powder, salt.",
        allergens: ["Milk"],
        seoTitle: "Belgian Gluten-Free Spéculoos 180g — BeeCuit",
        seoDescription:
          "Gluten-free spéculoos with all the flavour of the original: warming spices, crisp texture, certified gluten-free. 180g of pleasure for everyone.",
      },
    },
  },

  // BCT-FLOR-AMAN-200 — Florentins amandes 200g
  {
    sku: "BCT-FLOR-AMAN-200",
    categorySlug: "chocolat",
    basePriceCents: 1050,
    weightGrams: 200,
    stockQuantity: 50,
    isFeatured: false,
    nutritionalFactsPer100g: { energy_kcal: 515, fat_g: 28.0, carbs_g: 58.0, protein_g: 7.2, salt_g: 0.25 },
    imageCount: 2,
    translations: {
      fr: {
        name: "Florentins amandes 200g",
        shortDescription: "De fins biscuits caramélisés garnis d'amandes effilées et enrobés de chocolat noir — une confiserie d'exception.",
        longDescription:
          "Les florentins sont l'un des joyaux de la pâtisserie belge : une fine couche de caramel aux amandes effilées, légèrement croustillante et dorée, dont le revers est généreusement nappé de chocolat noir belge. Chaque bouchée offre un contraste saisissant entre le caramel fondant, le croquant des amandes et l'amertume du chocolat. Une confiserie d'exception, idéale pour offrir en cadeau ou pour ponctuer un repas raffiné d'une note sucrée et élégante.",
        ingredients:
          "Amandes effilées, sucre, miel, crème fraîche (lait), beurre (lait), chocolat noir (cacao, sucre, beurre de cacao).",
        allergens: ["Lait", "Fruits à coque"],
        seoTitle: "Florentins amandes et chocolat noir 200g — BeeCuit",
        seoDescription:
          "Des florentins artisanaux belges : caramel croustillant, amandes effilées et chocolat noir. Un biscuit d'exception en boîte de 200g.",
      },
      nl: {
        name: "AmandelFlorentijnen 200g",
        shortDescription: "Fijne gekarameliseerde koekjes met geschaafde amandelen en gecoat met pure chocolade — een uitzonderlijk snoepgoed.",
        longDescription:
          "Florentijnen zijn een van de juweeltjes van de Belgische banketbakkerij: een dunne laag karamel met geschaafde amandelen, licht knapperig en goudbruin, waarvan de onderkant royaal gedoopt is in Belgische pure chocolade. Elke hap biedt een treffend contrast tussen de smeltende karamel, het knappen van de amandelen en de bitterheid van de chocolade. Een uitzonderlijk snoepgoed, ideaal als cadeau of om een verfijnd diner te besluiten met een zoete en elegante noot.",
        ingredients:
          "Geschaafde amandelen, suiker, honing, slagroom (melk), boter (melk), pure chocolade (cacao, suiker, cacaoboter).",
        allergens: ["Melk", "Noten"],
        seoTitle: "Amandel Florentijnen en pure chocolade 200g — BeeCuit",
        seoDescription:
          "Ambachtelijke Belgische Florentijnen: knapperige karamel, geschaafde amandelen en pure chocolade. Een uitzonderlijk koekje in een doos van 200g.",
      },
      de: {
        name: "Mandelfloren-Tinen 200g",
        shortDescription: "Feine karamellisierte Kekse mit Mandelblättchen und überzogen mit Zartbitterschokolade — eine außergewöhnliche Konfiserie.",
        longDescription:
          "Florentiner sind eines der Juwelen der belgischen Pâtisserie: eine dünne Karamellschicht mit Mandelblättchen, leicht knusprig und goldbraun, deren Unterseite großzügig mit belgischer Zartbitterschokolade überzogen ist. Jeder Bissen bietet einen beeindruckenden Kontrast zwischen dem schmelzenden Karamell, dem Knistern der Mandeln und der Bitterkeit der Schokolade. Eine außergewöhnliche Konfiserie, ideal als Geschenk oder um ein feines Essen mit einem süßen und eleganten Abschluss zu krönen.",
        ingredients:
          "Mandelblättchen, Zucker, Honig, Sahne (Milch), Butter (Milch), Zartbitterschokolade (Kakao, Zucker, Kakaobutter).",
        allergens: ["Milch", "Schalenfrüchte"],
        seoTitle: "Mandelfloren-Tinen und Zartbitterschokolade 200g — BeeCuit",
        seoDescription:
          "Handgemachte belgische Florentiner: knuspriges Karamell, Mandelblättchen und Zartbitterschokolade. Ein außergewöhnlicher Keks in der 200g-Box.",
      },
      en: {
        name: "Almond Florentines 200g",
        shortDescription: "Thin caramelised biscuits packed with flaked almonds and coated in dark chocolate — a confection of rare elegance.",
        longDescription:
          "Florentines are one of the jewels of Belgian pâtisserie: a thin layer of almond-flake caramel, just crisp and golden, with a back generously coated in Belgian dark chocolate. Each bite offers a striking contrast between the yielding caramel, the snap of the almonds and the bittersweet depth of the chocolate. An exceptional confection, perfect to give as a gift or to close a refined dinner on a sweet and elegant note.",
        ingredients:
          "Flaked almonds, sugar, honey, cream (milk), butter (milk), dark chocolate (cocoa, sugar, cocoa butter).",
        allergens: ["Milk", "Tree nuts"],
        seoTitle: "Almond Florentines with Dark Chocolate 200g — BeeCuit",
        seoDescription:
          "Artisan Belgian florentines: crisp caramel, flaked almonds and dark chocolate. An exceptional biscuit in a 200g box.",
      },
    },
  },

  // BCT-SPRI-VANI-200 — Spritz vanille 200g
  {
    sku: "BCT-SPRI-VANI-200",
    categorySlug: "sables",
    basePriceCents: 750,
    weightGrams: 200,
    stockQuantity: 50,
    isFeatured: false,
    nutritionalFactsPer100g: { energy_kcal: 482, fat_g: 23.0, carbs_g: 64.0, protein_g: 5.8, salt_g: 0.35 },
    imageCount: 2,
    translations: {
      fr: {
        name: "Spritz vanille 200g",
        shortDescription: "Des petits sablés en étoile, délicatement parfumés à la vanille bourbon — légers, friables et irrésistiblement beurrés.",
        longDescription:
          "Les spritz sont une institution de la biscuiterie artisanale belge. Dressés à la poche à douille cannelée en jolies rosettes ou étoiles, ces petits sablés à la vanille bourbon fondent littéralement en bouche, laissant un sillage de beurre doux et de vanille naturelle. Leur texture friable et légère en fait des biscuits presque aériens, malgré leur richesse. Parfaits pour accompagner un café ou disposés dans une boîte cadeau pour combler vos proches.",
        ingredients:
          "Farine de blé, beurre (lait), sucre glace, œufs, extrait naturel de vanille bourbon, sel.",
        allergens: ["Gluten", "Lait", "Œufs"],
        seoTitle: "Spritz vanille bourbon artisanaux 200g — BeeCuit",
        seoDescription:
          "Nos spritz à la vanille bourbon : petits sablés légers, beurrés et fondants en forme d'étoile. 200g de biscuiterie belge artisanale.",
      },
      nl: {
        name: "Vanille spritz 200g",
        shortDescription: "Kleine stervormige zandkoekjes, delicaat geparfumeerd met bourbon vanille — licht, kruimelig en onweerstaanbaar boterig.",
        longDescription:
          "Spritz zijn een instelling van de Belgische ambachtelijke koekjesbakkerij. Gespoten via een gekartelde spuitzak in mooie roosjes of sterren, smelten deze kleine vanille-zandkoekjes letterlijk in de mond, met een nasmaak van zachte boter en natuurlijke vanille. Hun kruimelige en lichte textuur maakt ze bijna luchtig, ondanks hun rijkheid. Perfect bij een koffie of mooi gepresenteerd in een geschenkdoos om uw dierbaren te verwennen.",
        ingredients:
          "Tarwebloem, boter (melk), poedersuiker, eieren, natuurlijk bourbon vanille-extract, zout.",
        allergens: ["Gluten", "Melk", "Eieren"],
        seoTitle: "Ambachtelijke bourbon vanille spritz 200g — BeeCuit",
        seoDescription:
          "Onze bourbon vanille spritz: kleine lichte, boterige en smeltende stervormige zandkoekjes. 200g ambachtelijke Belgische koekjesbakkerij.",
      },
      de: {
        name: "Vanille-Spritzgebäck 200g",
        shortDescription: "Kleine sternförmige Mürbeteigkekse, zart mit Bourbon-Vanille parfümiert — leicht, zart-mürbe und unwiderstehlich butterig.",
        longDescription:
          "Spritzgebäck ist eine Institution der belgischen handwerklichen Keksbackerei. Durch eine Sterntülle als hübsche Rosetten oder Sterne gespritzt, schmelzen diese kleinen Vanillesandgebäcke buchstäblich auf der Zunge und hinterlassen ein Aroma von weicher Butter und natürlicher Vanille. Ihre mürbe und leichte Textur macht sie trotz ihrer Reichhaltigkeit fast luftig. Perfekt zu einem Kaffee oder in einer Geschenkbox hübsch präsentiert, um Ihre Liebsten zu verwöhnen.",
        ingredients:
          "Weizenmehl, Butter (Milch), Puderzucker, Eier, natürliches Bourbon-Vanilleextrakt, Salz.",
        allergens: ["Gluten", "Milch", "Eier"],
        seoTitle: "Handgemachtes Bourbon-Vanille-Spritzgebäck 200g — BeeCuit",
        seoDescription:
          "Unser Bourbon-Vanille-Spritzgebäck: kleine, leichte, butterige und schmelzende sternförmige Mürbeteigkekse. 200g belgische handwerkliche Keksbackerei.",
      },
      en: {
        name: "Vanilla Spritz Biscuits 200g",
        shortDescription: "Little star-shaped shortbreads, delicately scented with bourbon vanilla — light, crumbly and irresistibly buttery.",
        longDescription:
          "Spritz are a cornerstone of Belgian artisan biscuit-making. Piped through a star nozzle into pretty rosettes and stars, these little vanilla shortbreads dissolve on the tongue, leaving a trail of soft butter and natural vanilla. Their light, crumbly texture makes them almost airy despite their richness. Perfect alongside a coffee or presented in a gift box to delight the people you love.",
        ingredients:
          "Wheat flour, butter (milk), icing sugar, eggs, natural bourbon vanilla extract, salt.",
        allergens: ["Gluten", "Milk", "Eggs"],
        seoTitle: "Artisan Bourbon Vanilla Spritz Biscuits 200g — BeeCuit",
        seoDescription:
          "Our bourbon vanilla spritz: light, buttery, melt-in-the-mouth star-shaped shortbreads. 200g of Belgian artisan biscuit-making at its finest.",
      },
    },
  },
];

export const SHIPPING_RATES = [
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 1000, priceCents: 550, freeShippingThresholdCents: 5000, sortOrder: 1 },
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 2000, priceCents: 750, freeShippingThresholdCents: 5000, sortOrder: 2 },
  { method: "bpost_express_24h", country: "BE", weightGramsMax: 5000, priceCents: 1200, freeShippingThresholdCents: 5000, sortOrder: 3 },
];

export const ADMIN_EMAIL = "jeanbaptiste.dhondt1@gmail.com";
