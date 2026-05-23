"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { NavLink } from "./NavLink";
import { useTranslations } from "next-intl";

export function MobileNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t("menu")}
        className="text-warm-brown hover:text-honey-dark md:hidden"
      >
        <Menu className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="right" className="bg-cream w-80">
        <SheetHeader>
          <SheetTitle className="text-honey font-display text-2xl">BeeCuit</SheetTitle>
        </SheetHeader>
        <nav className="mt-8 flex flex-col gap-4" onClick={() => setOpen(false)}>
          <NavLink href="/biscuits" className="text-lg">
            {t("biscuits")}
          </NavLink>
          <NavLink href="/coffrets" comingSoon className="text-lg">
            {t("coffrets")}
          </NavLink>
          <NavLink href="/abonnement" comingSoon className="text-lg">
            {t("abonnement")}
          </NavLink>
          <NavLink href="/journal" comingSoon className="text-lg">
            {t("journal")}
          </NavLink>
          <NavLink href="/compte" className="text-lg">
            {t("account")}
          </NavLink>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
