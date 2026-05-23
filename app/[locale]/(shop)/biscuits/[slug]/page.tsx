import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getProductBySlug, type Locale } from "@/lib/queries/catalog";
import { ProductImages } from "@/components/shop/ProductImages";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProductBySlug(locale as Locale, slug);
  if (!p) return {};
  return { title: p.seoTitle, description: p.seoDescription };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const product = await getProductBySlug(locale as Locale, slug);
  if (!product) notFound();

  const priceEur = (product.basePriceCents / 100).toFixed(2);
  const isOut = product.stockQuantity <= 0;

  return (
    <article className="mx-auto grid max-w-6xl gap-12 px-6 py-12 md:grid-cols-2">
      <ProductImages images={product.images} name={product.name} />
      <div className="space-y-6">
        <h1 className="text-honey font-display text-4xl">{product.name}</h1>
        <p className="text-warm-brown text-lg">{product.shortDescription}</p>
        <p className="text-honey-dark font-mono text-3xl">{priceEur} €</p>
        <AddToCartButton productId={product.id} label={t("addToCart")} outOfStock={isOut} />
        <div className="text-warm-brown/80 prose-sm space-y-4 pt-6 leading-relaxed">
          <p>{product.longDescription}</p>
        </div>
        <details className="border-warm-brown/20 border-t pt-4">
          <summary className="cursor-pointer text-sm font-medium">Ingrédients</summary>
          <p className="text-warm-brown/80 mt-2 text-sm">{product.ingredients}</p>
        </details>
        {product.allergens.length > 0 && (
          <details className="border-warm-brown/20 border-t pt-4">
            <summary className="cursor-pointer text-sm font-medium">Allergènes</summary>
            <ul className="text-warm-brown/80 mt-2 list-disc pl-5 text-sm">
              {product.allergens.map((a) => <li key={a}>{a}</li>)}
            </ul>
          </details>
        )}
        <details className="border-warm-brown/20 border-t pt-4">
          <summary className="cursor-pointer text-sm font-medium">Valeurs nutritionnelles /100 g</summary>
          <table className="text-warm-brown/80 mt-2 w-full text-sm">
            <tbody>
              <tr><td>Énergie</td><td className="text-right">{product.nutritionalFactsPer100g.energy_kcal} kcal</td></tr>
              <tr><td>Matières grasses</td><td className="text-right">{product.nutritionalFactsPer100g.fat_g} g</td></tr>
              <tr><td>Glucides</td><td className="text-right">{product.nutritionalFactsPer100g.carbs_g} g</td></tr>
              <tr><td>Protéines</td><td className="text-right">{product.nutritionalFactsPer100g.protein_g} g</td></tr>
              <tr><td>Sel</td><td className="text-right">{product.nutritionalFactsPer100g.salt_g} g</td></tr>
            </tbody>
          </table>
        </details>
      </div>
    </article>
  );
}
