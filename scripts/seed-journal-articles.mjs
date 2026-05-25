// Seed 5 articles for the journal launch with SEO-optimized FR content.
// Each article is published, FR translation only (NL/EN/DE post-launch).
// Article #1 is marked as featured. Status = 'published', emailSentAt set
// to NOW() to prevent auto-send (no confirmed subscribers yet).
//
// Run: node scripts/seed-journal-articles.mjs
// Re-runnable: skips articles whose slug already exists in DB.

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

// === ProseMirror JSON builders ===
const p = (text) =>
  typeof text === "string"
    ? { type: "paragraph", content: [{ type: "text", text }] }
    : { type: "paragraph", content: text };

const b = (text) => ({ type: "text", text, marks: [{ type: "bold" }] });
const i = (text) => ({ type: "text", text, marks: [{ type: "italic" }] });
const t = (text) => ({ type: "text", text });
const link = (text, href) => ({
  type: "text",
  text,
  marks: [{ type: "link", attrs: { href } }],
});

const h2 = (text) => ({
  type: "heading",
  attrs: { level: 2 },
  content: [{ type: "text", text }],
});
const h3 = (text) => ({
  type: "heading",
  attrs: { level: 3 },
  content: [{ type: "text", text }],
});

const ul = (items) => ({
  type: "bulletList",
  content: items.map((item) => ({
    type: "listItem",
    content: [
      typeof item === "string"
        ? { type: "paragraph", content: [{ type: "text", text: item }] }
        : { type: "paragraph", content: item },
    ],
  })),
});

const ol = (items) => ({
  type: "orderedList",
  content: items.map((item) => ({
    type: "listItem",
    content: [
      typeof item === "string"
        ? { type: "paragraph", content: [{ type: "text", text: item }] }
        : { type: "paragraph", content: item },
    ],
  })),
});

const quote = (text) => ({
  type: "blockquote",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

const callout = (variant, text) => ({
  type: "callout",
  attrs: { variant, text },
});

const product = (slug) => ({
  type: "product-card",
  attrs: { productSlug: slug },
});

const doc = (...nodes) => ({ type: "doc", content: nodes });

// === Reading time helper (200 wpm) ===
function readingMinutes(body) {
  const extract = (node) => {
    if (node.text) return node.text;
    if (Array.isArray(node.content)) return node.content.map(extract).join(" ");
    return "";
  };
  const words = extract(body).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// =====================================================================
// ARTICLE 1 — atelier · Bienvenue chez Au Fil des Saveurs (FEATURED)
// =====================================================================
const article1 = {
  slug: "bienvenue-chez-au-fil-des-saveurs",
  category: "atelier",
  isFeatured: true,
  coverImage: "/images/products/avoine.webp",
  coverAltFr:
    "Biscuits artisanaux Au Fil des Saveurs disposés sur une planche en bois",
  title: "Bienvenue chez Au Fil des Saveurs",
  excerpt:
    "Une biscuiterie artisanale belge née d'une passion pour les recettes d'autrefois, où chaque biscuit raconte une histoire de tradition et de savoir-faire.",
  seoTitle:
    "Au Fil des Saveurs — Biscuiterie artisanale belge | Biscuits maison",
  seoDescription:
    "Découvrez Au Fil des Saveurs, biscuiterie artisanale belge. Spéculoos liégeois, rochers coco et biscuits avoine, fabriqués à la main selon des recettes d'autrefois.",
  body: doc(
    p(
      "Bienvenue dans notre atelier. Nous sommes Au Fil des Saveurs, une biscuiterie artisanale belge qui croit qu'un biscuit raconte une histoire. Pas seulement celle de ses ingrédients, mais celle des mains qui le pétrissent, du temps qu'on lui accorde, et des moments qu'il accompagne — un café partagé, un goûter d'enfants, un cadeau offert avec soin.",
    ),
    p(
      "Cette maison est née d'une conviction simple : le bon biscuit est rare. Pas parce qu'il faudrait des ingrédients introuvables, mais parce qu'il demande du temps, de la patience, et le refus du compromis. Nous fabriquons en petites quantités, à la main, dans le respect des recettes belges qui nous ont été transmises.",
    ),
    h2("Un atelier, une vision"),
    p(
      "Tout part de notre atelier. Un espace volontairement modeste, où chaque fournée passe entre nos mains — du pesage de la farine au glaçage final. Nous avons choisi de ne pas grandir trop vite. Cette lenteur assumée, c'est notre garantie qualité : nous goûtons chaque lot, nous écartons ce qui n'est pas parfait, nous corrigeons à chaque saison.",
    ),
    p(
      "Cette approche artisanale n'est pas une nostalgie de façade. C'est une exigence quotidienne. Quand vous ouvrez un de nos paquets, vous mordez dans le travail d'un matin — celui où la pâte a été pétrie, façonnée, cuite et emballée par une seule paire de mains.",
    ),
    h2("Le choix des ingrédients"),
    p(
      "Nous sélectionnons nos ingrédients comme on choisit ses mots : avec soin. La farine vient de meuniers belges qui travaillent encore en circuits courts. Le beurre est local, fermier. Les épices du spéculoos sont mélangées chez nous, dans des proportions tenues secrètes depuis trois générations. La cassonade est brune, riche, et donne aux biscuits leur couleur ambrée caractéristique.",
    ),
    p(
      "Aucun arôme artificiel n'entre dans nos recettes. Aucun conservateur, aucun colorant. Si vous goûtez la cannelle dans nos spéculoos, c'est parce qu'il y a de la cannelle. Si l'avoine de nos biscuits a ce goût rustique, c'est parce qu'elle vient d'un champ, pas d'un laboratoire.",
    ),
    callout(
      "astuce",
      "Tous nos biscuits se conservent trois semaines dans leur paquet d'origine, et bien plus longtemps dans une boîte hermétique. Évitez le frigo, qui les ramollit.",
    ),
    h2("Des recettes signatures"),
    p(
      "Notre catalogue est volontairement resserré. Nous préférons faire peu de choses, et bien, plutôt que multiplier les références. Cinq biscuits forment notre cœur de gamme, chacun pensé pour une occasion :",
    ),
    p([
      b("Le Spéculoos Gros et le Spéculoos Petit"),
      t(" — notre fierté, dans la pure tradition liégeoise. La pâte repose 24 heures avant la cuisson, le temps que les épices s'expriment pleinement. Le « gros format » est généreux, parfait pour le café ; le « petit » est plus délicat, idéal pour accompagner un thé."),
    ]),
    product("speculoos-gros-200g"),
    p([
      b("Le Rocher Coco Chocolat et le Rocher Coco Nature"),
      t(" — un hommage aux goûters d'enfance, avec une noix de coco torréfiée maison et un cœur fondant. La version chocolat est nappée à 70 % de cacao, la version nature laisse parler la coco seule."),
    ]),
    product("rocher-coco-chocolat-180g"),
    p([
      b("Le Biscuit Avoine"),
      t(" — rustique, généreux, parfumé à la cannelle douce. Un biscuit du matin, croquant en surface et tendre au cœur, qui se marie aussi bien au yaourt qu'à un café noir."),
    ]),
    product("biscuit-avoine-200g"),
    h2("Ce que vous trouverez chez nous"),
    p(
      "Au-delà de notre boutique en ligne, vous trouverez ici, dans ce journal, des recettes pour cuisiner avec nos biscuits, des histoires d'atelier, des conseils de dégustation, et tout ce qui fait vivre une biscuiterie artisanale au fil des saisons. Nous y partagerons aussi nos accords café et thé, nos coffrets cadeaux pensés pour les fêtes, et les petites trouvailles qui font la différence dans une cuisine.",
    ),
    p(
      "Si vous lisez ces lignes, c'est que vous aimez les choses bien faites. Bienvenue dans notre univers.",
    ),
    quote(
      "Le bon biscuit, c'est celui qu'on partage. Et chaque fournée, c'est une promesse que nous renouvelons.",
    ),
    p(
      "À très vite,",
    ),
    p([i("L'équipe d'Au Fil des Saveurs")]),
  ),
};

// =====================================================================
// ARTICLE 2 — savoir-faire · Le spéculoos liégeois, racines et tradition
// =====================================================================
const article2 = {
  slug: "speculoos-liegeois-racines-tradition",
  category: "savoir-faire",
  isFeatured: false,
  coverImage:
    "https://images.unsplash.com/photo-1606058492835-ceaef4cd2bc2?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  coverAltFr:
    "Spéculoos liégeois traditionnels disposés en éventail sur une planche en bois patiné",
  title: "Le spéculoos liégeois, racines et tradition",
  excerpt:
    "Du couvent médiéval aux tables d'aujourd'hui, le spéculoos liégeois raconte sept siècles de tradition belge. Plongez dans l'histoire d'un biscuit légendaire.",
  seoTitle:
    "Spéculoos liégeois : histoire, recette et tradition belge | Au Fil des Saveurs",
  seoDescription:
    "Découvrez l'histoire du spéculoos liégeois, biscuit emblématique de Liège. Origines médiévales, ingrédients clés, et secrets d'un savoir-faire belge transmis depuis sept siècles.",
  body: doc(
    p(
      "Le spéculoos est plus qu'un biscuit. C'est une madeleine belge, un parfum d'enfance, une signature culinaire qui traverse les régions et les générations. Mais derrière ce petit biscuit brun se cache une histoire longue et fascinante, qui prend racine bien avant les paquets industriels que l'on trouve aujourd'hui dans les supermarchés.",
    ),
    p(
      "Chez Au Fil des Saveurs, nous fabriquons un spéculoos liégeois — c'est-à-dire dans la tradition de Liège, ville qui revendique l'une des plus anciennes recettes du genre. Et nous tenons à vous raconter pourquoi cette tradition mérite d'être préservée.",
    ),
    h2("Une origine qui remonte au Moyen Âge"),
    p(
      "Les premières mentions du spéculoos remontent aux abbayes flamandes et liégeoises du XIVe siècle. À l'époque, les moines fabriquaient des biscuits aromatisés aux épices rapportées d'Orient — cannelle, clou de girofle, muscade — pour les distribuer lors des fêtes de la Saint-Nicolas, le 6 décembre.",
    ),
    p(
      "Le mot \"spéculoos\" vient probablement du latin ",
      // inline italic via separate text node
    ),
    p([
      t("Le mot « spéculoos » lui-même viendrait, selon les historiens, du latin "),
      i("speculum"),
      t(" (miroir), en référence aux moules en bois sculptés qui imprimaient à la pâte des figures de saints ou d'animaux. Ces moules, véritables œuvres d'artisanat, faisaient du biscuit un objet à la fois sacré et populaire."),
    ]),
    p(
      "Une autre étymologie plausible le rattache à species, le « commerce d'épices » — ce qui colle bien à l'identité gustative de ce biscuit, profondément marqué par les arômes orientaux qui transitaient par les ports flamands.",
    ),
    h2("Le spéculoos liégeois, une signature régionale"),
    p(
      "Il existe en Belgique plusieurs traditions de spéculoos. Le spéculoos d'Anvers est plus blond, plus dur, souvent fait avec de la cassonade blonde. Celui de Liège est plus brun, plus parfumé, plus moelleux — résultat d'une cassonade brune dense et d'un long repos de la pâte.",
    ),
    p(
      "Cette différence n'est pas anecdotique. Elle raconte deux philosophies. Le spéculoos d'Anvers se conserve longtemps, ce qui en faisait un biscuit de garnison et de voyage. Le liégeois, plus fragile, plus aromatique, est resté un biscuit de table, qu'on consomme dans les jours suivant sa fabrication, à son apogée gustative.",
    ),
    p(
      "Notre maison s'inscrit dans cette tradition liégeoise. Nous ne cherchons pas à fabriquer un biscuit qui dure trois mois en rayon. Nous fabriquons un biscuit qui se mange.",
    ),
    h2("Les ingrédients qui font la différence"),
    p(
      "La recette du spéculoos liégeois tient en cinq éléments, dont la qualité fait toute la différence.",
    ),
    h3("La cassonade brune"),
    p(
      "C'est l'âme du biscuit. La cassonade brune apporte la couleur ambrée, la saveur caramélisée, et une humidité qui empêche la pâte de devenir sèche. Nous utilisons une cassonade belge non raffinée, qui contient encore une fraction de mélasse. C'est elle qui donne au spéculoos sa note légèrement réglissée.",
    ),
    h3("Le mélange d'épices"),
    p(
      "Chaque biscuiterie a sa propre formule, jalousement gardée. Le mélange traditionnel liégeois comprend la cannelle (dominante), le clou de girofle, la muscade, la cardamome et le gingembre — chacun en proportion précise. Trop de cannelle écrase les autres notes. Trop de clou de girofle camphre l'ensemble. L'équilibre est un exercice de patience.",
    ),
    callout(
      "note",
      "Le mélange d'épices de notre maison est élaboré chaque trimestre en petites quantités, pour préserver la vivacité aromatique. Les épices entières y sont moulues juste avant le mélange.",
    ),
    h3("Le beurre belge"),
    p(
      "Pas de spéculoos sans beurre. Le beurre apporte le fondant en bouche, la rondeur. Nous utilisons un beurre fermier belge, à 82 % de matière grasse, qui donne au biscuit sa texture si caractéristique : croquant à l'extérieur, légèrement friable à l'intérieur.",
    ),
    h3("La farine"),
    p(
      "Une farine de froment T55, blanche mais non blanchie, issue de meuniers belges. Sa teneur modérée en gluten permet d'obtenir une pâte qui se travaille facilement sans devenir caoutchouteuse à la cuisson.",
    ),
    h3("Le temps"),
    p(
      "L'ingrédient invisible — et pourtant le plus important. La pâte du spéculoos liégeois repose 24 heures au frais avant cuisson. Pendant ce repos, les épices migrent dans la pâte, le sucre s'imprègne d'humidité, le gluten se détend. Sans ce temps, on obtient un biscuit correct. Avec lui, on obtient un spéculoos.",
    ),
    h2("Notre fidélité à la recette d'origine"),
    p(
      "Dans une époque où la grande distribution a réduit le spéculoos à un biscuit standardisé — parfois fabriqué avec des arômes de cannelle plutôt que de la vraie cannelle — nous avons choisi de rester fidèles à la recette d'origine. Nos spéculoos sont sans arômes artificiels, sans conservateurs, sans sirops industriels.",
    ),
    p(
      "Cela a un coût. Le beurre belge fermier est trois fois plus cher qu'une margarine. Les épices entières moulues fraîches valent dix fois plus qu'un arôme synthétique. Mais c'est ce prix-là qui fait la différence entre un biscuit qu'on mange machinalement et un biscuit qu'on savoure.",
    ),
    product("speculoos-gros-200g"),
    h2("Pourquoi le spéculoos liégeois ? Un mot sur Liège"),
    p(
      "Liège, ville d'art et de bouche, a toujours su entretenir ses traditions culinaires. La gaufre de Liège, le boulet à la liégeoise, le sirop de Liège, le pèkèt — la ville a ses signatures, et le spéculoos en fait partie. Cette identité gustative tient à la fois à l'histoire commerciale de Liège (carrefour des routes d'épices) et à la persistance, jusqu'à aujourd'hui, de petites maisons artisanales qui transmettent les recettes.",
    ),
    p(
      "Quand vous croquez dans un de nos spéculoos, vous mordez dans sept siècles de tradition belge. Vous goûtez la ténacité de ceux qui ont préservé ce savoir-faire pendant que l'industrie cherchait à le simplifier. C'est, modestement, notre manière de faire vivre Liège dans votre cuisine.",
    ),
    quote(
      "Un bon spéculoos ne se mange pas distraitement. Il se respire, on en croque un coin, on attend que les épices s'épanouissent en bouche, et alors seulement on prend la deuxième bouchée.",
    ),
    p(
      "Si vous voulez goûter notre vision du spéculoos liégeois, nous vous invitons à découvrir nos deux formats — le gros, généreux, et le petit, plus délicat. Ils se marient particulièrement bien avec un café arabica corsé, un thé noir Earl Grey, ou un verre de pèkèt pour rester dans la tradition liégeoise.",
    ),
  ),
};

// =====================================================================
// ARTICLE 3 — recettes · Tiramisu au spéculoos
// =====================================================================
const article3 = {
  slug: "tiramisu-speculoos-recette",
  category: "recettes",
  isFeatured: false,
  coverImage:
    "https://images.unsplash.com/photo-1665844190955-692de472faeb?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  coverAltFr:
    "Verrines de tiramisu au spéculoos saupoudrées de poudre de spéculoos doré",
  title: "Tiramisu au spéculoos d'Au Fil des Saveurs",
  excerpt:
    "Un tiramisu revisité où le spéculoos liégeois remplace les biscuits cuillère, pour un dessert chaleureux qui marie la douceur du mascarpone aux épices belges.",
  seoTitle:
    "Tiramisu au spéculoos : recette facile sans œuf cru | Au Fil des Saveurs",
  seoDescription:
    "Recette de tiramisu au spéculoos : 30 min de préparation, sans cuisson. Crème mascarpone onctueuse, spéculoos liégeois imbibés de café. Dessert facile pour 8 verrines.",
  recipe: {
    prepMin: 30,
    cookMin: 0,
    difficulty: "facile",
    yieldLabel: "8 verrines",
    ingredients: [
      { qty: "16", unit: "", name: "spéculoos liégeois (environ 200 g)" },
      { qty: "500", unit: "g", name: "mascarpone bien froid" },
      { qty: "4", unit: "", name: "œufs (jaunes et blancs séparés)" },
      { qty: "90", unit: "g", name: "sucre en poudre" },
      { qty: "25", unit: "cl", name: "café fort (espresso refroidi)" },
      { qty: "2", unit: "cl", name: "amaretto ou marsala (facultatif)" },
      { qty: "1", unit: "pincée", name: "fleur de sel" },
      { qty: "4", unit: "spéculoos", name: "supplémentaires, pour le décor" },
    ],
    steps: [
      {
        n: 1,
        text:
          "Préparer le café espresso très fort et le laisser refroidir. Ajouter l'amaretto si vous le souhaitez. Verser dans une assiette creuse — vous y tremperez les spéculoos.",
      },
      {
        n: 2,
        text:
          "Séparer les blancs des jaunes d'œufs. Dans un grand saladier, fouetter les jaunes avec 60 g de sucre jusqu'à ce que le mélange blanchisse et double de volume (environ 3 minutes au batteur électrique).",
      },
      {
        n: 3,
        text:
          "Ajouter le mascarpone bien froid en plusieurs fois, en fouettant doucement entre chaque ajout, jusqu'à obtenir une crème lisse et homogène. Réserver.",
      },
      {
        n: 4,
        text:
          "Monter les blancs en neige avec la pincée de sel. Quand ils commencent à mousser, ajouter les 30 g de sucre restants et fouetter jusqu'à obtention de blancs fermes et brillants.",
      },
      {
        n: 5,
        text:
          "Incorporer délicatement les blancs au mélange mascarpone-jaunes, en soulevant la masse de bas en haut avec une maryse. Ne pas casser les blancs — c'est ce qui donnera la légèreté à la crème.",
      },
      {
        n: 6,
        text:
          "Tremper rapidement chaque spéculoos dans le café (1 seconde de chaque côté — pas plus, sinon ils se désagrègent). Déposer 2 spéculoos imbibés au fond de chaque verrine.",
      },
      {
        n: 7,
        text:
          "Recouvrir d'une généreuse couche de crème mascarpone. Si la verrine est grande, alterner spéculoos imbibés et crème en deux couches.",
      },
      {
        n: 8,
        text:
          "Réfrigérer au minimum 4 heures (idéalement une nuit). Juste avant de servir, émietter les 4 spéculoos restants et saupoudrer chaque verrine. Servir bien frais.",
      },
    ],
  },
  body: doc(
    p(
      "Le tiramisu italien a depuis longtemps conquis nos tables, mais il existe une version belge — plus chaleureuse, plus épicée — où les biscuits cuillère sont remplacés par nos spéculoos liégeois. Le résultat est un dessert qui marie l'onctuosité crémeuse du mascarpone à la richesse caramélisée du spéculoos, avec en arrière-plan ces notes de cannelle, de clou de girofle et de muscade qui font toute la signature de la maison.",
    ),
    p(
      "Cette recette est devenue un classique de notre atelier. Nous la servons aux amis qui passent, nous la suggérons aux clients qui cherchent une idée de dessert pour leurs dîners. Elle a deux qualités précieuses : elle se prépare la veille (le froid sublime les saveurs), et elle ne demande aucune cuisson. Idéale pour les jours où l'on veut épater sans s'épuiser.",
    ),
    h2("Pourquoi le spéculoos transforme ce classique"),
    p(
      "Le biscuit cuillère traditionnel est neutre. Il sert de support, il absorbe le café, mais il n'apporte rien d'autre qu'une texture moelleuse. Le spéculoos, lui, est un ingrédient à part entière. Son sucre caramélisé renforce la note café. Ses épices se révèlent au contact du mascarpone froid. Sa fermeté résiste mieux à l'humidité — un point pratique, surtout si vous préparez le tiramisu la veille.",
    ),
    p(
      "Le spéculoos liégeois, avec sa cassonade brune dense, est particulièrement adapté. Sa moelleuse onctuosité s'imprègne du café sans se désagréger. Évitez les spéculoos industriels trop secs : ils boivent trop vite et perdent leur structure.",
    ),
    product("speculoos-gros-200g"),
    h2("Le secret d'une crème onctueuse"),
    p(
      "La réussite du tiramisu tient à un détail : le mascarpone doit être à la bonne température. S'il est trop froid en sortant du frigo, il devient grumeleux au contact des jaunes. S'il est trop tempéré, la crème ne se tient pas. La règle : sortez-le du frigo 10 minutes avant de l'utiliser. Pas plus.",
    ),
    p(
      "Autre point clé : les blancs en neige. Beaucoup de recettes les omettent ou les remplacent par de la crème fouettée. C'est dommage, car ce sont eux qui apportent la légèreté aérienne du tiramisu. Si vous craignez les œufs crus, choisissez des œufs extra-frais (bio de préférence), ou pasteurisez les blancs en les chauffant doucement avec le sucre au bain-marie jusqu'à 65°C avant de les monter.",
    ),
    callout(
      "astuce",
      "Pour une version sans œuf cru, remplacez la mousse jaunes+blancs par 200 ml de crème fleurette montée en chantilly mélangée au mascarpone et au sucre. Le résultat est légèrement plus dense, mais sans risque sanitaire.",
    ),
    h2("Variantes et accords"),
    p(
      "Cette recette se prête à de nombreuses variations. Voici celles qui fonctionnent particulièrement bien :",
    ),
    ul([
      [b("Version chocolat"), t(" : ajoutez 30 g de cacao en poudre dans la crème mascarpone et remplacez 50 g de spéculoos par des spéculoos enrobés de chocolat noir.")],
      [b("Version Noël"), t(" : remplacez l'amaretto par 2 cl de rhum brun et ajoutez 1/2 cuillère à café de cannelle dans la crème. Décorez de zestes d'orange confits.")],
      [b("Version sans alcool"), t(" : omettez simplement l'amaretto. Vous pouvez aussi ajouter une cuillère à soupe d'extrait de vanille dans le café pour compenser la chaleur de l'alcool.")],
      [b("Version individuelle ultra-rapide"), t(" : utilisez des verres à shot. Comptez 4 mini-spéculoos par verre et une cuillère à soupe de crème. Idéal pour un buffet.")],
    ]),
    h2("Conseils de dégustation"),
    p(
      "Le tiramisu au spéculoos se déguste bien frais, sorti du frigo au dernier moment. Servez-le avec un café espresso ou un thé noir corsé — surtout pas une boisson sucrée, qui écraserait la complexité épicée du dessert.",
    ),
    p(
      "Il se conserve 3 jours au réfrigérateur, mais il est à son apogée entre 12 et 24 heures après préparation. Au-delà, les spéculoos perdent leur structure et la crème devient un peu plus liquide.",
    ),
    quote(
      "Le tiramisu au spéculoos, c'est l'Italie qui passe par la Belgique avant d'arriver dans votre assiette. Une recette qui se transmet et qui se partage.",
    ),
    p(
      "Si cette recette vous plaît, essayez-la avec nos spéculoos petit format : ils s'adaptent parfaitement aux verrines individuelles et leur taille plus délicate permet une présentation soignée.",
    ),
    product("speculoos-petit-200g"),
  ),
};

// =====================================================================
// ARTICLE 4 — saisons · Pâques 2026 : nos coffrets en édition limitée
// =====================================================================
const article4 = {
  slug: "paques-2026-coffrets-edition-limitee",
  category: "saisons",
  isFeatured: false,
  coverImage:
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?fm=jpg&q=75&w=1200&auto=format&fit=crop",
  coverAltFr:
    "Coffret cadeau Au Fil des Saveurs garni de biscuits artisanaux pour Pâques",
  title: "Pâques 2026 : nos coffrets en édition limitée",
  excerpt:
    "Pour célébrer Pâques en douceur, découvrez notre sélection de coffrets gourmands, pensés comme des cadeaux qui durent. Édition limitée, disponible dès maintenant.",
  seoTitle:
    "Coffrets Pâques 2026 — Cadeaux gourmands belges | Au Fil des Saveurs",
  seoDescription:
    "Trois coffrets artisanaux pour Pâques 2026 : Découverte, Gourmand, Spéculoos & Avoine. Biscuits belges fabriqués à la main, livraison soignée. Édition limitée.",
  body: doc(
    p(
      "Pâques est une fête du partage. Plus encore que Noël, c'est un moment où l'on se retrouve autour d'une table, où l'on offre quelque chose qui se mange ensemble, où le cadeau est moins ostentatoire mais plus tendre. C'est dans cet esprit que nous avons composé, pour Pâques 2026, trois coffrets en édition limitée.",
    ),
    p(
      "Chacun raconte une intention différente. Le Coffret Découverte pour faire connaître la maison. Le Coffret Gourmand pour marquer le coup. Le Coffret Spéculoos & Avoine pour les amateurs de saveurs authentiques. Tous fabriqués à la main, emballés avec soin, et disponibles en quantité limitée.",
    ),
    h2("Trois coffrets pour trois occasions"),
    h3("Le Coffret Découverte — pour faire connaître la maison"),
    p(
      "C'est notre coffret d'introduction. Pensé pour celles et ceux qui ne connaissent pas encore Au Fil des Saveurs, il rassemble un échantillon de notre catalogue : spéculoos petit format, rocher coco nature, et biscuits avoine. De quoi se faire une idée de notre univers, sans engagement, dans une boîte qui se garde — ses motifs typographiques en font un joli objet à recycler en boîte à secrets.",
    ),
    p(
      "Idéal pour un cadeau de bureau, un remerciement, ou simplement pour offrir un goûter raffiné à quelqu'un qu'on apprécie sans vouloir en faire trop.",
    ),
    product("coffret-decouverte"),
    h3("Le Coffret Gourmand — pour un cadeau généreux"),
    p(
      "Notre coffret signature. Quand on veut marquer le coup — une fête de famille, un cadeau d'hôtesse, un anniversaire — c'est celui-là. Il rassemble nos biscuits phares en formats généreux : deux paquets de spéculoos gros, un assortiment de rochers coco (nature et chocolat), et une boîte de biscuits avoine.",
    ),
    p(
      "Présenté dans un emballage cadeau soigné, ruban inclus, prêt à offrir. C'est le coffret que nous offrons nous-mêmes pour les Pâques en famille.",
    ),
    product("coffret-gourmand"),
    h3("Le Coffret Spéculoos & Avoine — pour les amateurs"),
    p(
      "Pensé pour celles et ceux qui aiment les biscuits avec du caractère. Ce coffret réunit nos deux références les plus traditionnelles : le spéculoos liégeois (gros et petit format) et le biscuit avoine à la cannelle. Pas de rocher coco ici — c'est un coffret qui assume sa direction, vers les saveurs profondes, épicées, terriennes.",
    ),
    p(
      "Parfait pour un amateur de café noir ou de thé corsé. Le mariage du spéculoos et de l'avoine raconte le mieux notre approche : des biscuits qui n'ont pas peur de leur goût.",
    ),
    product("coffret-speculoos-avoine"),
    callout(
      "note",
      "Tous nos coffrets sont fabriqués sur commande dans l'ordre de réception. Comptez 2 à 3 jours ouvrables de préparation avant expédition.",
    ),
    h2("Une livraison soignée"),
    p(
      "Nos coffrets voyagent dans une boîte en carton recyclé renforcée, doublée d'un calage en papier kraft. Aucun risque de casse pendant le transport — nous avons testé. Pour les commandes Pâques, nous livrons en Belgique en 2 à 3 jours via Bpost, et au reste de l'Europe en 3 à 5 jours.",
    ),
    p(
      "Si le coffret est destiné à quelqu'un d'autre que vous, vous pouvez ajouter un mot personnalisé lors de la commande (50 caractères max). Nous le calligraphions à la main sur une petite carte glissée à l'intérieur du coffret.",
    ),
    h2("Comment commander"),
    p([
      t("Rendez-vous sur la page "),
      link("Coffrets", "/fr/coffrets"),
      t(" pour choisir votre composition. Si vous hésitez entre plusieurs options, n'hésitez pas à nous écrire — nous répondons sous 24 heures et nous adorons aider à composer le cadeau parfait. Pour les commandes en volume (entreprises, événements), nous proposons aussi des devis personnalisés via la page "),
      link("Entreprises", "/fr/entreprises"),
      t("."),
    ]),
    p(
      "Les coffrets de Pâques sont disponibles dès maintenant. La fabrication étant artisanale, les quantités sont limitées : nous recommandons de commander au moins 7 jours avant la date à laquelle vous souhaitez offrir.",
    ),
    quote(
      "Le cadeau qui se mange, c'est le cadeau qui se savoure deux fois : à l'instant où on le reçoit, et chaque fois qu'on y goûte.",
    ),
    p(
      "Joyeuses Pâques d'avance — et au plaisir de préparer votre coffret.",
    ),
  ),
};

// =====================================================================
// ARTICLE 5 — recettes · Crumble aux biscuits avoine et pommes
// =====================================================================
const article5 = {
  slug: "crumble-biscuits-avoine-pommes",
  category: "recettes",
  isFeatured: false,
  coverImage: "/images/products/avoine.webp",
  coverAltFr:
    "Crumble doré aux pommes et biscuits avoine dans un plat en céramique blanche",
  title: "Crumble aux biscuits avoine et pommes",
  excerpt:
    "Le crumble du dimanche réinventé : nos biscuits avoine grossièrement émiettés remplacent la farine, pour une pâte croustillante et gourmande au cœur fondant.",
  seoTitle:
    "Crumble pommes avoine : recette facile aux biscuits maison | Au Fil des Saveurs",
  seoDescription:
    "Recette de crumble aux pommes et biscuits avoine. 15 min de préparation, 35 min de cuisson, 6 personnes. Pâte croustillante sans farine, cœur de pommes caramélisées.",
  recipe: {
    prepMin: 15,
    cookMin: 35,
    difficulty: "facile",
    yieldLabel: "6 personnes",
    ingredients: [
      { qty: "200", unit: "g", name: "biscuits avoine Au Fil des Saveurs" },
      { qty: "6", unit: "", name: "pommes Boskoop ou reinettes" },
      { qty: "80", unit: "g", name: "beurre demi-sel froid" },
      { qty: "40", unit: "g", name: "cassonade brune" },
      { qty: "1", unit: "c. à café", name: "cannelle en poudre" },
      { qty: "1/2", unit: "", name: "citron (jus seulement)" },
      { qty: "1", unit: "pincée", name: "fleur de sel" },
      { qty: "30", unit: "g", name: "noix concassées (facultatif)" },
    ],
    steps: [
      {
        n: 1,
        text:
          "Préchauffer le four à 180°C (chaleur tournante). Beurrer légèrement un plat à gratin de 25 cm de diamètre.",
      },
      {
        n: 2,
        text:
          "Peler et couper les pommes en cubes de 1,5 cm environ. Les déposer dans le plat. Arroser du jus de citron, saupoudrer de la moitié de la cannelle. Mélanger délicatement.",
      },
      {
        n: 3,
        text:
          "Émietter grossièrement les biscuits avoine à la main dans un saladier — on veut des morceaux irréguliers, pas une poudre fine. C'est ce qui donnera la texture caractéristique du crumble.",
      },
      {
        n: 4,
        text:
          "Ajouter le beurre coupé en petits cubes, la cassonade brune, la pincée de sel, la cannelle restante et les noix si vous en mettez. Travailler du bout des doigts jusqu'à obtenir une pâte sableuse aux morceaux irréguliers.",
      },
      {
        n: 5,
        text:
          "Répartir cette pâte de crumble sur les pommes en couche généreuse, sans tasser. Laisser quelques cavités qui laisseront s'échapper la vapeur des pommes.",
      },
      {
        n: 6,
        text:
          "Enfourner pour 35 minutes, jusqu'à ce que le dessus soit bien doré et que les pommes bouillonnent sur les bords.",
      },
      {
        n: 7,
        text:
          "Laisser tiédir 10 minutes avant de servir. Le crumble est meilleur tiède, accompagné d'une boule de glace vanille ou d'une cuillère de crème fraîche épaisse.",
      },
    ],
  },
  body: doc(
    p(
      "Le crumble fait partie des desserts qu'on apprend tôt à aimer, et qu'on continue de cuisiner toute sa vie. Sa simplicité tient à un principe : un fruit cuit en dessous, une pâte sableuse croustillante au-dessus. Mais comme toujours en cuisine, les meilleurs résultats viennent des détails — et le détail qui change tout, ici, c'est l'utilisation de biscuits avoine à la place de la farine traditionnelle.",
    ),
    p(
      "Cette recette est née un dimanche pluvieux, quand il restait un paquet de biscuits avoine entamé sur la table et trois pommes au fruitier. Au lieu de jeter les biscuits ramollis (ils ne l'étaient pas vraiment, mais on cherchait une excuse pour faire un crumble), nous les avons émiettés. Le résultat fut une révélation : la texture du crumble était plus rustique, plus parfumée, plus gourmande qu'avec une simple pâte farine-beurre.",
    ),
    h2("L'avoine, parfaite pour un crumble réussi"),
    p(
      "Les flocons d'avoine, par nature, ont tout pour devenir un excellent crumble. Ils apportent du croquant, de la texture, et un goût rustique qui se marie naturellement avec les fruits cuits. Le problème, quand on part d'avoine nature, c'est qu'il faut ajouter beaucoup de beurre et de sucre pour obtenir une pâte qui se tient — et le résultat peut vite devenir trop riche.",
    ),
    p(
      "Nos biscuits avoine, déjà sucrés, déjà beurrés, déjà parfumés à la cannelle, font le travail à votre place. Vous les émiettez, vous ajoutez juste un peu de beurre froid et une touche de cassonade pour l'effet caramélisé en surface, et c'est tout. Le crumble est prêt en 5 minutes.",
    ),
    product("biscuit-avoine-200g"),
    h2("Le choix des pommes"),
    p(
      "Pas toutes les pommes sont égales devant le crumble. Les variétés trop sucrées et trop juteuses (Gala, Golden) se transforment en compote sans tenue. Les variétés trop dures (Granny Smith) restent croquantes au milieu et créent un déséquilibre.",
    ),
    p(
      "Les meilleures pommes pour crumble sont celles qui tiennent à la cuisson tout en se ramollissant légèrement — la Boskoop, la reinette du Canada, la Cox Orange. Elles ont aussi cette légère acidité qui équilibre le sucre du crumble. Si vous n'en trouvez pas, optez pour un mélange : moitié Royal Gala (pour la douceur), moitié Granny Smith (pour la tenue).",
    ),
    callout(
      "astuce",
      "Pour un crumble encore plus profond en saveur, faites caraméliser les pommes 5 minutes à la poêle avec une cuillère à soupe de beurre et une cuillère à café de cassonade avant de les mettre dans le plat. C'est un peu plus de vaisselle, mais ça change tout.",
    ),
    h2("Variantes saisonnières"),
    p(
      "Ce crumble est une base. Une fois la technique maîtrisée, vous pouvez la décliner toute l'année en fonction des fruits de saison :",
    ),
    ul([
      [b("Automne"), t(" — pommes + poires en cubes, une cuillère à soupe de miel sur les fruits avant de couvrir de crumble.")],
      [b("Hiver"), t(" — pommes + zestes d'orange + une cuillère à soupe de raisins secs réhydratés au rhum.")],
      [b("Printemps"), t(" — rhubarbe + fraises (à parts égales, 600 g au total). Ajoutez une cuillère à soupe de sucre roux supplémentaire pour compenser l'acidité de la rhubarbe.")],
      [b("Été"), t(" — pêches + framboises + une cuillère à café d'extrait de vanille. Servir tiède avec un sorbet citron.")],
    ]),
    p(
      "Dans chaque variante, gardez les biscuits avoine comme base du crumble : leur cannelle et leur richesse se marient avec tous ces fruits.",
    ),
    h2("Conservation et accord parfait"),
    p(
      "Le crumble se conserve 2 jours au réfrigérateur, sous film alimentaire. Il se réchauffe très bien au four traditionnel (10 minutes à 150°C) — évitez le micro-ondes qui ramollit la croûte croustillante.",
    ),
    p(
      "Pour la dégustation, l'accord parfait reste une boule de glace vanille (la fameuse combinaison chaud-froid) ou une cuillère de crème fraîche épaisse non sucrée, dont l'acidité contraste avec le sucre du crumble. Côté boisson, un cidre brut fermier, un thé Earl Grey, ou un café arabica corsé.",
    ),
    quote(
      "Un crumble réussi, ce n'est pas une recette compliquée — c'est une attention aux ingrédients. Le bon biscuit, la bonne pomme, le bon beurre.",
    ),
    p(
      "Bonne dégustation — et n'hésitez pas à nous écrire vos variantes préférées, nous adorons découvrir comment vous adaptez nos recettes.",
    ),
  ),
};

// =====================================================================
// INSERT LOGIC
// =====================================================================
const ARTICLES = [article1, article2, article3, article4, article5];

console.log("Seeding " + ARTICLES.length + " journal articles...\n");

for (const article of ARTICLES) {
  const existing = await sql`
    SELECT id FROM journal_articles WHERE slug = ${article.slug} LIMIT 1
  `;
  if (existing.length > 0) {
    console.log(" ⊙ skip " + article.slug + " (already exists)");
    continue;
  }

  const articleId = randomUUID();
  const translationId = randomUUID();
  const now = new Date();
  const readMin = readingMinutes(article.body);

  await sql`
    INSERT INTO journal_articles (
      id, slug, status, category, cover_image, cover_alt_fr,
      author, reading_minutes, is_featured,
      recipe_prep_min, recipe_cook_min, recipe_difficulty,
      journal_email_sent_at, published_at, created_at, updated_at,
      featured_product_slugs
    ) VALUES (
      ${articleId},
      ${article.slug},
      'published',
      ${article.category},
      ${article.coverImage},
      ${article.coverAltFr},
      'Au Fil des Saveurs',
      ${readMin},
      ${article.isFeatured},
      ${article.recipe?.prepMin ?? null},
      ${article.recipe?.cookMin ?? null},
      ${article.recipe?.difficulty ?? null},
      ${now},
      ${now},
      ${now},
      ${now},
      '[]'::jsonb
    )
  `;

  await sql`
    INSERT INTO journal_article_translations (
      id, article_id, locale, title, excerpt, body_json,
      seo_title, seo_description,
      recipe_yield_label, recipe_ingredients, recipe_steps
    ) VALUES (
      ${translationId},
      ${articleId},
      'fr',
      ${article.title},
      ${article.excerpt},
      ${JSON.stringify(article.body)}::jsonb,
      ${article.seoTitle ?? null},
      ${article.seoDescription ?? null},
      ${article.recipe?.yieldLabel ?? null},
      ${article.recipe?.ingredients ? JSON.stringify(article.recipe.ingredients) : null}::jsonb,
      ${article.recipe?.steps ? JSON.stringify(article.recipe.steps) : null}::jsonb
    )
  `;

  console.log(
    " ✓ " +
      article.slug +
      " (" +
      readMin +
      " min, " +
      article.category +
      (article.isFeatured ? ", ★ featured" : "") +
      ")",
  );
}

console.log("\nDone. Articles seeded as 'published' status.");
console.log("Visit /fr/journal to see them live (once dev server runs).");
