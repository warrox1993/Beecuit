import Link from "next/link";
import Image from "next/image";

// Server component: looks up the FR product translation by slug and renders a
// compact card linking to the public detail page. Returns null silently if the
// slug doesn't resolve so a stale embed doesn't crash the article.
// The DB-touching query is imported lazily so that unit tests can import the
// renderer without hitting env/db validation at module load.
export async function InlineProductCard({ slug }: { slug: string }) {
  const { getProductBySlug } = await import("@/lib/queries/catalog");
  const product = await getProductBySlug("fr", slug);
  if (!product) return null;

  const primary =
    product.images.find((i) => i.isPrimary) ?? product.images[0] ?? null;

  return (
    <Link
      href={`/fr/biscuits/${slug}`}
      className="border-honey/40 my-6 flex items-center gap-4 rounded border bg-white p-4 transition hover:shadow-md"
    >
      {primary && (
        <div className="relative h-20 w-20 flex-shrink-0">
          <Image
            src={primary.url}
            alt={primary.altText ?? product.name}
            fill
            sizes="80px"
            className="rounded object-cover"
          />
        </div>
      )}
      <div>
        <div className="text-warm-brown font-display text-lg">{product.name}</div>
        <div className="text-warm-brown/60 text-sm">Découvrir →</div>
      </div>
    </Link>
  );
}
