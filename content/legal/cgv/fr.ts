import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Conditions générales de vente",
  lastUpdatedLabel: "Dernière mise à jour : [date]",
  intro:
    "Les présentes conditions générales de vente (CGV) régissent les ventes conclues sur le site Au Fil des Saveurs entre [Raison sociale] (le vendeur) et tout consommateur (l'acheteur). Elles sont soumises au Code de droit économique belge.",
  sections: [
    {
      heading: "1. Identité du vendeur",
      blocks: [{ type: "p", text: "Le vendeur est [Raison sociale], [N° BCE], dont les coordonnées figurent dans les mentions légales." }],
    },
    {
      heading: "2. Champ d'application",
      blocks: [{ type: "p", text: "Toute commande implique l'acceptation sans réserve des présentes CGV, dans leur version en vigueur au jour de la commande." }],
    },
    {
      heading: "3. Produits",
      blocks: [
        { type: "p", text: "Les produits proposés sont des biscuits et coffrets artisanaux. Les photographies sont non contractuelles. Les informations relatives aux ingrédients et allergènes figurent sur chaque fiche produit ; en cas d'allergie, l'acheteur est invité à les consulter avant toute commande." },
      ],
    },
    {
      heading: "4. Prix",
      blocks: [
        { type: "p", text: "Les prix sont indiqués en euros, toutes taxes comprises (TVA belge en vigueur), hors frais de livraison indiqués avant la validation de la commande. [Raison sociale] se réserve le droit de modifier ses prix à tout moment, les produits étant facturés au tarif en vigueur lors de la commande." },
      ],
    },
    {
      heading: "5. Commande",
      blocks: [{ type: "p", text: "La commande est validée après acceptation des CGV et confirmation du paiement. Un email de confirmation récapitulant la commande est envoyé à l'acheteur. Le vendeur conserve un archivage des commandes conformément à la loi." }],
    },
    {
      heading: "6. Paiement",
      blocks: [{ type: "p", text: "Le paiement s'effectue en ligne, de manière sécurisée, via le prestataire Stripe. Aucune donnée bancaire complète n'est conservée par le vendeur. La commande n'est traitée qu'après confirmation du paiement." }],
    },
    {
      heading: "7. Livraison",
      blocks: [
        { type: "p", text: "Les produits sont livrés dans les zones suivantes : [zones de livraison], dans un délai indicatif de [délai] à compter de la confirmation de commande. Les frais de livraison sont précisés avant validation. Les risques sont transférés à l'acheteur à la remise du colis." },
      ],
    },
    {
      heading: "8. Droit de rétractation",
      blocks: [
        { type: "p", text: "Conformément à l'article VI.47 du Code de droit économique, l'acheteur consommateur dispose d'un délai de 14 jours calendaires à compter de la réception des biens pour exercer son droit de rétractation, sans avoir à motiver sa décision, en notifiant le vendeur à [email de contact] (un formulaire type de rétractation peut être utilisé)." },
        { type: "subheading", text: "Exception — denrées alimentaires" },
        { type: "p", text: "Conformément à l'article VI.53 du Code de droit économique, le droit de rétractation ne s'applique pas à la fourniture de biens susceptibles de se détériorer ou de se périmer rapidement. Nos biscuits frais et produits alimentaires périssables sont, à ce titre, exclus du droit de rétractation une fois expédiés. Les coffrets non périssables et non descellés restent éligibles." },
      ],
    },
    {
      heading: "9. Garantie légale de conformité",
      blocks: [{ type: "p", text: "L'acheteur bénéficie de la garantie légale de conformité (directive UE 2019/771 transposée au livre VI du Code de droit économique). En cas de produit non conforme, il peut contacter le vendeur à [email de contact]." }],
    },
    {
      heading: "10. Réclamations et médiation",
      blocks: [
        { type: "p", text: "Toute réclamation peut être adressée à [email de contact]. À défaut de solution amiable, l'acheteur peut recourir au Service de médiation pour le consommateur (Belgique) ou à la plateforme européenne de règlement en ligne des litiges : https://ec.europa.eu/consumers/odr." },
      ],
    },
    {
      heading: "11. Données personnelles",
      blocks: [{ type: "p", text: "Le traitement des données personnelles est décrit dans la politique de confidentialité." }],
    },
    {
      heading: "12. Droit applicable",
      blocks: [{ type: "p", text: "Les présentes CGV sont soumises au droit belge. Tout litige relève de la compétence des tribunaux belges, sans préjudice des dispositions protectrices applicables au consommateur." }],
    },
  ],
};

export default doc;
