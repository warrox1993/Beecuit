import { ImageResponse } from "next/og";
import {
  OG_COLORS,
  OG_CONTENT_TYPE,
  OG_FONT_STACK,
  OG_SIZE,
} from "@/lib/seo/og-image";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

// Route segment config — see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
export const runtime = "edge";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * Default OpenGraph image for Au Fil des Saveurs.
 *
 * Renders a 1200×630 cream card with a gold ornament, the brand wordmark
 * and the tagline. Uses the shared visual constants from `lib/seo/og-image`
 * so the look stays in sync with palette/font choices declared there.
 *
 * Referenced from `lib/seo/metadata.ts` as the default `DEFAULT_OG_IMAGE`.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${OG_COLORS.cream} 0%, ${OG_COLORS.creamGold} 100%)`,
          fontFamily: OG_FONT_STACK.display,
          color: OG_COLORS.warmBrown,
          position: "relative",
          padding: "80px",
        }}
      >
        {/* Top gold rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              width: "180px",
              height: "1px",
              background: OG_COLORS.honeyDark,
            }}
          />
          <div
            style={{
              width: "12px",
              height: "12px",
              transform: "rotate(45deg)",
              background: OG_COLORS.honey,
            }}
          />
          <div
            style={{
              width: "180px",
              height: "1px",
              background: OG_COLORS.honeyDark,
            }}
          />
        </div>

        {/* Script overline */}
        <div
          style={{
            display: "flex",
            fontFamily: OG_FONT_STACK.script,
            fontSize: "56px",
            color: OG_COLORS.honeyDark,
            marginBottom: "16px",
            lineHeight: 1,
          }}
        >
          Maison artisanale
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: "104px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            textAlign: "center",
            lineHeight: 1.05,
          }}
        >
          {SITE_NAME}
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontFamily: OG_FONT_STACK.sans,
            fontSize: "30px",
            color: OG_COLORS.warmBrown,
            opacity: 0.78,
            marginTop: "28px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          {SITE_TAGLINE}
        </div>

        {/* Bottom gold rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            marginTop: "56px",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "1px",
              background: OG_COLORS.honeyDark,
            }}
          />
          <div
            style={{
              fontFamily: OG_FONT_STACK.sans,
              fontSize: "18px",
              letterSpacing: "0.32em",
              color: OG_COLORS.terracotta,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Liège · Belgique
          </div>
          <div
            style={{
              width: "120px",
              height: "1px",
              background: OG_COLORS.honeyDark,
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
