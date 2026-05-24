import { z } from "zod";
import { AddressSchema } from "./address";

export const CheckoutSchema = z.object({
  email: z.string().email(),
  newsletterOptIn: z.boolean().default(false),
  shippingAddress: AddressSchema.omit({
    id: true,
    isDefaultShipping: true,
    isDefaultBilling: true,
  }),
  billingSameAsShipping: z.boolean().default(true),
  billingAddress: AddressSchema.omit({
    id: true,
    isDefaultShipping: true,
    isDefaultBilling: true,
  }).optional(),
  shippingMethod: z.literal("bpost_express_24h"),
  giftCardCode: z
    .string()
    .regex(/^BC-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/)
    .optional(),
});
export type CheckoutInput = z.infer<typeof CheckoutSchema>;
