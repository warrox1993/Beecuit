import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Allgemeine Geschäftsbedingungen",
  lastUpdatedLabel: "Letzte Aktualisierung : [date]",
  intro:
    "Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die über die Website Au Fil des Saveurs geschlossenen Kaufverträge zwischen [Raison sociale] (dem Verkäufer) und jedem Verbraucher (dem Käufer). Sie unterliegen dem belgischen Wirtschaftsgesetzbuch.",
  sections: [
    {
      heading: "1. Identität des Verkäufers",
      blocks: [{ type: "p", text: "Der Verkäufer ist [Raison sociale], [N° BCE], dessen Kontaktdaten in den Impressumsangaben aufgeführt sind." }],
    },
    {
      heading: "2. Anwendungsbereich",
      blocks: [{ type: "p", text: "Jede Bestellung setzt die vorbehaltlose Annahme dieser AGB in der zum Zeitpunkt der Bestellung gültigen Fassung voraus." }],
    },
    {
      heading: "3. Produkte",
      blocks: [
        { type: "p", text: "Die angebotenen Produkte sind handwerkliche Kekse und Geschenkkörbe. Die Fotos sind nicht vertraglich bindend. Die Informationen zu Zutaten und Allergenen sind auf jeder Produktseite angegeben ; bei einer Allergie wird der Käufer gebeten, diese vor jeder Bestellung zu lesen." },
      ],
    },
    {
      heading: "4. Preise",
      blocks: [
        { type: "p", text: "Die Preise sind in Euro angegeben, einschließlich aller Steuern (geltende belgische MwSt.), zuzüglich Versandkosten, die vor der Auftragsbestätigung angezeigt werden. [Raison sociale] behält sich das Recht vor, seine Preise jederzeit zu ändern ; die Produkte werden zum Zeitpunkt der Bestellung gültigen Tarif berechnet." },
      ],
    },
    {
      heading: "5. Bestellung",
      blocks: [{ type: "p", text: "Die Bestellung wird nach Annahme der AGB und Zahlungsbestätigung verbindlich. Der Käufer erhält eine Bestätigungs-E-Mail mit einer Zusammenfassung der Bestellung. Der Verkäufer archiviert die Bestellungen gemäß den gesetzlichen Anforderungen." }],
    },
    {
      heading: "6. Zahlung",
      blocks: [{ type: "p", text: "Die Zahlung erfolgt online auf sicherem Weg über den Zahlungsdienstleister Stripe. Vollständige Bankdaten werden vom Verkäufer nicht gespeichert. Die Bestellung wird erst nach Zahlungsbestätigung bearbeitet." }],
    },
    {
      heading: "7. Lieferung",
      blocks: [
        { type: "p", text: "Die Produkte werden in folgenden Gebieten geliefert : [zones de livraison], mit einer unverbindlichen Lieferfrist von [délai] ab Auftragsbestätigung. Die Versandkosten werden vor der Bestätigung angegeben. Die Gefahr geht mit Übergabe des Pakets auf den Käufer über." },
      ],
    },
    {
      heading: "8. Widerrufsrecht",
      blocks: [
        { type: "p", text: "Gemäß Artikel VI.47 des belgischen Wirtschaftsgesetzbuches steht dem Verbraucher-Käufer eine Frist von 14 Kalendertagen ab Erhalt der Ware zu, um sein Widerrufsrecht ohne Angabe von Gründen auszuüben, indem er den Verkäufer unter [email de contact] benachrichtigt (ein Muster-Widerrufsformular kann verwendet werden)." },
        { type: "subheading", text: "Ausnahme — Lebensmittel" },
        { type: "p", text: "Gemäß Artikel VI.53 des belgischen Wirtschaftsgesetzbuches gilt das Widerrufsrecht nicht für die Lieferung von Waren, die schnell verderben oder ablaufen können. Unsere frischen Kekse und verderblichen Lebensmittel sind daher vom Widerrufsrecht ausgeschlossen, sobald sie versandt wurden. Nicht verderbliche und ungeöffnete Geschenkkörbe bleiben widerrufbar." },
      ],
    },
    {
      heading: "9. Gesetzliche Konformitätsgarantie",
      blocks: [{ type: "p", text: "Der Käufer genießt die gesetzliche Konformitätsgarantie (Richtlinie EU 2019/771, umgesetzt in Buch VI des belgischen Wirtschaftsgesetzbuches). Bei einem nicht konformen Produkt kann er den Verkäufer unter [email de contact] kontaktieren." }],
    },
    {
      heading: "10. Reklamationen und Mediation",
      blocks: [
        { type: "p", text: "Reklamationen können an [email de contact] gerichtet werden. Kann keine gütliche Einigung erzielt werden, kann der Käufer den belgischen Verbraucherschlichtungsdienst oder die europäische Online-Streitbeilegungsplattform in Anspruch nehmen : https://ec.europa.eu/consumers/odr." },
      ],
    },
    {
      heading: "11. Personenbezogene Daten",
      blocks: [{ type: "p", text: "Die Verarbeitung personenbezogener Daten ist in der Datenschutzerklärung beschrieben." }],
    },
    {
      heading: "12. Anwendbares Recht",
      blocks: [{ type: "p", text: "Diese AGB unterliegen belgischem Recht. Jeder Rechtsstreit fällt in die Zuständigkeit der belgischen Gerichte, unbeschadet der für den Verbraucher geltenden Schutzbestimmungen." }],
    },
  ],
};

export default doc;
