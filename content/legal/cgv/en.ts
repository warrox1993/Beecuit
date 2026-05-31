import type { LegalDocument } from "../types";

const doc: LegalDocument = {
  title: "Terms and conditions of sale",
  lastUpdatedLabel: "Last updated: [date]",
  intro:
    "These terms and conditions of sale govern purchases made on the Au Fil des Saveurs website between [Raison sociale] (the seller) and any consumer (the buyer). They are subject to the Belgian Code of Economic Law.",
  sections: [
    {
      heading: "1. Seller identification",
      blocks: [{ type: "p", text: "The seller is [Raison sociale], [N° BCE], whose contact details appear in the legal notices." }],
    },
    {
      heading: "2. Scope of application",
      blocks: [{ type: "p", text: "Placing an order constitutes unreserved acceptance of these terms and conditions as in force on the date of the order." }],
    },
    {
      heading: "3. Products",
      blocks: [
        { type: "p", text: "The products offered are artisan biscuits and gift sets. Photographs are for illustrative purposes only and are not contractually binding. Ingredient and allergen information is provided on each product page; buyers with allergies are advised to review this information before placing an order." },
      ],
    },
    {
      heading: "4. Prices",
      blocks: [
        { type: "p", text: "Prices are stated in euros, inclusive of all taxes (applicable Belgian VAT), excluding shipping costs which are indicated before order confirmation. [Raison sociale] reserves the right to modify its prices at any time; products are invoiced at the price in force at the time of the order." },
      ],
    },
    {
      heading: "5. Order",
      blocks: [{ type: "p", text: "An order is confirmed upon acceptance of these terms and conditions and confirmation of payment. A confirmation email summarising the order is sent to the buyer. The seller retains an archive of orders in accordance with applicable law." }],
    },
    {
      heading: "6. Payment",
      blocks: [{ type: "p", text: "Payment is made online in a secure manner via the payment provider Stripe. No complete banking data is stored by the seller. The order is processed only after payment confirmation." }],
    },
    {
      heading: "7. Delivery",
      blocks: [
        { type: "p", text: "Products are delivered to the following areas: [zones de livraison], within an indicative timeframe of [délai] from order confirmation. Shipping costs are specified before confirmation. Risk passes to the buyer upon handover of the parcel." },
      ],
    },
    {
      heading: "8. Right of withdrawal",
      blocks: [
        { type: "p", text: "In accordance with Article VI.47 of the Code of Economic Law, the consumer buyer has 14 calendar days from receipt of the goods to exercise the right of withdrawal, without giving any reason, by notifying the seller at [email de contact] (a model withdrawal form may be used)." },
        { type: "subheading", text: "Exception — food products" },
        { type: "p", text: "In accordance with Article VI.53 of the Code of Economic Law, the right of withdrawal does not apply to the supply of goods liable to deteriorate or expire rapidly. Our fresh biscuits and perishable food products are therefore excluded from the right of withdrawal once dispatched. Non-perishable and unsealed gift sets remain eligible." },
      ],
    },
    {
      heading: "9. Legal guarantee of conformity",
      blocks: [{ type: "p", text: "The buyer benefits from the legal guarantee of conformity (EU Directive 2019/771 transposed into Book VI of the Code of Economic Law). In the event of a non-conforming product, the buyer may contact the seller at [email de contact]." }],
    },
    {
      heading: "10. Complaints and mediation",
      blocks: [
        { type: "p", text: "Any complaint may be addressed to [email de contact]. If no amicable solution is reached, the buyer may refer the matter to the Belgian Consumer Mediation Service or to the European Online Dispute Resolution platform: https://ec.europa.eu/consumers/odr." },
      ],
    },
    {
      heading: "11. Personal data",
      blocks: [{ type: "p", text: "The processing of personal data is described in the privacy policy." }],
    },
    {
      heading: "12. Applicable law",
      blocks: [{ type: "p", text: "These terms and conditions are subject to Belgian law. Any dispute falls within the jurisdiction of the Belgian courts, without prejudice to the protective provisions applicable to the consumer." }],
    },
  ],
};

export default doc;
