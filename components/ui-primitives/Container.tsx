import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  variant?: "default" | "narrow";
  className?: string;
};

export function Container({ children, variant = "default", className }: Props) {
  return (
    <div
      className={cn(
        "mx-auto px-6 md:px-8",
        variant === "default" ? "max-w-6xl" : "max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
