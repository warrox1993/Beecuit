"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type FlyEvent = {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

declare global {
  interface WindowEventMap {
    "afds:fly-to-cart": CustomEvent<{ fromX: number; fromY: number }>;
  }
}

/**
 * FlyToCart — Au Fil des Saveurs (Phase 4D signature interaction).
 *
 * Mounted globally in the locale layout. Listens for `afds:fly-to-cart`
 * custom events fired by AddToCartButton, then animates a small gold
 * biscuit token in an arc from the click position toward the cart icon
 * (DOM element with id="cart-icon-anchor"). Lasts ~600ms.
 *
 * Reduced motion: events are silently ignored — toast still informs the user.
 */
export function FlyToCart() {
  const [tokens, setTokens] = useState<FlyEvent[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    function onFly(e: WindowEventMap["afds:fly-to-cart"]) {
      const anchor = document.getElementById("cart-icon-anchor");
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const toX = rect.left + rect.width / 2;
      const toY = rect.top + rect.height / 2;
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      setTokens((cur) => [
        ...cur,
        { id, fromX: e.detail.fromX, fromY: e.detail.fromY, toX, toY },
      ]);
      // Cart bump
      anchor.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.18)", offset: 0.6 },
          { transform: "scale(1)" },
        ],
        { duration: 350, delay: 480, easing: "ease-out" },
      );
    }
    window.addEventListener("afds:fly-to-cart", onFly);
    return () => window.removeEventListener("afds:fly-to-cart", onFly);
  }, [reduced]);

  function remove(id: string) {
    setTokens((cur) => cur.filter((t) => t.id !== id));
  }

  if (reduced) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" aria-hidden>
      <AnimatePresence>
        {tokens.map((t) => {
          const dx = t.toX - t.fromX;
          const dy = t.toY - t.fromY;
          // Arc apex offset (raise mid-trajectory by 40% of distance)
          const apexY = Math.min(dy, 0) - Math.abs(dx) * 0.25;
          return (
            <motion.span
              key={t.id}
              initial={{
                left: t.fromX,
                top: t.fromY,
                scale: 1,
                opacity: 1,
              }}
              animate={{
                left: [t.fromX, t.fromX + dx * 0.5, t.toX],
                top: [t.fromY, t.fromY + apexY, t.toY],
                scale: [1, 0.85, 0.35],
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.65,
                ease: "easeInOut",
                times: [0, 0.55, 1],
              }}
              onAnimationComplete={() => remove(t.id)}
              style={{
                position: "fixed",
                width: 26,
                height: 26,
                marginLeft: -13,
                marginTop: -13,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 35% 30%, #f4c87a 0%, #c9a368 55%, #8b6a2e 100%)",
                boxShadow:
                  "0 4px 12px rgba(176,122,14,0.4), inset 0 -2px 4px rgba(74,51,42,0.35)",
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
