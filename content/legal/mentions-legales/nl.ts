import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Wettelijke vermeldingen",
  lastUpdatedLabel: "Laatst bijgewerkt: [date]",
  intro:
    "Deze wettelijke vermeldingen worden verstrekt op grond van het Belgisch Wetboek van economisch recht (boek XII) en Richtlijn 2000/31/EG inzake elektronische handel.",
  sections: [
    {
      heading: "Uitgever van de site",
      blocks: [
        {
          type: "list",
          items: [
            "Naam : [Raison sociale]",
            "Rechtsvorm : [forme juridique]",
            "Maatschappelijke zetel : [adresse complète]",
            "Ondernemingsnummer (KBO) : [N° BCE]",
            "BTW-nummer : [N° TVA]",
            "E-mail : [email de contact]",
            "Telefoon : [téléphone]",
          ],
        },
        { type: "p", text: "Publicatieverantwoordelijke : [nom du responsable]." },
      ],
    },
    {
      heading: "Hosting",
      blocks: [
        {
          type: "p",
          text: "De site wordt gehost door Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, Verenigde Staten (vercel.com).",
        },
      ],
    },
    {
      heading: "Intellectuele eigendom",
      blocks: [
        {
          type: "p",
          text: "Alle inhoud op deze site (teksten, foto's, illustraties, logo, merk « Au Fil des Saveurs ») is beschermd door het intellectuele eigendomsrecht en blijft eigendom van [Raison sociale] of haar partners. Elke reproductie of gebruik zonder voorafgaande schriftelijke toestemming is verboden.",
        },
      ],
    },
    {
      heading: "Melding van inhoud",
      blocks: [
        {
          type: "p",
          text: "Om onrechtmatige inhoud te melden of een recht uit te oefenen, neem je contact op met de uitgever via [email de contact].",
        },
      ],
    },
  ],
};

export default doc;
