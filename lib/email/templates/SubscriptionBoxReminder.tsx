import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
} from "@react-email/components";

export function SubscriptionBoxReminder({
  recipientName,
  cycleYearMonth,
  appBaseUrl,
}: {
  recipientName: string | null;
  cycleYearMonth: string;
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
            Au Fil des Saveurs
          </Heading>
          <Text style={{ fontSize: 18 }}>
            {recipientName ? `${recipientName},` : "Bonjour,"}
          </Text>
          <Text>
            Plus que <strong>3 jours</strong> pour composer ta box de{" "}
            <strong>{cycleYearMonth}</strong> ! Au-delà, on composera pour toi.
          </Text>
          <Button
            href={`${appBaseUrl}/fr/compte/abonnement/prochaine-box`}
            style={{
              background: "#D4A574",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Composer ma box maintenant
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
