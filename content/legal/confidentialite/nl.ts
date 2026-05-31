import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Privacybeleid",
  lastUpdatedLabel: "Laatste update : [date]",
  intro:
    "Dit beleid beschrijft hoe [Raison sociale] de persoonsgegevens verwerkt van gebruikers van de website Au Fil des Saveurs, overeenkomstig de Algemene Verordening Gegevensbescherming (AVG, EU 2016/679).",
  sections: [
    {
      heading: "Verwerkingsverantwoordelijke",
      blocks: [{ type: "p", text: "De verwerkingsverantwoordelijke is [Raison sociale], [adresse], bereikbaar via [email de contact]. [Le cas échéant : délégué à la protection des données : [DPO]]." }],
    },
    {
      heading: "Verzamelde gegevens",
      blocks: [
        { type: "list", items: [
          "Accountgegevens: e-mailadres, naam, wachtwoord (gehasht, nooit in leesbare vorm opgeslagen).",
          "Bestel- en leveringsgegevens: producten, adressen, aankoopgeschiedenis.",
          "Nieuwsbrief: e-mailadres (op basis van toestemming).",
          "Sessiemetadata, voor beveiligingsdoeleinden: IP-adres, bij benadering bepaalde stad, browser/apparaat.",
          "Gegevens voor tweefactorauthenticatie (2FA), indien geactiveerd: versleuteld geheim en gehashte herstelcodes.",
          "Automatisch gegenereerde technische logboeken (logs).",
        ]},
      ],
    },
    {
      heading: "Doeleinden en rechtsgrondslagen",
      blocks: [
        { type: "list", items: [
          "Uitvoering van de koopovereenkomst en accountbeheer (artikel 6.1.b AVG).",
          "Verzending van de nieuwsbrief (toestemming, artikel 6.1.a).",
          "Beveiliging, fraudepreventie en voorkoming van ongeautoriseerde toegang (gerechtvaardigd belang, artikel 6.1.f).",
          "Wettelijke verplichtingen, met name boekhoudkundige en fiscale (artikel 6.1.c).",
        ]},
      ],
    },
    {
      heading: "Ontvangers en verwerkers",
      blocks: [
        { type: "list", items: [
          "Stripe (betalingsverwerking).",
          "Resend (verzending van transactionele e-mails).",
          "Vercel (hosting en levering van de website).",
        ]},
        { type: "p", text: "Deze dienstverleners treden op als verwerkers. Wanneer gegevens buiten de Europese Unie worden doorgegeven, gebeurt dit op basis van passende waarborgen (standaard contractuele clausules)." },
      ],
    },
    {
      heading: "Bewaartermijnen",
      blocks: [
        { type: "list", items: [
          "Accountgegevens: zolang het account actief is, daarna verwijdering/anonimisering na een verwijderingsverzoek (bedenktijd van 30 dagen).",
          "Bestelgegevens: bewaard tot 7 jaar op grond van Belgische boekhoudkundige verplichtingen.",
          "Sessies en authenticatietokens: beperkte technische levensduur, daarna gewist.",
        ]},
      ],
    },
    {
      heading: "Jouw rechten",
      blocks: [
        { type: "p", text: "Overeenkomstig de AVG heb je het recht op inzage, rectificatie, wissing, beperking, overdraagbaarheid en bezwaar, alsook het recht om je toestemming op elk moment in te trekken. Je kunt deze rechten uitoefenen via [email de contact]." },
        { type: "p", text: "Je hebt ook het recht een klacht in te dienen bij de Gegevensbeschermingsautoriteit (GBA), Rue de la Presse 35, 1000 Bruxelles (autoriteprotectiondonnees.be)." },
      ],
    },
    {
      heading: "Cookies",
      blocks: [{ type: "p", text: "Het gebruik van cookies wordt nader beschreven in het cookiebeleid." }],
    },
  ],
};

export default doc;
