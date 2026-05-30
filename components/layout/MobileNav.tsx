"use client";
import { useState, useTransition } from "react";
import { Menu, LogIn, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { NavLink } from "./NavLink";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { RopeDivider } from "@/components/brand/Ornaments";
import { signOutAction } from "@/lib/actions/auth.actions";
import { cn } from "@/lib/utils";

type Role = "customer" | "b2b" | "admin";

export function MobileNav({
  user,
  locale,
}: {
  user: { email: string | null; name: string | null; role: Role } | null;
  locale: string;
}) {
  const t = useTranslations("nav");
  const tAccount = useTranslations("account.nav");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const display = user?.name?.trim() || user?.email || "";
  const initial = (display.charAt(0) || "?").toUpperCase();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t("menu")}
        className="text-warm-brown hover:text-honey-dark md:hidden"
      >
        <Menu className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-cream-light border-warm-brown/15 flex w-80 flex-col border-l"
      >
        <div
          aria-hidden
          className="bg-warm-brown/20 mx-auto mt-2 h-1 w-12 rounded-full"
        />
        <SheetHeader className="px-5 pt-3 pb-1">
          <SheetTitle asChild>
            <span className="inline-flex items-center">
              <Logo variant="wordmark" className="text-warm-brown h-9 w-auto" />
            </span>
          </SheetTitle>
        </SheetHeader>
        <RopeDivider variant="wave" className="text-honey-dark/40 px-5" />
        <nav
          className="mt-6 flex flex-col gap-1 px-5"
          aria-label="Principal"
          onClick={() => setOpen(false)}
        >
          {(
            [
              ["/biscuits", t("biscuits")],
              ["/coffrets", t("coffrets")],
              ["/cartes-cadeaux", t("giftCards")],
              ["/abonnement", t("abonnement")],
              ["/journal", t("journal")],
            ] as const
          ).map(([href, label]) => (
            <NavLink
              key={href}
              href={href}
              className="text-warm-brown hover:text-honey-dark border-warm-brown/10 hover:border-honey-dark/40 rounded-xl border bg-transparent px-4 py-3 text-base transition-all"
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-5 pb-6">
          <RopeDivider variant="wave" className="text-honey-dark/40 mb-4" />
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="border-warm-brown/15 bg-cream text-warm-brown flex h-10 w-10 items-center justify-center rounded-full border text-base font-semibold"
                  aria-hidden
                >
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-warm-brown truncate text-sm font-medium">{display}</div>
                  {user.email && user.email !== display && (
                    <div className="text-warm-brown/60 truncate text-xs">{user.email}</div>
                  )}
                </div>
                {user.role !== "customer" && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                      user.role === "admin"
                        ? "bg-terracotta/15 text-terracotta"
                        : "bg-honey/15 text-honey-dark",
                    )}
                  >
                    {user.role}
                  </span>
                )}
              </div>
              <Link
                href="/compte"
                onClick={() => setOpen(false)}
                className="text-warm-brown hover:text-honey-dark border-warm-brown/15 hover:border-honey-dark/40 block rounded-xl border px-4 py-2.5 text-center text-sm font-medium transition-all"
              >
                {tAccount("dashboard")}
              </Link>
              <Link
                href="/compte/profil"
                onClick={() => setOpen(false)}
                className="text-warm-brown hover:text-honey-dark border-warm-brown/15 hover:border-honey-dark/40 block rounded-xl border px-4 py-2.5 text-center text-sm font-medium transition-all"
              >
                {tAccount("profile")}
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  start(() => signOutAction(locale));
                }}
                className="text-warm-brown hover:text-terracotta hover:bg-terracotta/5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                {t("signOut")}
              </button>
            </div>
          ) : (
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="bg-honey-dark hover:bg-honey text-cream inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-medium transition-colors"
            >
              <LogIn className="h-5 w-5" aria-hidden />
              {t("signIn")}
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
