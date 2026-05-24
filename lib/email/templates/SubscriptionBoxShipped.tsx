import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from "@react-email/components";

type Biscuit = { name: string; quantity: number };

export function SubscriptionBoxShipped({
  recipientName,
  cycleYearMonth,
  biscuits,
  appBaseUrl,
}: {
  recipientName: string | null;
  cycleYearMonth: string;
  biscuits: Biscuit[];
  appBaseUrl: string;
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
          <Heading style={{ color: "#E4A11B", fontSize: 28, margin: 0 }}>
            BeeCuit
          </Heading>
          <Text style={{ fontSize: 18 }}>
            {recipientName ? `${recipientName},` : "Bonjour,"}
          </Text>
          <Text>
            Ta box de <strong>{cycleYearMonth}</strong> est en route !
          </Text>
          <Hr />
          <Text style={{ fontSize: 13, color: "#8B6F47", margin: "4px 0" }}>
            Contenu :
          </Text>
          <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
            {biscuits.map((b, i) => (
              <li key={i} style={{ fontSize: 13, color: "#5C4A38" }}>
                {b.name} ×{b.quantity}
              </li>
            ))}
          </ul>
          <Hr />
          <Text style={{ fontSize: 12, color: "#888" }}>
            Suivi disponible dans ton{" "}
            <a
              href={`${appBaseUrl}/fr/compte/commandes`}
              style={{ color: "#D4A574" }}
            >
              espace commandes
            </a>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
