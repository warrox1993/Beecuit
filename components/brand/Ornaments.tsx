import { cn } from "@/lib/utils";

/**
 * Brand ornaments — Au Fil des Saveurs.
 *
 * All SVGs use `currentColor` so the parent text-* class controls the stroke/fill.
 * Inspired by the gold cordage motif on the chocolate-box reference sticker.
 */

type DividerVariant = "wave" | "straight" | "scallop";

export function RopeDivider({
  variant = "wave",
  className,
  ariaLabel,
}: {
  variant?: DividerVariant;
  className?: string;
  ariaLabel?: string;
}) {
  const role = ariaLabel ? "img" : "presentation";
  const props = ariaLabel
    ? { role, "aria-label": ariaLabel }
    : { role, "aria-hidden": true as const };
  if (variant === "straight") {
    return (
      <svg
        viewBox="0 0 200 8"
        preserveAspectRatio="none"
        className={cn("h-2 w-full", className)}
        {...props}
      >
        <line
          x1="0"
          y1="4"
          x2="200"
          y2="4"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <circle cx="100" cy="4" r="2" fill="currentColor" />
      </svg>
    );
  }
  if (variant === "scallop") {
    return (
      <svg
        viewBox="0 0 200 10"
        preserveAspectRatio="none"
        className={cn("h-2.5 w-full", className)}
        {...props}
      >
        <path
          d="M0 8 Q 10 0 20 8 T 40 8 T 60 8 T 80 8 T 100 8 T 120 8 T 140 8 T 160 8 T 180 8 T 200 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  // wave (default) — two intertwined sine waves like a braid
  return (
    <svg
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className={cn("h-3 w-full", className)}
      {...props}
    >
      <path
        d="M0 6 Q 12.5 0 25 6 T 50 6 T 75 6 T 100 6 T 125 6 T 150 6 T 175 6 T 200 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M0 6 Q 12.5 12 25 6 T 50 6 T 75 6 T 100 6 T 125 6 T 150 6 T 175 6 T 200 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

type Corner = "tl" | "tr" | "bl" | "br";

const CORNER_TRANSFORM: Record<Corner, string> = {
  tl: "",
  tr: "scale(-1, 1) translate(-40, 0)",
  bl: "scale(1, -1) translate(0, -40)",
  br: "scale(-1, -1) translate(-40, -40)",
};

export function CornerScallop({
  corner = "tl",
  className,
}: {
  corner?: Corner;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-10 w-10", className)}
      role="presentation"
      aria-hidden
    >
      <g transform={CORNER_TRANSFORM[corner]}>
        {/* L-shaped scallop ornament — small dome arcs forming a corner */}
        <path
          d="M2 8 Q 6 4 10 8 T 18 8 T 26 8 T 34 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <path
          d="M8 2 Q 4 6 8 10 T 8 18 T 8 26 T 8 34"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
        <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      </g>
    </svg>
  );
}

/**
 * Three-diamond flourish centered separator: ◆ • ◆
 * Used for centered hero/section transitions.
 */
export function DotFlourish({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 8"
      className={cn("h-2 w-15", className)}
      role="presentation"
      aria-hidden
    >
      <path d="M6 4 L 10 1 L 14 4 L 10 7 Z" fill="currentColor" />
      <circle cx="30" cy="4" r="1.5" fill="currentColor" />
      <path d="M46 4 L 50 1 L 54 4 L 50 7 Z" fill="currentColor" />
    </svg>
  );
}
