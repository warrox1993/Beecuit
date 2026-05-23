"use client";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const LABELS: Record<string, string> = { fr: "FR", nl: "NL", de: "DE", en: "EN" };

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-warm-brown hover:text-honey-dark flex items-center gap-1 text-sm font-medium tracking-wide uppercase">
        {LABELS[currentLocale] ?? currentLocale.toUpperCase()}
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[80px]">
        {routing.locales.map((l) => (
          <DropdownMenuItem key={l} asChild className="cursor-pointer">
            <Link
              href="/"
              locale={l}
              className={`block w-full text-center text-sm uppercase ${l === currentLocale ? "text-honey-dark font-semibold" : "text-warm-brown"}`}
            >
              {LABELS[l] ?? l.toUpperCase()}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
