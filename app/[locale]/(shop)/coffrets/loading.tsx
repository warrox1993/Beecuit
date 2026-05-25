import { Container } from "@/components/ui-primitives/Container";
import { CoffretGridSkeleton } from "@/components/shop/CoffretCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CoffretsLoading() {
  return (
    <Container className="py-12">
      <header className="mb-10 space-y-3 text-center">
        <Skeleton className="mx-auto h-3 w-32" />
        <Skeleton className="mx-auto h-12 w-80" />
        <Skeleton className="mx-auto h-4 w-[28rem] max-w-full" />
      </header>
      <CoffretGridSkeleton count={3} />
    </Container>
  );
}
