import { setRequestLocale } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { products, productTranslations } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  getActiveSubscriptionForUser,
  getBoxForCycle,
  getBoxItems,
} from "@/lib/queries/subscriptions";
import { nextYearMonth } from "@/lib/subscription/dates";
import { BoxComposer } from "@/components/account/BoxComposer";
import { Container } from "@/components/ui-primitives/Container";
import { FORMAT_SIZES } from "@/lib/subscription/constants";

export const dynamic = "force-dynamic";

export default async function ProchaineBoxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/sign-in`);

  const sub = await getActiveSubscriptionForUser(session.user.id);
  if (!sub) notFound();

  const cycle = nextYearMonth();
  const box = await getBoxForCycle(sub.id, cycle);

  if (!box) {
    return (
      <Container className="py-12">
        <h1 className="text-3xl font-display text-warm-brown mb-4">
          Prochaine box
        </h1>
        <p className="text-warm-brown/70">
          Aucune box prévue pour le mois prochain. Elle sera créée le 1er du
          mois en cours par notre système.
        </p>
      </Container>
    );
  }

  const biscuits = await db
    .select({
      id: products.id,
      name: productTranslations.name,
      stockQuantity: products.stockQuantity,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${products.id} AND is_primary = true LIMIT 1)`,
    })
    .from(products)
    .innerJoin(
      productTranslations,
      and(
        eq(productTranslations.productId, products.id),
        eq(productTranslations.locale, locale as "fr"),
      ),
    )
    .where(and(eq(products.type, "biscuit"), eq(products.isActive, true)));

  const items = await getBoxItems(box.id, locale as "fr");
  const boxSize = FORMAT_SIZES[sub.format as keyof typeof FORMAT_SIZES];

  return (
    <Container className="py-12 space-y-6">
      <h1 className="text-3xl font-display text-warm-brown">
        Compose ta box de {cycle}
      </h1>
      <p className="text-warm-brown/70 text-sm">
        Deadline :{" "}
        {new Date(box.compositionDeadline).toLocaleDateString("fr-BE")} · Box
        size : {boxSize} sachets · Status : {box.status}
      </p>
      {box.status === "composing" ? (
        <BoxComposer
          boxId={box.id}
          boxSize={boxSize}
          biscuits={biscuits}
          initialItems={items.map((i) => ({
            biscuitId: i.biscuitId,
            quantity: i.quantity,
          }))}
        />
      ) : (
        <p className="text-warm-brown/70">
          La composition est verrouillée (status: {box.status}). Composé par :{" "}
          {box.composedBy ?? "—"}.
        </p>
      )}
    </Container>
  );
}
