"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

const LEFT_PATH =
  "M0,-60 A60,60 0 0,0 0,60 L6,45 L-5,30 L5,15 L-6,0 L5,-15 L-5,-30 L6,-45 Z";
const RIGHT_PATH =
  "M0,-60 A60,60 0 0,1 0,60 L6,45 L-5,30 L5,15 L-6,0 L5,-15 L-5,-30 L6,-45 Z";
const ARC_LEFT = "M0,-60 A60,60 0 0,0 0,60";
const ARC_RIGHT = "M0,-60 A60,60 0 0,1 0,60";

type Crumb = { id: number; x: number; size: number; dx: number; dy: number; rot: number; delay: number; dur: number };

export function CrackingCookie({ size = 132 }: { size?: number }) {
  const reduce = useReducedMotion();

  const crumbs = useMemo<Crumb[]>(() => {
    if (reduce) return [];
    return Array.from({ length: 9 }, (_, i) => ({
      id: i,
      x: Math.random() * 22 - 11,
      size: 3 + Math.random() * 4,
      dx: Math.random() * 46 - 23,
      dy: 40 + Math.random() * 46,
      rot: Math.random() * 180 - 90,
      delay: 0.98 + Math.random() * 0.12,
      dur: 0.65 + Math.random() * 0.45,
    }));
  }, [reduce]);

  const drop = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } }
    : {
        initial: { opacity: 0, y: -46, rotate: -8 },
        animate: { opacity: 1, y: 0, rotate: 0 },
        transition: { type: "spring" as const, stiffness: 320, damping: 16, delay: 0.12 },
      };

  const halfTransition = { duration: 0.7, ease: [0.3, 0.7, 0.3, 1] as const, delay: 0.8 };

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <motion.svg
        viewBox="-72 -72 144 144"
        width={size}
        height={size}
        style={{ overflow: "visible", display: "block" }}
        aria-hidden
        initial={drop.initial}
        animate={drop.animate}
        transition={drop.transition}
      >
        <defs>
          <radialGradient id="cc-dough" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#eabf72" />
            <stop offset="55%" stopColor="#d59a3e" />
            <stop offset="100%" stopColor="#a9731f" />
          </radialGradient>
          <radialGradient id="cc-doughR" cx="58%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#e7ba6a" />
            <stop offset="55%" stopColor="#cf9339" />
            <stop offset="100%" stopColor="#a06d1d" />
          </radialGradient>
          <filter id="cc-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#3d2817" floodOpacity="0.28" />
          </filter>
        </defs>

        <ellipse cx="0" cy="60" rx="46" ry="8" fill="#3d2817" opacity="0.12" />

        <g filter="url(#cc-soft)">
          <motion.g
            initial={reduce ? undefined : { x: 0, y: 0, rotate: 0 }}
            animate={reduce ? undefined : { x: -13, y: 4, rotate: -7 }}
            transition={halfTransition}
          >
            <path d={LEFT_PATH} fill="url(#cc-dough)" stroke="#7a5320" strokeWidth="2.5" strokeLinejoin="round" />
            <path d={ARC_LEFT} fill="none" stroke="#f3d49a" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
            <ellipse cx="-30" cy="-18" rx="7" ry="6" fill="#5a371a" />
            <ellipse cx="-18" cy="22" rx="6" ry="5.5" fill="#4a2c14" />
            <ellipse cx="-40" cy="14" rx="5" ry="4.5" fill="#5a371a" />
            <ellipse cx="-22" cy="-40" rx="4.5" ry="4" fill="#4a2c14" />
            <circle cx="-12" cy="-8" r="1.4" fill="#fbe7c0" opacity="0.8" />
            <circle cx="-34" cy="-2" r="1.2" fill="#fbe7c0" opacity="0.7" />
          </motion.g>

          <motion.g
            initial={reduce ? undefined : { x: 0, y: 0, rotate: 0 }}
            animate={reduce ? undefined : { x: 13, y: 5, rotate: 7 }}
            transition={halfTransition}
          >
            <path d={RIGHT_PATH} fill="url(#cc-doughR)" stroke="#7a5320" strokeWidth="2.5" strokeLinejoin="round" />
            <path d={ARC_RIGHT} fill="none" stroke="#f3d49a" strokeWidth="2" opacity="0.45" strokeLinecap="round" />
            <ellipse cx="30" cy="-22" rx="7" ry="6" fill="#5a371a" />
            <ellipse cx="20" cy="20" rx="6" ry="5.5" fill="#4a2c14" />
            <ellipse cx="40" cy="6" rx="5" ry="4.5" fill="#5a371a" />
            <ellipse cx="26" cy="44" rx="4.5" ry="4" fill="#4a2c14" />
            <circle cx="16" cy="-6" r="1.4" fill="#fbe7c0" opacity="0.8" />
            <circle cx="34" cy="-12" r="1.2" fill="#fbe7c0" opacity="0.7" />
          </motion.g>
        </g>
      </motion.svg>

      {crumbs.map((c) => (
        <motion.span
          key={c.id}
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "62%",
            width: c.size,
            height: c.size,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #c98f3f, #8a5f16)",
            marginLeft: c.x,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: c.dx, y: c.dy, opacity: 0, rotate: c.rot }}
          transition={{ delay: c.delay, duration: c.dur, ease: [0.3, 0.6, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
