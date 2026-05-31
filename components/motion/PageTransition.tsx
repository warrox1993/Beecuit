"use client";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";

/**
 * PageTransition — Au Fil des Saveurs (Phase 4D).
 *
 * Wraps the locale layout children in a keyed motion.div so each route
 * change cross-fades smoothly. Skipped entirely under prefers-reduced-motion.
 *
 * The INITIAL load renders at full opacity (no fade): fading the whole page in
 * from opacity 0 would (a) hide the LCP element from Chrome → Lighthouse reports
 * NO_LCP, and (b) add a needless 300ms delay before content is visible. We only
 * cross-fade on subsequent client-side navigations.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const isFirstRender = useRef(true);
  const skipEnter = isFirstRender.current;
  isFirstRender.current = false;

  if (reduced) {
    return <>{children}</>;
  }
  return (
    <motion.div
      key={pathname}
      initial={skipEnter ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
