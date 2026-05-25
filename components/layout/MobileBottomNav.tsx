"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * MobileBottomNav — Au Fil des Saveurs (Phase 4F).
 *
 * Fixed bottom navigation, mobile-only (md:hidden). 4 quick links:
 * Boutique, Coffrets, Panier, Compte. Active state honey-dark.
 * Page content gets pb-16 to clear this bar on mobile (handled in layout).
 */
export function MobileBottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const items = [
    {
      href: "/biscuits",
      label: t("bottomBoutique"),
      Icon: ShopIcon,
      match: (p: string) => p.startsWith("/biscuits"),
    },
    {
      href: "/coffrets",
      label: t("bottomCoffrets"),
      Icon: GiftIcon,
      match: (p: string) => p.startsWith("/coffrets"),
    },
    {
      href: "/panier",
      label: t("bottomPanier"),
      Icon: BasketIcon,
      match: (p: string) => p === "/panier",
    },
    {
      href: "/compte",
      label: t("bottomCompte"),
      Icon: UserIcon,
      match: (p: string) => p.startsWith("/compte"),
    },
  ] as const;

  return (
    <nav
      className="bg-cream-light/95 border-warm-brown/12 fixed inset-x-0 bottom-0 z-40 h-14 border-t backdrop-blur-md md:hidden"
      aria-label="Navigation rapide"
    >
      <ul className="mx-auto grid h-full max-w-md grid-cols-4">
        {items.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                className={cn(
                  "group flex w-full flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium transition-colors",
                  active ? "text-honey-dark" : "text-warm-brown/75 hover:text-honey-dark",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="bg-honey-dark absolute bottom-1 h-1 w-1 rounded-full"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ShopIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M5 9 h14 l-1 11 H6 z" strokeLinejoin="round" />
      <path d="M9 9 V6 a3 3 0 0 1 6 0 V9" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <rect x="3" y="9" width="18" height="11" rx="1.5" />
      <path d="M3 14 H21" />
      <path d="M12 9 V20" />
      <path d="M8 9 Q 8 5 12 5 Q 16 5 16 9" />
    </svg>
  );
}

function BasketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M4 7 L 7 19 H 17 L 20 7 Z" strokeLinejoin="round" />
      <path d="M8 7 L 12 3 L 16 7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="13" r="0.8" fill="currentColor" />
      <circle cx="15" cy="13" r="0.8" fill="currentColor" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20 c0-3.5 3.5-6 7-6 s7 2.5 7 6" strokeLinecap="round" />
    </svg>
  );
}
