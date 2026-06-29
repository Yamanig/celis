import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listingSchema } from "~/lib/validation";
import {
  insertDraftListing,
  requireSeller,
  getListingById,
  searchListings,
  getFeaturedListings,
  getSellerListings,
  deleteListing,
  type SearchListingsFilters,
} from "./listings.server";
import { ITEM_CONDITIONS } from "~/db/schema";

const createListingSchema = z.object({
  sellerId: z.string().uuid(),
  listing: listingSchema,
});

export const createListing = createServerFn({ method: "POST" })
  .validator(createListingSchema)
  .handler(async ({ data }) => {
    await requireSeller(data.sellerId);
    const listing = await insertDraftListing(data.sellerId, data.listing);
    return { id: listing.id, status: listing.status };
  });

const listingIdSchema = z.object({ id: z.string().uuid() });

export const fetchListingById = createServerFn({ method: "GET" })
  .validator(listingIdSchema)
  .handler(async ({ data }) => {
    return getListingById(data.id);
  });

const searchSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  condition: z.enum(ITEM_CONDITIONS).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const fetchListings = createServerFn({ method: "GET" })
  .validator(searchSchema)
  .handler(async ({ data }) => {
    return searchListings(data as SearchListingsFilters);
  });

export const fetchFeaturedListings = createServerFn({ method: "GET" }).handler(
  async () => {
    return getFeaturedListings(8);
  }
);

export const fetchSellerListings = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return getSellerListings(user.id);
  }
);

const deleteListingSchema = z.object({ id: z.string().uuid() });

export const removeListing = createServerFn({ method: "POST" })
  .validator(deleteListingSchema)
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    const deleted = await deleteListing(data.id, user.id);
    return { success: !!deleted, id: deleted?.id };
  });
