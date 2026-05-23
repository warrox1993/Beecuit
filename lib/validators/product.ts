import { z } from "zod";

const Nutri = z.object({
  energy_kcal: z.number().min(0),
  fat_g: z.number().min(0),
  carbs_g: z.number().min(0),
  protein_g: z.number().min(0),
  salt_g: z.number().min(0),
});

const Translation = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  shortDescription: z.string().min(1).max(160),
  longDescription: z.string().min(1).max(2000),
  ingredients: z.string().min(1).max(2000),
  allergens: z.array(z.string()).default([]),
  nutritionalFactsPer100g: Nutri,
  seoTitle: z.string().min(1).max(60),
  seoDescription: z.string().min(1).max(160),
});

export const ProductSchema = z.object({
  id: z.string().optional(),
  sku: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z0-9-]+$/),
  categoryId: z.string().nullable().optional(),
  basePriceCents: z.number().int().positive(),
  weightGrams: z.number().int().positive(),
  stockQuantity: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  translations: z.object({
    fr: Translation,
    nl: Translation,
    de: Translation,
    en: Translation,
  }),
});
export type ProductInput = z.infer<typeof ProductSchema>;
