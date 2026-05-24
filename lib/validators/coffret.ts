import { z } from "zod";

const CoffretTranslationSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().min(1).max(280),
  longDescription: z.string().min(1).max(2000),
  seoTitle: z.string().min(1).max(70),
  seoDescription: z.string().min(1).max(160),
});

export const CoffretContentSchema = z.object({
  biscuitId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const CoffretSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().min(3).max(64),
  weightGrams: z.number().int().min(1).max(10000),
  discountPercent: z.number().int().min(0).max(99),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  contents: z.array(CoffretContentSchema).min(1).max(50),
  translations: z.object({
    fr: CoffretTranslationSchema,
    nl: CoffretTranslationSchema,
    en: CoffretTranslationSchema,
    de: CoffretTranslationSchema,
  }),
});

export type CoffretInput = z.infer<typeof CoffretSchema>;
