import { z } from "zod";
import {
  ITEM_CONDITIONS,
  DELIVERY_METHODS,
  MONETIZATION_TYPES,
  WALLET_PROVIDERS,
} from "~/db/schema";

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number");

export const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(80),
  phone: phoneSchema,
  whatsapp: phoneSchema.optional(),
  location: z.object({
    region: z.string().min(1),
    city: z.string().min(1),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }),
});

export const listingImageSchema = z.object({
  url: z.string().url(),
  path: z.string().min(1),
  name: z.string().min(1),
});

export const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().min(20, "Description must be at least 20 characters").max(5000),
  categoryId: z.string().uuid("Select a category"),
  condition: z.enum(ITEM_CONDITIONS),
  price: z.coerce.number().int("Price must be a whole number").min(100, "Minimum price is $1.00"),
  monetizationType: z.enum(MONETIZATION_TYPES),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  images: z.array(listingImageSchema).min(1, "Upload at least one image").max(8),
  metadata: z.record(z.unknown()).default({}),
});

export const walletPaymentSchema = z.object({
  provider: z.enum(WALLET_PROVIDERS),
  phone: phoneSchema,
  amount: z.coerce.number().int().min(1),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type ListingImage = z.infer<typeof listingImageSchema>;
export type WalletPaymentInput = z.infer<typeof walletPaymentSchema>;
