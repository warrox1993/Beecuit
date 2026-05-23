import { ProductCard } from "./ProductCard";

type GridProduct = React.ComponentProps<typeof ProductCard>;

export function ProductGrid({ products }: { products: GridProduct[] }) {
  if (products.length === 0) {
    return <p className="text-warm-brown/70 py-12 text-center">Aucun biscuit trouvé.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.slug} {...p} />
      ))}
    </div>
  );
}
