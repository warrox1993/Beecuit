import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Legal notice",
  lastUpdatedLabel: "Last updated: [date]",
  intro:
    "This legal notice is provided pursuant to the Belgian Code of Economic Law, Book XII, and Directive 2000/31/EC on electronic commerce.",
  sections: [
    {
      heading: "Website publisher",
      blocks: [
        {
          type: "list",
          items: [
            "Name : [Raison sociale]",
            "Legal form : [forme juridique]",
            "Registered office : [adresse complète]",
            "Company number (CBE) : [N° BCE]",
            "VAT number : [N° TVA]",
            "Email : [email de contact]",
            "Phone : [téléphone]",
          ],
        },
        { type: "p", text: "Publication director : [nom du responsable]." },
      ],
    },
    {
      heading: "Hosting",
      blocks: [
        {
          type: "p",
          text: "The site is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, United States (vercel.com).",
        },
      ],
    },
    {
      heading: "Intellectual property",
      blocks: [
        {
          type: "p",
          text: "All content on this site (texts, photographs, illustrations, logo, trademark « Au Fil des Saveurs ») is protected by intellectual property law and remains the property of [Raison sociale] or its partners. Any reproduction or use without prior written authorisation is prohibited.",
        },
      ],
    },
    {
      heading: "Content reporting",
      blocks: [
        {
          type: "p",
          text: "To report unlawful content or exercise a right, please contact the publisher at [email de contact].",
        },
      ],
    },
  ],
};

export default doc;
