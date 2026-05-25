import "server-only";

/**
 * Shared visual constants for `next/og` ImageResponse pages.
 *
 * These mirror the Au Fil des Saveurs palette declared in globals.css so
 * generated social-card images stay on-brand.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export const OG_COLORS = {
  cream: "#fbf6ee",
  creamGold: "#f5edd9",
  warmBrown: "#3d2817",
  honeyDark: "#a8731b",
  honey: "#d4a043",
  terracotta: "#b35636",
};

/**
 * Render style for the brand wordmark text — we cannot use the actual
 * `next/font/google` web fonts inside `ImageResponse` without bundling
 * `.ttf` binaries, so we fall back to system serif + script approximations.
 * Once licensed Fraunces/Pinyon TTF binaries are added under
 * `public/fonts/` we can load them and pass them to ImageResponse via the
 * `fonts` option.
 */
export const OG_FONT_STACK = {
  display: '"Georgia", "Times New Roman", serif',
  script: '"Snell Roundhand", "Apple Chancery", "Lucida Calligraphy", cursive',
  sans: '"Helvetica Neue", "Arial", sans-serif',
};
