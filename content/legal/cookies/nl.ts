import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Cookiebeleid",
  lastUpdatedLabel: "Laatste update : [date]",
  intro:
    "Dit beleid legt uit hoe cookies en trackers worden gebruikt op de website van Au Fil des Saveurs, overeenkomstig de ePrivacy-richtlijn en de AVG.",
  sections: [
    {
      heading: "Wat is een cookie?",
      blocks: [{ type: "p", text: "Een cookie is een klein bestand dat op je apparaat wordt geplaatst wanneer je een website bezoekt, zodat de site goed kan functioneren of het gebruik ervan kan worden gemeten." }],
    },
    {
      heading: "Strikt noodzakelijke cookies",
      blocks: [
        { type: "p", text: "Deze cookies zijn onmisbaar voor het functioneren van de site en vereisen geen toestemming van jou :" },
        { type: "list", items: [
          "Authenticatiesessiecookie (aangemeld blijven).",
          "Cookie voor lopende tweefactorauthenticatie (verificatiestap).",
          "Winkelwagen en taalvoorkeur.",
        ]},
      ],
    },
    {
      heading: "Analytische en marketingcookies",
      blocks: [{ type: "p", text: "Indien van toepassing kunnen analytische of marketingcookies worden geplaatst ; dit gebeurt uitsluitend met jouw voorafgaande toestemming, die je op elk moment kunt intrekken." }],
    },
    {
      heading: "Cookies beheren",
      blocks: [{ type: "p", text: "Je kunt je browser instellen om cookies te weigeren of te verwijderen. Het blokkeren van strikt noodzakelijke cookies kan echter de toegang tot je account verhinderen." }],
    },
    {
      heading: "Bewaartermijnen",
      blocks: [{ type: "p", text: "Sessiecookies vervallen bij het sluiten van de sessie of na hun technische levensduur. Eventuele analytische cookies hebben een maximale bewaartermijn die voldoet aan de geldende aanbevelingen." }],
    },
  ],
};

export default doc;
