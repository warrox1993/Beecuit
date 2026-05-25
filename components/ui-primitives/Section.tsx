import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  py?: "sm" | "md" | "lg";
  bg?: "default" | "surface-elev" | "elevated" | "cookie" | "chocolate";
  className?: string;
};

const PY = {
  sm: "py-12 md:py-16",
  md: "py-16 md:py-24",
  lg: "py-20 md:py-32",
} as const;

const BG = {
  default: "",
  "surface-elev": "bg-white",
  // Preferred for new Phase 4B+ components: warm cream-light tone
  elevated: "bg-surface-elevated",
  cookie: "bg-cookie/20",
  chocolate: "bg-surface-inverse text-text-inverse",
} as const;

export function Section({ children, py = "md", bg = "default", className }: Props) {
  return <section className={cn(PY[py], BG[bg], className)}>{children}</section>;
}
