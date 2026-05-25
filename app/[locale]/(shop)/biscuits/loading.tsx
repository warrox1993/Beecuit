import { Container } from "@/components/ui-primitives/Container";
import { ProductGridSkeleton } from "@/components/shop/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BiscuitsLoading() {
  return (
    <Container className="py-12">
      <header className="mb-10 space-y-3 text-center">
        <Skeleton className="mx-auto h-3 w-32" />
        <Skeleton className="mx-auto h-10 w-72" />
        <Skeleton className="mx-auto h-4 w-96" />
      </header>
      <div className="md:flex md:gap-10">
        <div className="hidden md:block md:w-60">
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-32 rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </Container>
  );
}
