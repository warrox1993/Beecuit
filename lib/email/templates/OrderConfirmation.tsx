import { Html, Head, Body, Container, Section, Heading, Text, Hr } from "@react-email/components";

type Line = { name: string; quantity: number; lineTotalCents: number };

export function OrderConfirmation({
  orderNumber,
  totalCents,
  items,
}: {
  orderNumber: string;
  totalCents: number;
  items: Line[];
}) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#FBF6EE", fontFamily: "system-ui" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px", color: "#4A332A" }}>
          <Heading style={{ color: "#E4A11B", fontSize: 28, margin: 0 }}>BeeCuit</Heading>
          <Text>Merci ! Ta commande #{orderNumber} est confirmée.</Text>
          <Section>
            {items.map((l, i) => (
              <Text key={`${l.name}-${i}`} style={{ margin: "4px 0" }}>
                {l.name} × {l.quantity} — {(l.lineTotalCents / 100).toFixed(2)} €
              </Text>
            ))}
          </Section>
          <Hr />
          <Text style={{ textAlign: "right", fontSize: 18 }}>
            <strong>Total : {(totalCents / 100).toFixed(2)} €</strong>
          </Text>
          <Text style={{ fontSize: 12, color: "#888" }}>
            On te tient au courant dès que ta commande est expédiée. À bientôt !
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
