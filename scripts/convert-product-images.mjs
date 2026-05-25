#!/usr/bin/env node
/**
 * Converts user-provided source images for the 3 client-photographed products
 * (rocher coco chocolat, rocher coco nature, biscuit avoine) into optimised
 * WebP files under public/images/products/ at a fixed long-edge resolution.
 *
 * Uses sharp from the pnpm store (transitive dep of Next.js — no install needed).
 *
 * Outputs are deterministic by SKU:
 *   public/images/products/coco-choc.webp
 *   public/images/products/coco-nature.webp
 *   public/images/products/avoine.webp
 *
 * Idempotent: re-running overwrites the output.
 */
// sharp is a transitive dep of Next.js — not hoisted by pnpm so we import via
// the actual node_modules path inside the .pnpm store. This script is run-once
// at dev time only (not part of the build).
import sharp from "../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(".");
const OUT_DIR = path.join(ROOT, "public", "images", "products");

// Source → output. Source paths are relative to repo root.
const JOBS = [
  {
    src: "11461360545bc5be56805cc_rocher-coco.jpg",
    out: "coco-choc.webp",
    desc: "Rocher coco chocolat",
  },
  {
    src: "ba697a28-49db-4176-8aed-5cc1120b992f.webp",
    out: "coco-nature.webp",
    desc: "Rocher coco nature",
  },
  {
    src: "number0003_Oatmeal_Raisin_Cookies_Amateur_photo_from_Reddit_tak_5909d1bb-c281-444d-8382-16b453bd5b31.png",
    out: "avoine.webp",
    desc: "Biscuit avoine",
  },
];

const LONG_EDGE = 1600; // sufficient for product detail page (rendered <1200px CSS px)

await fs.mkdir(OUT_DIR, { recursive: true });

for (const job of JOBS) {
  const srcPath = path.join(ROOT, job.src);
  const outPath = path.join(OUT_DIR, job.out);
  try {
    const stat = await fs.stat(srcPath);
    const { width, height } = await sharp(srcPath).metadata();
    await sharp(srcPath)
      .resize({
        width: width >= height ? LONG_EDGE : null,
        height: height > width ? LONG_EDGE : null,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80, effort: 6 })
      .toFile(outPath);
    const outStat = await fs.stat(outPath);
    const ratio = ((1 - outStat.size / stat.size) * 100).toFixed(1);
    console.log(
      `✓ ${job.desc.padEnd(28)} ${job.out.padEnd(20)} ${(stat.size / 1024).toFixed(1).padStart(7)} KB → ${(outStat.size / 1024).toFixed(1).padStart(7)} KB  (-${ratio}%)`,
    );
  } catch (e) {
    console.error(`✗ ${job.desc}: ${e.message}`);
    process.exitCode = 1;
  }
}
