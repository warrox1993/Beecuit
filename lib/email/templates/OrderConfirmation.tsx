import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
} from "@react-email/components";

type CoffretLineMetadata = {
  type?: "coffret";
  giftMessage?: string | null;
  packagingTier?: "standard" | "premium";
  snapshot?: {
    discountPercent: number;
    biscuits: Array<{
      biscuitId: string;
      name: string;
      quantity: number;
      unitPriceCents: number;
    }>;
  };
};

type Line = {
  name: string;
  quantity: number;
  lineTotalCents: number;
  metadata?: CoffretLineMetadata | null;
};

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
          <Text>Merci ! Ta commande #{orderNumber} est confirmée.</Text>
          <Section>
            {items.map((l, i) => {
              const isCoffret = l.metadata?.type === "coffret";
              return (
                <div key={`${l.name}-${i}`} style={{ marginBottom: 12 }}>
                  <Text style={{ margin: "4px 0", fontWeight: 600 }}>
                    {l.name} × {l.quantity} — {(l.lineTotalCents / 100).toFixed(2)} €
                  </Text>
                  {isCoffret && l.metadata?.snapshot?.biscuits && (
                    <>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#8B6F47",
                          margin: "4px 0 0 16px",
                        }}
                      >
                        Composition :
                      </Text>
                      <ul style={{ margin: "2px 0 0 32px", padding: 0 }}>
                        {l.metadata.snapshot.biscuits.map((b) => (
                          <li
                            key={b.biscuitId}
                            style={{ fontSize: 11, color: "#5C4A38" }}
                          >
                            {b.name} ×{b.quantity}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {isCoffret && l.metadata?.packagingTier === "premium" && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#D4A574",
                        margin: "4px 0 0 16px",
                      }}
                    >
                      Emballage premium (cire d&apos;abeille + ruban)
                    </Text>
                  )}
                  {isCoffret && l.metadata?.giftMessage && (
                    <Text
                      style={{
                        fontSize: 11,
                        fontStyle: "italic",
                        margin: "4px 0 0 16px",
                        color: "#5C4A38",
                      }}
                    >
                      Message cadeau : « {l.metadata.giftMessage} »
                    </Text>
                  )}
                </div>
              );
            })}
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
