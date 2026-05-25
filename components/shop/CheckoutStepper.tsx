import { cn } from "@/lib/utils";

/**
 * CheckoutStepper — Au Fil des Saveurs (Phase 4G).
 *
 * Decorative 4-step indicator (Panier → Livraison → Paiement → Confirmation).
 * Active step is passed by index (0-based). No navigation logic — purely visual.
 */
const STEPS = ["Panier", "Livraison", "Paiement", "Confirmation"] as const;

export function CheckoutStepper({ activeStep = 1 }: { activeStep?: number }) {
  return (
    <nav aria-label="Étapes du paiement" className="mx-auto mb-10 max-w-2xl">
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((label, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <div
                aria-current={active ? "step" : undefined}
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm transition-colors",
                  done
                    ? "bg-honey-dark text-cream"
                    : active
                      ? "border-honey-dark text-honey-dark bg-cream-light border-2"
                      : "border-warm-brown/25 text-warm-brown/45 border",
                )}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M5 12 L 10 17 L 19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "hidden text-[0.75rem] font-medium tracking-wide uppercase md:inline",
                  done || active ? "text-warm-brown" : "text-warm-brown/45",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "h-px flex-1",
                    done ? "bg-honey-dark/50" : "bg-warm-brown/15",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
