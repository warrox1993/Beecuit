import { cn } from "@/lib/utils";

type Props = {
  as?: "h1" | "h2" | "h3";
  size?: "display" | "h1" | "h2" | "h3";
  children: React.ReactNode;
  className?: string;
};

const SIZE = {
  display:
    "font-display font-medium tracking-[-0.02em] leading-[1.0] text-[clamp(2.5rem,6vw,5rem)]",
  h1: "font-display font-medium tracking-[-0.02em] leading-[1.1] text-[clamp(2rem,4vw,3.5rem)]",
  h2: "font-display font-medium leading-[1.15] text-[clamp(1.5rem,3vw,2.5rem)]",
  h3: "font-display font-medium text-[1.25rem] md:text-[1.5rem]",
} as const;

export function Heading({ as = "h2", size, children, className }: Props) {
  const Tag = as;
  const effectiveSize = size ?? as;
  return <Tag className={cn(SIZE[effectiveSize], "text-warm-brown", className)}>{children}</Tag>;
}
