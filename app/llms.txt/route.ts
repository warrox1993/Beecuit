import { SITE_NAME, SITE_URL } from "@/lib/seo/site";

/**
 * `/llms.txt` — a Markdown brand brief for AI agents / generative engines
 * (ChatGPT, Perplexity, Gemini, Claude), per the emerging llms.txt convention.
 *
 * Goal (GEO): give LLMs clean, factual, citable statements about who we are,
 * what we sell, and where to find canonical info — so generated answers about
 * "biscuiterie artisanale à Liège" cite Au Fil des Saveurs accurately.
 *
 * IMPORTANT: do NOT assert unverified business facts here (phone, opening
 * hours, exact street, VAT/BCE). Only confirmed facts: brand, products, city
 * (Liège), country (Belgium), languages, canonical URLs.
 */
export const dynamic = "force-dynamic";

export function GET(): Response {
  const body = `# ${SITE_NAME}

> ${SITE_NAME} est une biscuiterie artisanale belge basée à Liège. Nous fabriquons à la main, en petites quantités, des spéculoos, des rochers à la noix de coco et des biscuits à l'avoine, vendus en ligne et en coffrets cadeaux, avec livraison en Belgique et en Europe.

## À propos
- Marque : ${SITE_NAME}
- Activité : biscuiterie artisanale (spéculoos, rochers coco, biscuits à l'avoine)
- Fabrication : à la main, en petites séries, à Liège (Belgique)
- Marché : Belgique (FR + NL), puis Europe
- Langues du site : français, néerlandais, allemand, anglais

## Produits & services
- [Biscuits artisanaux](${SITE_URL}/fr/biscuits) : spéculoos, rochers à la noix de coco, biscuits à l'avoine
- [Coffrets cadeaux](${SITE_URL}/fr/coffrets) : coffrets de biscuits assemblés à la commande
- [Abonnement mensuel](${SITE_URL}/fr/abonnement) : box de biscuits livrée chaque mois
- [Cartes cadeaux](${SITE_URL}/fr/cartes-cadeaux) : cartes cadeaux numériques
- [Cadeaux d'affaires / B2B](${SITE_URL}/fr/entreprises) : coffrets pour entreprises, devis sur mesure

## Pages clés
- [Accueil](${SITE_URL}/fr)
- [Notre histoire](${SITE_URL}/fr/notre-histoire)
- [Le Journal (recettes & savoir-faire)](${SITE_URL}/fr/journal)
- [Contact](${SITE_URL}/fr/contact)

## Données structurées
- Organization & LocalBusiness (Bakery) en JSON-LD sur le site
- Product JSON-LD sur chaque fiche biscuit et coffret
- Article / Recipe JSON-LD sur le journal
- Sitemap : ${SITE_URL}/sitemap.xml

## Néerlandais (NL)
${SITE_NAME} is een ambachtelijke Belgische koekjesbakkerij in Luik. Handgemaakte speculoos, kokosrotsjes en haverkoekjes, online te koop en in geschenkdozen, met levering in België en Europa.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
