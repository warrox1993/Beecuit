"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/compte", label: "Tableau de bord" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/compte/adresses", label: "Mes adresses" },
];

export function AccountSidebar() {
  const pathname = usePathname();
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
                  {i.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
