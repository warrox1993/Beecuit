import { Truck, MapPin, Leaf } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function TrustIndicators() {
  const t = await getTranslations("catalog");
  const items = [
    { Icon: Truck, label: t("trustDelivery") },
    { Icon: MapPin, label: t("trustOrigin") },
    { Icon: Leaf, label: t("trustNatural") },
  ];
  return (
    <ul className="border-warm-brown/10 divide-warm-brown/10 divide-y border-y">
      {items.map(({ Icon, label }) => (
        <li key={label} className="flex items-center gap-3 py-3">
          <Icon className="text-honey-dark h-4 w-4 shrink-0" />
          <span className="text-warm-brown/80 text-sm">{label}</span>
        </li>
      ))}
    </ul>
  );
}
