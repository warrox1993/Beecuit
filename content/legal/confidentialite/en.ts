import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Privacy policy",
  lastUpdatedLabel: "Last updated: [date]",
  intro:
    "This policy describes how [Raison sociale] processes the personal data of users of the Au Fil des Saveurs website, in accordance with the General Data Protection Regulation (GDPR, EU 2016/679).",
  sections: [
    {
      heading: "Data controller",
      blocks: [{ type: "p", text: "The data controller is [Raison sociale], [adresse], reachable at [email de contact]. [Le cas échéant : délégué à la protection des données : [DPO]]." }],
    },
    {
      heading: "Data collected",
      blocks: [
        { type: "list", items: [
          "Account data: email address, name, password (hashed, never stored in plain text).",
          "Order and delivery data: products, addresses, purchase history.",
          "Newsletter: email address (on consent).",
          "Session metadata, for security purposes: IP address, approximate city, browser/device.",
          "Two-factor authentication (2FA) data, when enabled: encrypted secret and hashed recovery codes.",
          "Automatically generated technical logs.",
        ]},
      ],
    },
    {
      heading: "Purposes and legal bases",
      blocks: [
        { type: "list", items: [
          "Performance of the sales contract and account management (Article 6.1.b GDPR).",
          "Sending the newsletter (consent, Article 6.1.a).",
          "Security, fraud prevention and protection against unauthorised access (legitimate interest, Article 6.1.f).",
          "Legal obligations, in particular accounting and tax obligations (Article 6.1.c).",
        ]},
      ],
    },
    {
      heading: "Recipients and sub-processors",
      blocks: [
        { type: "list", items: [
          "Stripe (payment processing).",
          "Resend (sending transactional emails).",
          "Vercel (website hosting and delivery).",
        ]},
        { type: "p", text: "These service providers act as sub-processors. Where data is transferred outside the European Union, it is done so on the basis of appropriate safeguards (standard contractual clauses)." },
      ],
    },
    {
      heading: "Retention periods",
      blocks: [
        { type: "list", items: [
          "Account data: for as long as the account is active, then deletion/anonymisation following a deletion request (30-day cooling-off period).",
          "Order data: retained for up to 7 years under Belgian accounting obligations.",
          "Sessions and authentication tokens: limited technical lifespan, then purged.",
        ]},
      ],
    },
    {
      heading: "Your rights",
      blocks: [
        { type: "p", text: "In accordance with the GDPR, you have the rights of access, rectification, erasure, restriction, portability and objection, as well as the right to withdraw your consent at any time. These rights may be exercised at [email de contact]." },
        { type: "p", text: "You also have the right to lodge a complaint with the Data Protection Authority (DPA), Rue de la Presse 35, 1000 Bruxelles (autoriteprotectiondonnees.be)." },
      ],
    },
    {
      heading: "Cookies",
      blocks: [{ type: "p", text: "The use of cookies is detailed in the cookie policy." }],
    },
  ],
};

export default doc;
