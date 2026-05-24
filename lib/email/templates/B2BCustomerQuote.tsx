import { Html, Head, Body, Container, Heading, Text, Button, Hr } from "@react-email/components";

export function B2BCustomerQuote({
  contactName,
  amountCents,
  description,
  paymentLinkUrl,
  expiresAt,
}: {
  contactName: string;
  amountCents: number;
  description: string;
  paymentLinkUrl: string;
  expiresAt: Date;
}) {
  const amount = (amountCents / 100).toLocaleString("fr-BE", {
    style: "currency",
    currency: "EUR",
  });
  const expiry = expiresAt.toLocaleDateString("fr-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#FBF6EE", fontFamily: "system-ui" }}>
        <Container
          style={{
            maxWidth: 520,
            margin: "0 auto",
            padding: "32px 24px",
            color: "#4A332A",
          }}
        >
          <Heading style={{ color: "#E4A11B", fontSize: 28, margin: 0 }}>BeeCuit</Heading>
          <Text style={{ fontSize: 18 }}>Bonjour {contactName},</Text>
          <Text>Voici votre devis personnalisé&nbsp;:</Text>
          <Hr />
          <Text style={{ whiteSpace: "pre-wrap" }}>{description}</Text>
          <Text style={{ fontSize: 22 }}>
            <strong>Total&nbsp;: {amount}</strong> TTC
          </Text>
          <Hr />
          <Text>
            Pour valider la commande, payez via le lien sécurisé ci-dessous (valide jusqu&apos;au{" "}
            {expiry})&nbsp;:
          </Text>
          <Button
            href={paymentLinkUrl}
            style={{
              background: "#D4A574",
              color: "#fff",
              padding: "14px 28px",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: 16,
            }}
          >
            Payer le devis
          </Button>
          <Text style={{ fontSize: 12, color: "#8a6f60" }}>
            Une question&nbsp;? Répondez simplement à cet email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
