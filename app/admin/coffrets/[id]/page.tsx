import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  products,
  productTranslations,
  productImages,
  coffretContents,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { CoffretForm, type CoffretLocaleTranslations } from "@/components/admin/CoffretForm";
import { ImageUploader } from "@/components/admin/ImageUploader";

export const dynamic = "force-dynamic";

export default async function EditCoffretPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [prod] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.type, "coffret")))
    .limit(1);
  if (!prod) notFound();

  const [trans, imgs, contents, biscuits] = await Promise.all([
    db.select().from(productTranslations).where(eq(productTranslations.productId, id)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.sortOrder),
    db
      .select({
        biscuitId: coffretContents.biscuitId,
        quantity: coffretContents.quantity,
      })
      .from(coffretContents)
      .where(eq(coffretContents.coffretId, id)),
    db
      .select({
        id: products.id,
        sku: products.sku,
        basePriceCents: products.basePriceCents,
        name: productTranslations.name,
      })
      .from(products)
      .innerJoin(
        productTranslations,
        and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, "fr")),
      )
      .where(and(eq(products.type, "biscuit"), eq(products.isActive, true)))
      .orderBy(products.sku),
  ]);

  const emptyTrans = {
    name: "",
    slug: "",
    shortDescription: "",
    longDescription: "",
    seoTitle: "",
    seoDescription: "",
  };
  const byLocale: CoffretLocaleTranslations = {
    fr: { ...emptyTrans },
    nl: { ...emptyTrans },
    de: { ...emptyTrans },
    en: { ...emptyTrans },
  };
  for (const t of trans) {
    byLocale[t.locale as "fr" | "nl" | "de" | "en"] = {
      name: t.name,
      slug: t.slug,
      shortDescription: t.shortDescription,
      longDescription: t.longDescription,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
    };
  }

  return (
    <div>
      <h1 className="text-honey font-display mb-6 text-3xl">Édition coffret</h1>
      <section className="border-warm-brown/10 mb-6 rounded-lg border bg-white p-4">
        <h2 className="font-display text-warm-brown mb-2 text-lg">Images</h2>
        <ImageUploader
          productId={prod.id}
          images={imgs.map((i) => ({ id: i.id, url: i.url, isPrimary: i.isPrimary }))}
        />
      </section>
      <CoffretForm
        biscuits={biscuits}
        initial={{
          id: prod.id,
          sku: prod.sku,
          weightGrams: prod.weightGrams,
          discountPercent: prod.discountPercent ?? 0,
          isActive: prod.isActive,
          isFeatured: prod.isFeatured,
          contents,
          translations: byLocale,
        }}
      />
    </div>
  );
}
