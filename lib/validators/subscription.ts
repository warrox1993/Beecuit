import { z } from "zod";

export const CreateSubscriptionCheckoutSchema = z.object({
  format: z.enum(["mini", "classique", "famille"]),
  engagement: z.union([z.literal(0), z.literal(6), z.literal(12)]),
});
export type CreateSubscriptionCheckoutInput = z.infer<
  typeof CreateSubscriptionCheckoutSchema
>;

export const ComposeBoxSchema = z.object({
  boxId: z.string().uuid(),
  items: z
    .array(
      z.object({
        biscuitId: z.string().uuid(),
        quantity: z.number().int().min(1).max(24),
      }),
    )
    .min(1),
});
export type ComposeBoxInput = z.infer<typeof ComposeBoxSchema>;

export const UpdateSubscriptionAddressSchema = z.object({
  subscriptionId: z.string().uuid(),
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    country: z.string().length(2),
    phone: z.string().optional(),
  }),
});
