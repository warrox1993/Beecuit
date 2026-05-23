import { Html, Head, Body, Container, Heading, Text, Link } from "@react-email/components";

export function OrderShipped({ orderNumber, trackingUrl }: { orderNumber: string; trackingUrl: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#FBF6EE", fontFamily: "system-ui" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px", color: "#4A332A" }}>
          <Heading style={{ color: "#E4A11B", fontSize: 28, margin: 0 }}>BeeCuit</Heading>
          <Text>Ta commande #{orderNumber} est en route 📦</Text>
          <Text>
            Tu peux suivre la livraison ici :{" "}
            <Link href={trackingUrl} style={{ color: "#B07A0E" }}>{trackingUrl}</Link>
          </Text>
          <Text style={{ fontSize: 12, color: "#888" }}>
            Livraison estimée sous 24-48h ouvrées par bpost Express.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
