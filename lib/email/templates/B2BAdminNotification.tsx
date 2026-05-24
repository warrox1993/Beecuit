import { Html, Head, Body, Container, Heading, Text, Button } from "@react-email/components";

export function B2BAdminNotification({
  companyName,
  contactName,
  email,
  requestedProducts,
  adminUrl,
}: {
  companyName: string;
  contactName: string;
  email: string;
  requestedProducts: string;
  adminUrl: string;
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
            Nouveau devis B2B
          </Heading>
          <Text>
            <strong>{companyName}</strong> ({contactName}, {email})
          </Text>
          <Text>{requestedProducts}</Text>
          <Button
            href={adminUrl}
            style={{
              background: "#D4A574",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Ouvrir dans l&apos;admin
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
