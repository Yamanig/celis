import { createServerFn } from "@tanstack/react-start";
import { getListingFeeCents, getListingTiersConfig } from "./config.server";

export const getListingFee = createServerFn({ method: "GET" }).handler(async () => {
  return getListingFeeCents();
});

export const getListingTiers = createServerFn({ method: "GET" }).handler(async () => {
  return getListingTiersConfig();
});
