import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
} from "@react-email/components";

export function SubscriptionBoxComposing({
  recipientName,
  cycleYearMonth,
  deadline,
  appBaseUrl,
}: {
  recipientName: string | null;
  cycleYearMonth: string;
  deadline: Date;
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
            {recipientName ? `Bonjour ${recipientName},` : "Bonjour,"}
          </Text>
          <Text>
            C&apos;est le moment de composer ta box de <strong>{cycleYearMonth}</strong> !
          </Text>
          <Text>
            Tu as jusqu&apos;au{" "}
            <strong>{deadline.toLocaleDateString("fr-BE")}</strong> pour choisir
            tes biscuits. Sans choix de ta part, on composera une box surprise
            à partir de nos best-sellers.
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
            Composer ma box
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
