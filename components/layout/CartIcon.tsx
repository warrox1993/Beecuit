import { Link } from "@/i18n/navigation";

export function CartIcon() {
  return (
    <Link href="/panier" aria-label="Panier" className="text-warm-brown hover:text-honey-dark">
      🛒
    </Link>
  );
}
