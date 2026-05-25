import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Button,
} from "@react-email/components";

export function GiftCardDelivery({
  recipientName,
  purchaserEmail,
  amountCents,
  code,
  message,
  expiresAt,
  appBaseUrl,
}: {
  recipientName: string | null;
  purchaserEmail: string;
  amountCents: number;
  code: string;
  message: string | null;
  expiresAt: Date;
  appBaseUrl: string;
}) {
  const amount = `${(amountCents / 100).toFixed(2).replace(".", ",")} €`;
  const expires = expiresAt.toLocaleDateString("fr-BE");
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
            Au Fil des Saveurs
          </Heading>
          <Text style={{ fontSize: 18 }}>
            {recipientName ? `Bonjour ${recipientName},` : "Bonjour,"}
          </Text>
          <Text>
            <strong>{purchaserEmail}</strong> t&apos;a offert une carte cadeau
            Au Fil des Saveurs de <strong>{amount}</strong>.
          </Text>
          {message && (
            <Section
              style={{
                background: "#fff",
                padding: "16px",
                borderRadius: 8,
                margin: "16px 0",
              }}
            >
              <Text style={{ fontStyle: "italic", margin: 0 }}>
                « {message} »
              </Text>
            </Section>
          )}
          <Section
            style={{
              background: "#FFF8EC",
              padding: "20px",
              borderRadius: 8,
              textAlign: "center" as const,
              margin: "24px 0",
            }}
          >
            <Text style={{ fontSize: 12, color: "#8B6F47", margin: "0 0 8px" }}>
              TON CODE
            </Text>
            <Text
              style={{
                fontFamily: "monospace",
                fontSize: 22,
                letterSpacing: 2,
                margin: 0,
                fontWeight: 700,
              }}
            >
              {code}
            </Text>
          </Section>
          <Button
            href={`${appBaseUrl}/fr/biscuits`}
            style={{
              background: "#D4A574",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Utiliser ma carte
          </Button>
          <Hr style={{ margin: "24px 0" }} />
          <Text style={{ fontSize: 12, color: "#888" }}>
            Valable jusqu&apos;au {expires}. À appliquer au moment du paiement.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
