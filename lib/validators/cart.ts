import { z } from "zod";

export const AddToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(99),
});
export type AddToCartInput = z.infer<typeof AddToCartSchema>;

export const UpdateQuantitySchema = z.object({
  cartItemId: z.string().min(1),
  quantity: z.number().int().nonnegative().max(99),
});
