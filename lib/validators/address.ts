import { z } from "zod";

export const AddressSchema = z.object({
  id: z.string().optional(),
  label: z.string().max(50).optional().nullable(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().nullable(),
  postalCode: z.string().min(2).max(20),
  city: z.string().min(1).max(100),
  country: z.string().length(2).default("BE"),
  phone: z.string().max(40).optional().nullable(),
  isDefaultShipping: z.boolean().default(false),
  isDefaultBilling: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof AddressSchema>;
