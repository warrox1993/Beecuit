import { Skeleton } from "@/components/ui/Skeleton";

export function CoffretCardSkeleton() {
  return (
    <article className="bg-cream-light border-warm-brown/8 overflow-hidden rounded-2xl border shadow-[0_8px_24px_-16px_rgba(44,24,16,0.22)]">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-baseline justify-between pt-1">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </article>
  );
}

export function CoffretGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <CoffretCardSkeleton key={i} />
      ))}
    </div>
  );
}
