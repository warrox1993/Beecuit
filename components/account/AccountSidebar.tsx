import { Link } from "@/i18n/navigation";

const items = [
  { href: "/compte", label: "Tableau de bord" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/compte/adresses", label: "Mes adresses" },
];

export function AccountSidebar() {
  return (
    <aside className="w-56 shrink-0">
      <nav className="text-sm">
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                className="text-warm-brown hover:bg-honey/10 hover:text-honey-dark block rounded px-3 py-2"
              >
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
