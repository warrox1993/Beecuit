import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Datenschutzerklärung",
  lastUpdatedLabel: "Letzte Aktualisierung : [date]",
  intro:
    "Diese Erklärung beschreibt, wie [Raison sociale] die personenbezogenen Daten der Nutzer der Website Au Fil des Saveurs verarbeitet, gemäß der Datenschutz-Grundverordnung (DSGVO, EU 2016/679).",
  sections: [
    {
      heading: "Verantwortlicher",
      blocks: [{ type: "p", text: "Verantwortlicher im Sinne der DSGVO ist [Raison sociale], [adresse], erreichbar unter [email de contact]. [Le cas échéant : délégué à la protection des données : [DPO]]." }],
    },
    {
      heading: "Erhobene Daten",
      blocks: [
        { type: "list", items: [
          "Kontodaten: E-Mail-Adresse, Name, Passwort (gehasht, niemals im Klartext gespeichert).",
          "Bestell- und Lieferdaten: Produkte, Adressen, Kaufhistorie.",
          "Newsletter: E-Mail-Adresse (auf Basis der Einwilligung).",
          "Sitzungsmetadaten zu Sicherheitszwecken: IP-Adresse, ungefähre Stadt, Browser/Gerät.",
          "Daten zur Zwei-Faktor-Authentifizierung (2FA), sofern aktiviert: verschlüsseltes Geheimnis und gehashte Wiederherstellungscodes.",
          "Automatisch generierte technische Protokolle (Logs).",
        ]},
      ],
    },
    {
      heading: "Zwecke und Rechtsgrundlagen",
      blocks: [
        { type: "list", items: [
          "Erfüllung des Kaufvertrags und Kontoverwaltung (Artikel 6.1.b DSGVO).",
          "Versand des Newsletters (Einwilligung, Artikel 6.1.a).",
          "Sicherheit, Betrugsprävention und Schutz vor unbefugtem Zugriff (berechtigtes Interesse, Artikel 6.1.f).",
          "Gesetzliche Verpflichtungen, insbesondere buchhalterischer und steuerlicher Art (Artikel 6.1.c).",
        ]},
      ],
    },
    {
      heading: "Empfänger und Auftragsverarbeiter",
      blocks: [
        { type: "list", items: [
          "Stripe (Zahlungsabwicklung).",
          "Resend (Versand von Transaktions-E-Mails).",
          "Vercel (Hosting und Auslieferung der Website).",
        ]},
        { type: "p", text: "Diese Dienstleister handeln als Auftragsverarbeiter. Werden Daten in Länder außerhalb der Europäischen Union übertragen, erfolgt dies auf Grundlage geeigneter Garantien (Standardvertragsklauseln)." },
      ],
    },
    {
      heading: "Speicherdauer",
      blocks: [
        { type: "list", items: [
          "Kontodaten: solange das Konto aktiv ist, dann Löschung/Anonymisierung nach Löschungsanfrage (Bedenkzeit von 30 Tagen).",
          "Bestelldaten: bis zu 7 Jahre aufbewahrt gemäß belgischen buchhalterischen Pflichten.",
          "Sitzungen und Authentifizierungstoken: begrenzte technische Lebensdauer, dann Löschung.",
        ]},
      ],
    },
    {
      heading: "Deine Rechte",
      blocks: [
        { type: "p", text: "Gemäß der DSGVO stehen dir das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit und Widerspruch zu, sowie das Recht, deine Einwilligung jederzeit zu widerrufen. Diese Rechte kannst du unter [email de contact] ausüben." },
        { type: "p", text: "Du hast außerdem das Recht, eine Beschwerde bei der Datenschutzbehörde (DSB), Rue de la Presse 35, 1000 Bruxelles (autoriteprotectiondonnees.be) einzureichen." },
      ],
    },
    {
      heading: "Cookies",
      blocks: [{ type: "p", text: "Die Verwendung von Cookies ist in der Cookie-Richtlinie beschrieben." }],
    },
  ],
};

export default doc;
