"use client";
import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Stagger delay in seconds */
  delay?: number;
  /** Translate distance (px) for the entrance */
  y?: number;
  /** Duration in seconds */
  duration?: number;
  /** as element — defaults to div */
  as?: "div" | "section" | "article" | "li" | "header" | "footer";
  className?: string;
};

/**
 * Reveal — Au Fil des Saveurs (Phase 4D).
 *
 * Wraps children with a subtle fade-in + translate-y on viewport entry.
 * Respects prefers-reduced-motion (renders statically without transform).
 * Use sparingly: hero, story block, coffrets/featured rows, newsletter.
 */
export function Reveal({
  children,
  delay = 0,
  y = 12,
  duration = 0.45,
  as = "div",
  className,
}: Props) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  if (reduced) {
    const Tag = as as keyof React.JSX.IntrinsicElements;
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
