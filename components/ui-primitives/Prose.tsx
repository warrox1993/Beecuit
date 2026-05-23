import { cn } from "@/lib/utils";

export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-warm-brown/80 max-w-prose text-base leading-[1.6]", className)}>
      {children}
    </div>
  );
}
