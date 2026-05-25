import { cn } from "@/lib/utils";

/**
 * Skeleton — Au Fil des Saveurs (Phase 4E).
 *
 * Honey-cream themed shimmer block. CSS-only animation
 * via gradient + bg-position keyframes defined in globals.css.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "bg-cookie/15 relative isolate overflow-hidden rounded-md",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-cream-light before:to-transparent",
        "before:animate-[afds-shimmer_1.6s_ease-in-out_infinite]",
        // Reduced motion: no shimmer, just static tinted block
        "motion-reduce:before:hidden",
        className,
      )}
    />
  );
}
