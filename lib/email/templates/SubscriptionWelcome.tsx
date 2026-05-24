import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
} from "@react-email/components";

export function SubscriptionWelcome({
  recipientName,
  formatLabel,
  engagementLabel,
  appBaseUrl,
}: {
  recipientName: string | null;
  formatLabel: string;
  engagementLabel: string;
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
            {recipientName ? `Bonjour ${recipientName},` : "Bonjour,"}
          </Text>
          <Text>
            Ton abonnement BeeCuit <strong>{formatLabel}</strong> ({engagementLabel}){" "}
            est confirmé !
          </Text>
          <Text>
            Ta première box sera facturée et expédiée le 1er du mois prochain. En
            attendant, tu peux composer ta box dès le début du mois.
          </Text>
          <Button
            href={`${appBaseUrl}/fr/compte/abonnement`}
            style={{
              background: "#D4A574",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Gérer mon abonnement
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
