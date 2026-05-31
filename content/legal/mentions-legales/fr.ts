import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Mentions légales",
  lastUpdatedLabel: "Dernière mise à jour : [date]",
  intro:
    "Les présentes mentions légales sont fournies en application du Code de droit économique belge (livre XII) et de la directive 2000/31/CE sur le commerce électronique.",
  sections: [
    {
      heading: "Éditeur du site",
      blocks: [
        {
          type: "list",
          items: [
            "Dénomination : [Raison sociale]",
            "Forme juridique : [forme juridique]",
            "Siège social : [adresse complète]",
            "Numéro d'entreprise (BCE) : [N° BCE]",
            "Numéro de TVA : [N° TVA]",
            "Email : [email de contact]",
            "Téléphone : [téléphone]",
          ],
        },
        { type: "p", text: "Directeur de la publication : [nom du responsable]." },
      ],
    },
    {
      heading: "Hébergement",
      blocks: [
        {
          type: "p",
          text: "Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis (vercel.com).",
        },
      ],
    },
    {
      heading: "Propriété intellectuelle",
      blocks: [
        {
          type: "p",
          text: "L'ensemble des contenus du site (textes, photographies, illustrations, logo, marque « Au Fil des Saveurs ») est protégé par le droit de la propriété intellectuelle et reste la propriété de [Raison sociale] ou de ses partenaires. Toute reproduction ou utilisation sans autorisation écrite préalable est interdite.",
        },
      ],
    },
    {
      heading: "Signalement de contenu",
      blocks: [
        {
          type: "p",
          text: "Pour signaler un contenu illicite ou exercer un droit, contactez l'éditeur à l'adresse [email de contact].",
        },
      ],
    },
  ],
};

export default doc;
