import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Impressum",
  lastUpdatedLabel: "Zuletzt aktualisiert: [date]",
  intro:
    "Dieses Impressum wird gemäß dem belgischen Wirtschaftsgesetzbuch (Buch XII) und der Richtlinie 2000/31/EG über den elektronischen Geschäftsverkehr bereitgestellt.",
  sections: [
    {
      heading: "Herausgeber der Website",
      blocks: [
        {
          type: "list",
          items: [
            "Name : [Raison sociale]",
            "Rechtsform : [forme juridique]",
            "Eingetragener Sitz : [adresse complète]",
            "Unternehmensnummer (KBO/BCE) : [N° BCE]",
            "USt-IdNr. : [N° TVA]",
            "E-Mail : [email de contact]",
            "Telefon : [téléphone]",
          ],
        },
        { type: "p", text: "Verantwortlicher für den Inhalt : [nom du responsable]." },
      ],
    },
    {
      heading: "Hosting",
      blocks: [
        {
          type: "p",
          text: "Die Website wird gehostet von Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, Vereinigte Staaten (vercel.com).",
        },
      ],
    },
    {
      heading: "Geistiges Eigentum",
      blocks: [
        {
          type: "p",
          text: "Alle Inhalte dieser Website (Texte, Fotos, Illustrationen, Logo, Marke « Au Fil des Saveurs ») sind durch das Recht des geistigen Eigentums geschützt und bleiben Eigentum von [Raison sociale] oder deren Partnern. Jede Vervielfältigung oder Nutzung ohne vorherige schriftliche Genehmigung ist untersagt.",
        },
      ],
    },
    {
      heading: "Meldung von Inhalten",
      blocks: [
        {
          type: "p",
          text: "Um rechtswidrige Inhalte zu melden oder ein Recht auszuüben, wende dich an den Herausgeber unter [email de contact].",
        },
      ],
    },
  ],
};

export default doc;
