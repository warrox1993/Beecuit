export const COMING_SOON_PAGES = {
  coffrets: { messageKey: "coffrets" },
  abonnement: { messageKey: "abonnement" },
  "notre-histoire": { messageKey: "notreHistoire" },
  contact: { messageKey: "contact" },
  cgv: { messageKey: "cgv" },
  "mentions-legales": { messageKey: "mentionsLegales" },
  confidentialite: { messageKey: "confidentialite" },
  cookies: { messageKey: "cookies" },
} as const;

export type ComingSoonRoute = keyof typeof COMING_SOON_PAGES;
