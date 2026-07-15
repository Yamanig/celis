import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getListingFeeCents,
  getListingTiersConfig,
  getPlatformMonetizationModel,
  getListingPricing,
  getPlatformConfig,
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

export const getFeatureToggles = createServerFn({ method: "GET" }).handler(
  async () => {
    const [
      localPickupEnabled,
      platformShippingEnabled,
      evcEnabled,
      premierWalletEnabled,
      edahabEnabled,
    ] = await Promise.all([
      getPlatformConfig<boolean>("local_pickup_enabled"),
      getPlatformConfig<boolean>("platform_shipping_enabled"),
      getPlatformConfig<boolean>("evc_enabled"),
      getPlatformConfig<boolean>("premier_wallet_enabled"),
      getPlatformConfig<boolean>("edahab_enabled"),
    ]);
    return {
      localPickupEnabled: localPickupEnabled ?? true,
      platformShippingEnabled: platformShippingEnabled ?? true,
      evcEnabled: evcEnabled ?? true,
      premierWalletEnabled: premierWalletEnabled ?? true,
      edahabEnabled: edahabEnabled ?? true,
    };
  }
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
