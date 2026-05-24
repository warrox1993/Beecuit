import { z } from "zod";
import { GIFT_CARD_AMOUNTS_CENTS } from "@/lib/gift-cards/constants";

export const AddGiftCardToCartSchema = z.object({
  amountCents: z
    .number()
    .int()
    .refine((v) => (GIFT_CARD_AMOUNTS_CENTS as readonly number[]).includes(v), {
      message: "Montant non autorisé",
    }),
  recipientEmail: z.string().email(),
  recipientName: z.string().max(120).nullable(),
  message: z.string().max(500).nullable(),
  deliveryAt: z.string().datetime(),
});
export type AddGiftCardToCartInput = z.infer<typeof AddGiftCardToCartSchema>;
