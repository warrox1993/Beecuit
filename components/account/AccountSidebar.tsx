"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/compte", labelKey: "dashboard" },
  { href: "/compte/commandes", labelKey: "orders" },
  { href: "/compte/adresses", labelKey: "addresses" },
  { href: "/compte/cartes-cadeaux", labelKey: "giftCards" },
  { href: "/compte/abonnement", labelKey: "subscription" },
] as const;

export function AccountSidebar() {
  const pathname = usePathname();
  const t = useTranslations("account.nav");
  return (
    <aside className="w-56 shrink-0">
      <nav className="text-sm">
        <ul className="space-y-1">
          {items.map((i) => {
            const isActive =
              pathname === i.href || (i.href !== "/compte" && pathname.startsWith(i.href));
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className={cn(
                    "block rounded px-3 py-2 transition-colors",
                    isActive
                      ? "border-honey text-honey-dark -ml-[2px] border-l-2 pl-[14px] font-medium"
                      : "text-warm-brown hover:bg-honey/5 hover:text-honey-dark",
                  )}
                >
                  {t(i.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
