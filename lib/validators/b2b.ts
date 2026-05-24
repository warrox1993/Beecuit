import { z } from "zod";

export const CreateB2BQuoteSchema = z.object({
  companyName: z.string().trim().min(1, "Nom d'entreprise requis").max(200),
  contactName: z.string().trim().min(1, "Nom du contact requis").max(200),
  email: z.string().trim().email("Email invalide").max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  vatNumber: z.string().trim().max(40).optional().or(z.literal("")),
  requestedProducts: z
    .string()
    .trim()
    .min(10, "Décris ta demande (10 caractères min)")
    .max(5000),
  targetQuantity: z.coerce.number().int().positive().max(100000).optional(),
  targetDeliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  budgetRange: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(5000).optional().or(z.literal("")),
  locale: z.enum(["fr", "nl", "en", "de"]).default("fr"),
  _hp: z.string().max(0, "honeypot triggered").optional().default(""),
});
export type CreateB2BQuoteInput = z.infer<typeof CreateB2BQuoteSchema>;

export const AdminSetQuoteSchema = z.object({
  quoteId: z.string().min(1),
  quotedAmountCents: z.coerce.number().int().positive().max(10_000_000),
  quoteDescription: z.string().trim().min(1).max(5000),
  shippingAddress: z.object({
    firstName: z.string().trim().max(100).optional().or(z.literal("")),
    lastName: z.string().trim().max(100).optional().or(z.literal("")),
    line1: z.string().trim().min(1).max(200),
    line2: z.string().trim().max(200).optional().or(z.literal("")),
    postalCode: z.string().trim().min(1).max(20),
    city: z.string().trim().min(1).max(100),
    country: z.string().length(2),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
  }),
  adminNotes: z.string().trim().max(5000).optional().or(z.literal("")),
});
export type AdminSetQuoteInput = z.infer<typeof AdminSetQuoteSchema>;

export const AdminRejectQuoteSchema = z.object({
  quoteId: z.string().min(1),
  reason: z.string().trim().min(1, "Motif requis").max(2000),
});
export type AdminRejectQuoteInput = z.infer<typeof AdminRejectQuoteSchema>;
