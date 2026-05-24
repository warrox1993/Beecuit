import { z } from "zod";

const CartItemMetadataSchema = z
  .object({
    type: z.literal("coffret").optional(),
    giftMessage: z.string().max(200).nullable().optional(),
    packagingTier: z.enum(["standard", "premium"]).optional(),
  })
  .optional();

export const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  metadata: CartItemMetadataSchema,
});

export const UpdateQuantitySchema = z.object({
  cartItemId: z.string().uuid(),
  quantity: z.number().int().min(0).max(20),
});

export const UpdateGiftMessageSchema = z.object({
  cartItemId: z.string().uuid(),
  giftMessage: z.string().max(200).nullable(),
});
