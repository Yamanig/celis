import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getListingFeeCents,
  getListingTiersConfig,
  getPlatformMonetizationModel,
  getListingPricing,
} from "./config.server";
import { ITEM_CONDITIONS } from "~/db/schema";

export const getListingFee = createServerFn({ method: "GET" }).handler(async () => {
  return getListingFeeCents();
});

export const getListingTiers = createServerFn({ method: "GET" }).handler(async () => {
  return getListingTiersConfig();
});

export const getMonetizationModel = createServerFn({ method: "GET" }).handler(
  async () => getPlatformMonetizationModel()
);

const pricingPreviewSchema = z.object({
  price: z.coerce.number().int().min(0),
  condition: z.enum(ITEM_CONDITIONS).optional(),
  categoryId: z.string().uuid(),
});

export const getListingPricingPreview = createServerFn({ method: "GET" })
  .validator(pricingPreviewSchema)
  .handler(async ({ data }) => {
    return getListingPricing(
      data.price,
      data.condition || null,
      data.categoryId
    );
  });
