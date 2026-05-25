"use client";
import { Toaster } from "sonner";

/**
 * ToastProvider — Au Fil des Saveurs (Phase 4D).
 *
 * Wraps sonner Toaster with brand theming via classNames option.
 * Mounted once in the locale layout. Triggered from anywhere via:
 *   import { toast } from "sonner";
 *   toast.success("Ajouté au panier");
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      duration={3500}
      gap={10}
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast:
            "!bg-[var(--color-cream-light)] !text-[var(--color-warm-brown)] !border !border-[var(--color-honey-dark)]/35 !shadow-[0_18px_40px_-20px_rgba(44,24,16,0.35)] !rounded-2xl !font-display !py-3 !px-4",
          title: "!text-[var(--color-warm-brown)] !text-[0.95rem]",
          description: "!text-[var(--color-warm-brown)]/75 !text-[0.8rem]",
          success: "!border-[var(--color-leaf)]/55",
          error: "!border-[var(--color-terracotta)]/55",
          info: "!border-[var(--color-honey-dark)]/45",
          icon: "!text-[var(--color-honey-dark)]",
        },
      }}
    />
  );
}
