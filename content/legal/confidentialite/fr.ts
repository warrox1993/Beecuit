import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Politique de confidentialité",
  lastUpdatedLabel: "Dernière mise à jour : [date]",
  intro:
    "La présente politique décrit la manière dont [Raison sociale] traite les données personnelles des utilisateurs du site Au Fil des Saveurs, conformément au Règlement général sur la protection des données (RGPD, UE 2016/679).",
  sections: [
    {
      heading: "Responsable du traitement",
      blocks: [{ type: "p", text: "Le responsable du traitement est [Raison sociale], [adresse], joignable à [email de contact]. [Le cas échéant : délégué à la protection des données (DPO)]." }],
    },
    {
      heading: "Données collectées",
      blocks: [
        { type: "list", items: [
          "Données de compte : adresse email, nom, mot de passe (haché, jamais stocké en clair).",
          "Données de commande et de livraison : produits, adresses, historique d'achat.",
          "Newsletter : adresse email (sur consentement).",
          "Métadonnées de session, à des fins de sécurité : adresse IP, ville approximative, navigateur/appareil.",
          "Données d'authentification à deux facteurs (2FA), lorsqu'elle est activée : secret chiffré et codes de récupération hachés.",
          "Journaux techniques (logs) générés automatiquement.",
        ]},
      ],
    },
    {
      heading: "Finalités et bases légales",
      blocks: [
        { type: "list", items: [
          "Exécution du contrat de vente et gestion du compte (article 6.1.b RGPD).",
          "Envoi de la newsletter (consentement, article 6.1.a).",
          "Sécurité, prévention de la fraude et des accès non autorisés (intérêt légitime, article 6.1.f).",
          "Obligations légales, notamment comptables et fiscales (article 6.1.c).",
        ]},
      ],
    },
    {
      heading: "Destinataires et sous-traitants",
      blocks: [
        { type: "list", items: [
          "Stripe (traitement des paiements).",
          "Resend (envoi des emails transactionnels).",
          "Vercel (hébergement et diffusion du site).",
        ]},
        { type: "p", text: "Ces prestataires agissent en qualité de sous-traitants. Lorsque des données sont transférées hors de l'Union européenne, elles le sont sur la base de garanties appropriées (clauses contractuelles types)." },
      ],
    },
    {
      heading: "Durées de conservation",
      blocks: [
        { type: "list", items: [
          "Données de compte : tant que le compte est actif, puis suppression/anonymisation après demande de suppression (délai de réflexion de 30 jours).",
          "Données de commande : conservées jusqu'à 7 ans au titre des obligations comptables belges.",
          "Sessions et jetons d'authentification : durée de vie technique limitée, puis purge.",
        ]},
      ],
    },
    {
      heading: "Vos droits",
      blocks: [
        { type: "p", text: "Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition, ainsi que du droit de retirer votre consentement à tout moment. Ces droits s'exercent à [email de contact]." },
        { type: "p", text: "Vous avez également le droit d'introduire une réclamation auprès de l'Autorité de protection des données (APD), Rue de la Presse 35, 1000 Bruxelles (autoriteprotectiondonnees.be)." },
      ],
    },
    {
      heading: "Cookies",
      blocks: [{ type: "p", text: "L'utilisation des cookies est détaillée dans la politique relative aux cookies." }],
    },
  ],
};

export default doc;
