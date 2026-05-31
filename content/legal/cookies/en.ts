import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Cookie policy",
  lastUpdatedLabel: "Last updated : [date]",
  intro:
    "This policy explains the use of cookies and trackers on the Au Fil des Saveurs website, in accordance with the ePrivacy Directive and the GDPR.",
  sections: [
    {
      heading: "What is a cookie?",
      blocks: [{ type: "p", text: "A cookie is a small file placed on your device when you visit a website, enabling it to function properly or to measure its usage." }],
    },
    {
      heading: "Strictly necessary cookies",
      blocks: [
        { type: "p", text: "These cookies are essential for the website to operate and do not require your consent :" },
        { type: "list", items: [
          "Authentication session cookie (keeping you signed in).",
          "Ongoing two-factor authentication cookie (verification step).",
          "Shopping cart and language preference.",
        ]},
      ],
    },
    {
      heading: "Analytics and marketing cookies",
      blocks: [{ type: "p", text: "Where applicable, analytics or marketing cookies may be placed ; they are only set with your prior consent, which you may withdraw at any time." }],
    },
    {
      heading: "Managing cookies",
      blocks: [{ type: "p", text: "You can configure your browser to refuse or delete cookies. However, blocking strictly necessary cookies may prevent access to your account." }],
    },
    {
      heading: "Retention periods",
      blocks: [{ type: "p", text: "Session cookies expire when the session is closed or after their technical lifespan. Any analytics cookies have a maximum retention period in line with applicable recommendations." }],
    },
  ],
};

export default doc;
