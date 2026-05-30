"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { LogOut, ShoppingBag, MapPin, Gift, Repeat, LayoutDashboard, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth.actions";
import { cn } from "@/lib/utils";

type Role = "customer" | "b2b" | "admin";

export function HeaderUserMenu({
  user,
  locale,
}: {
  user: { email: string | null; name: string | null; role: Role } | null;
  locale: string;
}) {
  const t = useTranslations("nav");
  const tAccount = useTranslations("account.nav");
  const [pending, start] = useTransition();

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="text-warm-brown hover:text-honey-dark text-sm font-medium tracking-wide transition-colors"
      >
        {t("signIn")}
      </Link>
    );
  }

  const display = user.name?.trim() || user.email || "";
  const initial = (display.charAt(0) || "?").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("account")}
        className={cn(
          "border-warm-brown/15 text-warm-brown hover:border-honey/60 hover:text-honey-dark focus-visible:ring-honey/40 group/avatar flex h-9 w-9 items-center justify-center rounded-full border bg-cream-light text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
          pending && "opacity-60",
        )}
      >
        <span aria-hidden>{initial}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="border-warm-brown/10 w-64 border bg-white"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <div className="text-warm-brown truncate text-sm font-medium">{display}</div>
          {user.email && user.email !== display && (
            <div className="text-warm-brown/60 truncate text-xs">{user.email}</div>
          )}
          {user.role !== "customer" && (
            <div className="mt-1">
              <span
                className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                  user.role === "admin"
                    ? "bg-terracotta/15 text-terracotta"
                    : "bg-honey/15 text-honey-dark",
                )}
              >
                {user.role}
              </span>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-warm-brown/10" />
        <DropdownMenuItem asChild className="text-warm-brown focus:bg-honey/10 focus:text-honey-dark cursor-pointer gap-2">
          <Link href="/compte">
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            {tAccount("dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-warm-brown focus:bg-honey/10 focus:text-honey-dark cursor-pointer gap-2">
          <Link href="/compte/commandes">
            <ShoppingBag className="h-4 w-4" aria-hidden />
            {tAccount("orders")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-warm-brown focus:bg-honey/10 focus:text-honey-dark cursor-pointer gap-2">
          <Link href="/compte/adresses">
            <MapPin className="h-4 w-4" aria-hidden />
            {tAccount("addresses")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-warm-brown focus:bg-honey/10 focus:text-honey-dark cursor-pointer gap-2">
          <Link href="/compte/cartes-cadeaux">
            <Gift className="h-4 w-4" aria-hidden />
            {tAccount("giftCards")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-warm-brown focus:bg-honey/10 focus:text-honey-dark cursor-pointer gap-2">
          <Link href="/compte/abonnement">
            <Repeat className="h-4 w-4" aria-hidden />
            {tAccount("subscription")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-warm-brown focus:bg-honey/10 focus:text-honey-dark cursor-pointer gap-2">
          <Link href="/compte/profil">
            <User className="h-4 w-4" aria-hidden />
            {tAccount("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-warm-brown/10" />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            start(() => signOutAction(locale));
          }}
          disabled={pending}
          className="text-warm-brown focus:bg-terracotta/10 focus:text-terracotta cursor-pointer gap-2"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
