"use client";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

/**
 * PageTransition — Au Fil des Saveurs (Phase 4D).
 *
 * Wraps the locale layout children in a keyed motion.div so each route
 * change cross-fades smoothly. Skipped entirely under prefers-reduced-motion.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  if (reduced) {
    return <>{children}</>;
  }
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
