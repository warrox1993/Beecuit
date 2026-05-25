import type { ReactNode } from "react";

export function Callout({
  variant,
  children,
}: {
  variant: "note" | "astuce" | "attention";
  children: ReactNode;
}) {
  const styles = {
    note: "bg-cream border-warm-brown/20",
    astuce: "bg-honey/10 border-honey/40",
    attention: "bg-terracotta/10 border-terracotta/40",
  } as const;
  return (
    <div className={`my-6 rounded border-l-4 p-4 ${styles[variant]}`}>
      {children}
    </div>
  );
}
