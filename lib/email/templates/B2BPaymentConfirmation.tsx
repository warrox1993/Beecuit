import { Html, Head, Body, Container, Heading, Text } from "@react-email/components";

export function B2BPaymentConfirmation({
  contactName,
  amountCents,
}: {
  contactName: string;
  amountCents: number;
}) {
  const amount = (amountCents / 100).toLocaleString("fr-BE", {
    style: "currency",
    currency: "EUR",
  });
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#FBF6EE", fontFamily: "system-ui" }}>
        <Container
          style={{
            maxWidth: 480,
            margin: "0 auto",
            padding: "32px 24px",
            color: "#4A332A",
          }}
        >
          <Heading style={{ color: "#E4A11B", fontSize: 28, margin: 0 }}>
            Paiement reçu&nbsp;✓
          </Heading>
          <Text style={{ fontSize: 18 }}>Merci {contactName} !</Text>
          <Text>
            Nous avons bien reçu votre paiement de <strong>{amount}</strong>.
          </Text>
          <Text>
            Notre équipe vous recontactera sous 24h pour confirmer la date de livraison et les
            détails logistiques.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
