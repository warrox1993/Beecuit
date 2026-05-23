import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  return (
    <nav className="flex gap-2 text-sm" aria-label="Changer de langue">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href="/"
          locale={l}
          className={`uppercase tracking-wide ${
            l === currentLocale ? "text-honey-dark font-bold underline" : "text-warm-brown hover:text-honey-dark"
          }`}
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}
