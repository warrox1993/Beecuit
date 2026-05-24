import Link from "next/link";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/coffrets", label: "Coffrets" },
  { href: "/admin/cartes-cadeaux", label: "Cartes cadeaux" },
  { href: "/admin/abonnements", label: "Abonnements" },
  { href: "/admin/devis", label: "Devis B2B" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/livraison", label: "Livraison" },
];

export function AdminSidebar() {
  return (
    <aside className="border-warm-brown/10 bg-cream w-56 shrink-0 border-r p-4">
      <Link href="/admin" className="text-honey font-display block text-2xl">
        BeeCuit admin
      </Link>
      <nav className="mt-6 text-sm">
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
