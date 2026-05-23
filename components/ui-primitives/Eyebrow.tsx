import { cn } from "@/lib/utils";

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-honey-dark text-xs font-semibold uppercase tracking-[0.1em]", className)}>
      {children}
    </p>
  );
}
