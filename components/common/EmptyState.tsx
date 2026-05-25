import { type ReactNode } from "react";
import { DotFlourish, RopeDivider } from "@/components/brand/Ornaments";

/**
 * EmptyState — Au Fil des Saveurs (Phase 4E).
 *
 * Warm centered empty-state block with optional ornament icon (an SVG node),
 * Fraunces heading, body prose, and an optional CTA slot (link/button).
 */
export function EmptyState({
  ornament,
  title,
  description,
  cta,
  className,
}: {
  ornament?: ReactNode;
  title: string;
  description?: string;
  cta?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-cream-light border-warm-brown/10 mx-auto flex max-w-lg flex-col items-center rounded-3xl border px-8 py-14 text-center shadow-[0_18px_40px_-30px_rgba(44,24,16,0.25)] ${className ?? ""}`}
    >
      {ornament ? (
        <div className="text-honey-dark mb-4 inline-flex h-16 w-16 items-center justify-center">
          {ornament}
        </div>
      ) : (
        <DefaultOrnament />
      )}
      <DotFlourish className="text-honey-dark/55 mt-1 mb-4 h-2 w-14" />
      <h2 className="font-display text-warm-brown text-[1.5rem] leading-[1.2]">{title}</h2>
      {description && (
        <p className="text-warm-brown/75 mt-3 max-w-sm text-[0.95rem] leading-relaxed">
          {description}
        </p>
      )}
      {cta && <div className="mt-7">{cta}</div>}
      <RopeDivider variant="straight" className="text-honey-dark/40 mt-8 w-16" />
    </div>
  );
}

/** Default gift-box outline icon for empty cart/orders. */
function DefaultOrnament() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="text-honey-dark/80 h-14 w-14"
      role="presentation"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="10" y="22" width="44" height="32" rx="3" />
      <path d="M10 32 L 54 32" />
      <path d="M32 22 L 32 54" />
      <path d="M22 22 Q 22 12 32 12 Q 42 12 42 22" />
    </svg>
  );
}
