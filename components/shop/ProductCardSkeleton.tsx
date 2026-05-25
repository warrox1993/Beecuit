import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="block">
      <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
