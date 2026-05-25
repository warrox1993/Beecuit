import { Html, Head, Body, Container, Heading, Text } from "@react-email/components";

export function B2BQuoteRejected({
  contactName,
  reason,
}: {
  contactName: string;
  reason: string;
}) {
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
          <Heading style={{ color: "#E4A11B", fontSize: 24, margin: 0 }}>
            Au Fil des Saveurs — Demande non aboutie
          </Heading>
          <Text style={{ fontSize: 18 }}>Bonjour {contactName},</Text>
          <Text>
            Merci pour votre intérêt. Malheureusement, nous ne pouvons pas donner suite à votre
            demande&nbsp;:
          </Text>
          <Text style={{ whiteSpace: "pre-wrap", fontStyle: "italic" }}>{reason}</Text>
          <Text>N&apos;hésitez pas à nous recontacter pour toute autre demande.</Text>
        </Container>
      </Body>
    </Html>
  );
}
