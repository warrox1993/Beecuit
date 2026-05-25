"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { NavLink } from "./NavLink";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";
import { RopeDivider } from "@/components/brand/Ornaments";

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
      <SheetContent
        side="right"
        className="bg-cream-light border-warm-brown/15 w-80 border-l"
      >
        {/* Handle bar visual (decorative, not draggable yet — V1.1) */}
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
          {[
            ["/biscuits", t("biscuits"), false],
            ["/coffrets", t("coffrets"), false],
            ["/cartes-cadeaux", t("giftCards"), false],
            ["/abonnement", t("abonnement"), true],
            ["/journal", t("journal"), true],
            ["/compte", t("account"), false],
          ].map(([href, label, soon]) => (
            <NavLink
              key={href as string}
              href={href as string}
              comingSoon={Boolean(soon)}
              className="text-warm-brown hover:text-honey-dark border-warm-brown/10 hover:border-honey-dark/40 rounded-xl border bg-transparent px-4 py-3 text-base transition-all"
            >
              {label as string}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
