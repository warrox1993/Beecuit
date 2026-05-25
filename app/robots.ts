import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/cron",
          "/api/cron/*",
          "/api/auth",
          "/api/auth/*",
          "/api/webhooks",
          "/api/webhooks/*",
          // Authenticated account area (next-intl prefixed under each locale).
          "/fr/compte",
          "/fr/compte/*",
          "/nl/compte",
          "/nl/compte/*",
          "/de/compte",
          "/de/compte/*",
          "/en/compte",
          "/en/compte/*",
          // Transient cart / checkout shells should not be indexed.
          "/*/panier",
          "/*/checkout",
          "/*/checkout/*",
          "/*/commande-confirmee",
          "/*/commande-confirmee/*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
