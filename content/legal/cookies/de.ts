import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Cookie-Richtlinie",
  lastUpdatedLabel: "Letzte Aktualisierung : [date]",
  intro:
    "Diese Richtlinie erläutert den Einsatz von Cookies und Trackern auf der Website von Au Fil des Saveurs gemäß der ePrivacy-Richtlinie und der DSGVO.",
  sections: [
    {
      heading: "Was ist ein Cookie?",
      blocks: [{ type: "p", text: "Ein Cookie ist eine kleine Datei, die beim Besuch einer Website auf deinem Gerät gespeichert wird, damit die Website einwandfrei funktioniert oder ihre Nutzung gemessen werden kann." }],
    },
    {
      heading: "Unbedingt erforderliche Cookies",
      blocks: [
        { type: "p", text: "Diese Cookies sind für den Betrieb der Website unverzichtbar und erfordern keine Einwilligung :" },
        { type: "list", items: [
          "Authentifizierungs-Session-Cookie (Anmeldung aufrechterhalten).",
          "Cookie für laufende Zwei-Faktor-Authentifizierung (Verifizierungsschritt).",
          "Warenkorb und Sprachpräferenz.",
        ]},
      ],
    },
    {
      heading: "Analyse- und Marketing-Cookies",
      blocks: [{ type: "p", text: "Gegebenenfalls können Analyse- oder Marketing-Cookies gesetzt werden ; dies geschieht ausschließlich mit deiner vorherigen Einwilligung, die du jederzeit widerrufen kannst." }],
    },
    {
      heading: "Cookies verwalten",
      blocks: [{ type: "p", text: "Du kannst deinen Browser so einstellen, dass Cookies abgelehnt oder gelöscht werden. Das Blockieren unbedingt erforderlicher Cookies kann jedoch den Zugang zu deinem Konto verhindern." }],
    },
    {
      heading: "Aufbewahrungsfristen",
      blocks: [{ type: "p", text: "Session-Cookies verfallen beim Schließen der Sitzung oder nach ihrer technischen Lebensdauer. Etwaige Analyse-Cookies haben eine maximale Aufbewahrungsdauer gemäß den geltenden Empfehlungen." }],
    },
  ],
};

export default doc;
