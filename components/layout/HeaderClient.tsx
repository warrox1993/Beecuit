"use client";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * HeaderClient — Au Fil des Saveurs (Phase 4E).
 *
 * Wraps the server Header content with a scroll listener. When the user
 * scrolls past 8px, the header shrinks height + adds backdrop-blur + soft
 * shadow. CSS transitions handle the animation; reduced-motion users still
 * get the sizing but without smooth easing.
 */
export function HeaderClient({
  children,
}: {
  children: ReactNode;
}) {
  const [shrunk, setShrunk] = useState(false);

  useEffect(() => {
    // Hysteresis: shrink past 32px, expand below 8px. Prevents flicker when
    // scrollY micro-oscillates around a single threshold (trackpad inertia).
    function onScroll() {
      const y = window.scrollY;
      setShrunk((prev) => (prev ? y > 8 : y > 32));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-shrunk={shrunk ? "true" : "false"}
      className={cn(
        "group/header sticky top-0 z-50 border-b transition-all duration-300 ease-out",
        shrunk
          ? "bg-cream/85 border-warm-brown/15 shadow-[0_2px_12px_-2px_rgba(44,24,16,0.08)] backdrop-blur-md"
          : "bg-cream/95 border-warm-brown/10 backdrop-blur-sm",
      )}
    >
      {children}
    </header>
  );
}
