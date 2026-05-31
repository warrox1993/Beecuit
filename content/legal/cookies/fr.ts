import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Politique relative aux cookies",
  lastUpdatedLabel: "Dernière mise à jour : [date]",
  intro:
    "Cette politique explique l'usage des cookies et traceurs sur le site Au Fil des Saveurs, conformément à la directive ePrivacy et au RGPD.",
  sections: [
    {
      heading: "Qu'est-ce qu'un cookie ?",
      blocks: [{ type: "p", text: "Un cookie est un petit fichier déposé sur votre appareil lors de la visite d'un site, permettant d'en assurer le fonctionnement ou d'en mesurer l'usage." }],
    },
    {
      heading: "Cookies strictement nécessaires",
      blocks: [
        { type: "p", text: "Ces cookies sont indispensables au fonctionnement du site et ne requièrent pas votre consentement :" },
        { type: "list", items: [
          "Cookie de session d'authentification (maintien de la connexion).",
          "Cookie d'authentification à deux facteurs en cours (étape de vérification).",
          "Panier d'achat et préférence de langue.",
        ]},
      ],
    },
    {
      heading: "Cookies de mesure d'audience et marketing",
      blocks: [{ type: "p", text: "Le cas échéant, des cookies de mesure d'audience ou marketing peuvent être déposés ; ils ne le sont qu'avec votre consentement préalable, que vous pouvez retirer à tout moment." }],
    },
    {
      heading: "Gérer les cookies",
      blocks: [{ type: "p", text: "Vous pouvez configurer votre navigateur pour refuser ou supprimer les cookies. Le blocage des cookies strictement nécessaires peut toutefois empêcher l'accès à votre compte." }],
    },
    {
      heading: "Durées de conservation",
      blocks: [{ type: "p", text: "Les cookies de session expirent à la fermeture de la session ou après leur durée de vie technique. Les éventuels cookies de mesure ont une durée maximale conforme aux recommandations applicables." }],
    },
  ],
};

export default doc;
