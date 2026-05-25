import { cn } from "@/lib/utils";

type LogoProps = {
  /**
   * Logo composition variant.
   * - `full`: full lockup with chef toque, wordmark, baseline (square ~240).
   * - `wordmark`: 2-line wordmark only, no toque, no baseline (~280×90). Best for compact headers.
   * - `mark`: chef toque inside a circle (~64). Best for favicon, social cards, avatars.
   * @default "full"
   */
  variant?: "full" | "wordmark" | "mark";
  className?: string;
};

/**
 * Au Fil des Saveurs brand logo — placeholder SVG.
 *
 * Theming is done via `currentColor`: pass a `text-*` class to color it.
 * The script word ("Saveurs") inherits the same color — Phase 4B may add
 * a dedicated accent layer once the client's final logo arrives.
 */
export function Logo({ variant = "full", className }: LogoProps) {
  if (variant === "mark") return <LogoMark className={className} />;
  if (variant === "wordmark") return <LogoWordmark className={className} />;
  return <LogoFull className={className} />;
}

function LogoFull({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Au Fil des Saveurs — Biscuiterie Fine & Gourmet"
      className={cn("inline-block", className)}
    >
      <title>Au Fil des Saveurs</title>
      {/* Top rope ornament — gentle arched flourishes evoking the client sticker */}
      <RopeOrnamentTop />
      {/* Chef toque centered above the wordmark */}
      <ChefToque cx={120} cy={62} size={22} />
      {/* "AU FIL DES" caps line */}
      <text
        x={120}
        y={112}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={18}
        letterSpacing={6}
        fill="currentColor"
      >
        AU FIL DES
      </text>
      {/* "Saveurs" script word — the emotional anchor */}
      <text
        x={120}
        y={160}
        textAnchor="middle"
        fontFamily="var(--font-script)"
        fontSize={54}
        fontStyle="italic"
        fill="currentColor"
      >
        Saveurs
      </text>
      {/* Baseline */}
      <text
        x={120}
        y={188}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={10}
        letterSpacing={4}
        fillOpacity={0.75}
        fill="currentColor"
      >
        BISCUITERIE FINE
      </text>
      <text
        x={120}
        y={202}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={10}
        letterSpacing={4}
        fillOpacity={0.75}
        fill="currentColor"
      >
        &amp; GOURMET
      </text>
      {/* Bottom rope ornament — mirror of the top one */}
      <RopeOrnamentBottom />
    </svg>
  );
}

function LogoWordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 90"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Au Fil des Saveurs"
      className={cn("inline-block", className)}
    >
      <title>Au Fil des Saveurs</title>
      <text
        x={140}
        y={28}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={16}
        letterSpacing={6}
        fill="currentColor"
      >
        AU FIL DES
      </text>
      <text
        x={140}
        y={74}
        textAnchor="middle"
        fontFamily="var(--font-script)"
        fontSize={48}
        fontStyle="italic"
        fill="currentColor"
      >
        Saveurs
      </text>
    </svg>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Au Fil des Saveurs"
      className={cn("inline-block", className)}
    >
      <title>Au Fil des Saveurs</title>
      <circle
        cx={32}
        cy={32}
        r={30}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        opacity={0.6}
      />
      <ChefToque cx={32} cy={34} size={18} />
    </svg>
  );
}

/**
 * Stylised chef toque — outline only, uses currentColor.
 * Three puffy circles on top of a hatband rectangle.
 */
function ChefToque({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const bandW = size * 1.7;
  const bandH = size * 0.32;
  const puffR = size * 0.55;
  const bandY = cy + size * 0.2;
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <rect x={cx - bandW / 2} y={bandY} width={bandW} height={bandH} rx={1.5} />
      <circle cx={cx} cy={cy - size * 0.45} r={puffR} />
      <circle cx={cx - puffR * 0.85} cy={cy - size * 0.1} r={puffR * 0.8} />
      <circle cx={cx + puffR * 0.85} cy={cy - size * 0.1} r={puffR * 0.8} />
    </g>
  );
}

/**
 * Top rope ornament — two arched curves with small flourish curls at the ends,
 * inspired by the client sticker. Hairline strokes for an elegant feel.
 */
function RopeOrnamentTop() {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      opacity={0.55}
    >
      {/* Main arch */}
      <path d="M 50 70 Q 120 30 190 70" />
      {/* Inner shorter arch echo */}
      <path d="M 75 70 Q 120 50 165 70" opacity={0.7} />
      {/* End curls (left & right) */}
      <path d="M 50 70 q -4 -3 -2 -7 q 2 -3 5 -1" />
      <path d="M 190 70 q 4 -3 2 -7 q -2 -3 -5 -1" />
    </g>
  );
}

/**
 * Bottom rope ornament — mirrors the top one, framing the baseline.
 */
function RopeOrnamentBottom() {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      opacity={0.55}
    >
      <path d="M 50 215 Q 120 235 190 215" />
      <path d="M 75 215 Q 120 225 165 215" opacity={0.7} />
      <path d="M 50 215 q -4 3 -2 7 q 2 3 5 1" />
      <path d="M 190 215 q 4 3 2 7 q -2 3 -5 1" />
    </g>
  );
}
