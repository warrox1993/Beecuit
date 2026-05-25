"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  children,
  comingSoon = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  comingSoon?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href as Parameters<typeof Link>[0]["href"]}
      className={cn(
        "text-sm font-medium tracking-wide transition-colors",
        comingSoon && "text-warm-brown/60 hover:text-warm-brown/80",
        isActive ? "text-honey-dark" : "text-warm-brown hover:text-honey-dark",
        className,
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}
