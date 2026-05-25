/**
 * Pairing suggestions — Au Fil des Saveurs.
 *
 * Maps a biscuit categorySlug to a curated trio of pairing suggestions
 * (café, thé, vin, lait, etc.). Pure data — no DB. Adjust by editing
 * this file.
 *
 * Refactor 2026-05-25 : remplace les emojis par des photos Unsplash en
 * background, et aligne les catégories sur le nouveau catalogue 5 produits
 * (speculoos / coco / avoine).
 */

export type Pairing = {
  imageUrl: string;
  imageAlt: string;
  label: string;
  hint: string;
};

const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?fm=jpg&q=75&w=900&auto=format&fit=crop`;

const DEFAULT: Pairing[] = [
  {
    imageUrl: u("1495474472287-4d71bcdd2085"),
    imageAlt: "Tasse de café espresso fumant",
    label: "Café espresso",
    hint: "Corsé, contraste les notes beurrées",
  },
  {
    imageUrl: u("1576092768241-dec231879fc3"),
    imageAlt: "Tasse de thé Earl Grey ambré",
    label: "Thé Earl Grey",
    hint: "Bergamote et biscuit, l'évidence",
  },
  {
    imageUrl: u("1474722883778-792e7990302f"),
    imageAlt: "Coupe de vin de paille doré",
    label: "Vin de paille",
    hint: "Touche sucrée pour fin de repas",
  },
];

const BY_CATEGORY: Record<string, Pairing[]> = {
  speculoos: [
    {
      imageUrl: u("1509042239860-f550ce710b93"),
      imageAlt: "Café noir long fumant dans une tasse en porcelaine",
      label: "Café noir long",
      hint: "Cannelle et amertume, le classique belge",
    },
    {
      imageUrl: u("1550583724-b2692b85b150"),
      imageAlt: "Verre de lait chaud épicé",
      label: "Lait chaud à la cardamome",
      hint: "Réconfortant, parfait dimanche matin",
    },
    {
      imageUrl: u("1568213816046-0ee1c42bd559"),
      imageAlt: "Verre de bière brune trappiste belge",
      label: "Bière brune trappiste",
      hint: "Notes caramélisées en miroir",
    },
  ],
  coco: [
    {
      imageUrl: u("1547595628-c61a29f496f0"),
      imageAlt: "Coupe de champagne pétillant",
      label: "Champagne brut",
      hint: "Bulles vives qui équilibrent la coco",
    },
    {
      imageUrl: u("1564890369478-c89ca6d9cde9"),
      imageAlt: "Bol de matcha vert intense",
      label: "Thé matcha",
      hint: "Amertume verte qui réveille le sucre",
    },
    {
      imageUrl: u("1497935586351-b67a49e012bf"),
      imageAlt: "Café au lait crémeux dans une tasse blanche",
      label: "Café crème",
      hint: "Texture sur texture, idéal goûter",
    },
  ],
  avoine: [
    {
      imageUrl: u("1610632380989-680fe40816c6"),
      imageAlt: "Cappuccino mousseux avec dessin au cœur",
      label: "Cappuccino",
      hint: "Avoine et mousse de lait, le petit-déj parfait",
    },
    {
      imageUrl: u("1571934811356-5cc061b6821f"),
      imageAlt: "Théière et tasse de thé fumant",
      label: "Thé noir Assam",
      hint: "Robuste, accompagne le rustique du grain",
    },
    {
      imageUrl: u("1597528662465-55ece5734101"),
      imageAlt: "Pot de miel doré coulant sur une cuillère",
      label: "Miel d'acacia",
      hint: "Un filet sur le biscuit, pour le goûter",
    },
  ],
};

export function getPairingsForCategory(slug: string | null | undefined): Pairing[] {
  if (!slug) return DEFAULT;
  return BY_CATEGORY[slug] ?? DEFAULT;
}
