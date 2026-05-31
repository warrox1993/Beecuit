import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Algemene verkoopvoorwaarden",
  lastUpdatedLabel: "Laatste update : [date]",
  intro:
    "Deze algemene verkoopvoorwaarden (AVV) regelen de verkopen die via de website Au Fil des Saveurs worden gesloten tussen [Raison sociale] (de verkoper) en iedere consument (de koper). Ze zijn onderworpen aan het Belgisch Wetboek van economisch recht.",
  sections: [
    {
      heading: "1. Identiteit van de verkoper",
      blocks: [{ type: "p", text: "De verkoper is [Raison sociale], [N° BCE], waarvan de contactgegevens te vinden zijn in de wettelijke vermeldingen." }],
    },
    {
      heading: "2. Toepassingsgebied",
      blocks: [{ type: "p", text: "Elke bestelling impliceert de onvoorwaardelijke aanvaarding van deze AVV, in de versie die van kracht is op de dag van de bestelling." }],
    },
    {
      heading: "3. Producten",
      blocks: [
        { type: "p", text: "De aangeboden producten zijn ambachtelijke biscuits en geschenkmanden. De foto's zijn niet contractueel bindend. De informatie over ingrediënten en allergenen staat op elke productpagina ; bij een allergie wordt de koper verzocht deze te raadplegen vóór elke bestelling." },
      ],
    },
    {
      heading: "4. Prijzen",
      blocks: [
        { type: "p", text: "De prijzen zijn vermeld in euro, inclusief alle belastingen (geldende Belgische btw), exclusief leveringskosten die vóór de bevestiging van de bestelling worden vermeld. [Raison sociale] behoudt zich het recht voor zijn prijzen op elk moment te wijzigen ; de producten worden gefactureerd tegen het tarief dat geldt op het moment van de bestelling." },
      ],
    },
    {
      heading: "5. Bestelling",
      blocks: [{ type: "p", text: "De bestelling wordt bevestigd na aanvaarding van de AVV en bevestiging van de betaling. De koper ontvangt een bevestigingsmail met een samenvatting van de bestelling. De verkoper bewaart een archief van de bestellingen overeenkomstig de wet." }],
    },
    {
      heading: "6. Betaling",
      blocks: [{ type: "p", text: "De betaling verloopt online, op beveiligde wijze, via de betalingsdienst Stripe. De verkoper bewaart geen volledige bankgegevens. De bestelling wordt pas verwerkt na bevestiging van de betaling." }],
    },
    {
      heading: "7. Levering",
      blocks: [
        { type: "p", text: "De producten worden geleverd in de volgende zones : [zones de livraison], binnen een indicatieve termijn van [délai] na bevestiging van de bestelling. De leveringskosten worden vóór de bevestiging vermeld. Het risico gaat over op de koper bij de overhandiging van het pakket." },
      ],
    },
    {
      heading: "8. Herroepingsrecht",
      blocks: [
        { type: "p", text: "Overeenkomstig artikel VI.47 van het Wetboek van economisch recht beschikt de consument-koper over een termijn van 14 kalenderdagen vanaf de ontvangst van de goederen om zijn herroepingsrecht uit te oefenen, zonder opgave van reden, door de verkoper op de hoogte te stellen via [email de contact] (een modelformulier voor herroeping kan worden gebruikt)." },
        { type: "subheading", text: "Uitzondering — levensmiddelen" },
        { type: "p", text: "Overeenkomstig artikel VI.53 van het Wetboek van economisch recht is het herroepingsrecht niet van toepassing op de levering van goederen die snel kunnen bederven of vervallen. Onze verse biscuits en bederfelijke voedingsproducten zijn bijgevolg uitgesloten van het herroepingsrecht zodra ze zijn verzonden. Niet-bederfelijke en ongeopende geschenkmanden blijven wel in aanmerking komen." },
      ],
    },
    {
      heading: "9. Wettelijke conformiteitsgarantie",
      blocks: [{ type: "p", text: "De koper geniet de wettelijke conformiteitsgarantie (richtlijn EU 2019/771 omgezet in boek VI van het Wetboek van economisch recht). Bij een niet-conform product kan hij de verkoper contacteren via [email de contact]." }],
    },
    {
      heading: "10. Klachten en bemiddeling",
      blocks: [
        { type: "p", text: "Elke klacht kan worden gericht aan [email de contact]. Bij gebreke van een minnelijke schikking kan de koper een beroep doen op de Ombudsdienst voor de consument (België) of op het Europees platform voor onlinegeschillenbeslechting : https://ec.europa.eu/consumers/odr." },
      ],
    },
    {
      heading: "11. Persoonsgegevens",
      blocks: [{ type: "p", text: "De verwerking van persoonsgegevens wordt beschreven in het privacybeleid." }],
    },
    {
      heading: "12. Toepasselijk recht",
      blocks: [{ type: "p", text: "Deze AVV zijn onderworpen aan het Belgisch recht. Elk geschil valt onder de bevoegdheid van de Belgische rechtbanken, onverminderd de beschermende bepalingen die van toepassing zijn op de consument." }],
    },
  ],
};

export default doc;
