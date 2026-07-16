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
  getListingReviews,
  insertListingReview,
  submitShopListingForReview,
  type SearchListingsFilters,
} from "./listings.server";
import {
  getSellerListingEligibility,
  getCurrentSellerSubscription,
} from "./seller-packages.server";
import { getCategoryMetadataSchema } from "./categories.server";
import { validateMetadata } from "~/lib/category-metadata";
import { ITEM_CONDITIONS } from "~/db/schema";

const createListingSchema = z.object({
  sellerId: z.string().uuid(),
  listing: listingSchema,
});

const submitShopSchema = z.object({
  listingId: z.string().uuid(),
  sellerId: z.string().uuid(),
});

export const fetchSellerListingEligibility = createServerFn({ method: "GET" })
  .validator(z.object({ sellerId: z.string().uuid() }))
  .handler(async ({ data }) => getSellerListingEligibility(data.sellerId));

export const submitShopListing = createServerFn({ method: "POST" })
  .validator(submitShopSchema)
  .handler(async ({ data }) => {
    await submitShopListingForReview(data.listingId, data.sellerId);
    return { success: true, id: data.listingId };
  });

const shopSlugSchema = z.object({
  shopSlug: z.string().min(1),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(24),
});

export const fetchShopListings = createServerFn({ method: "GET" })
  .validator(shopSlugSchema)
  .handler(async ({ data }) => {
    const { getShopListings } = await import("./listings.server");
    return getShopListings(data.shopSlug, {
      page: data.page,
      limit: data.limit,
    });
  });

export const fetchCurrentSellerSubscription = createServerFn({
  method: "GET",
}).handler(async () => {
  const { getCurrentUser } = await import("./auth.server");
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return getCurrentSellerSubscription(user.id);
});

export const createListing = createServerFn({ method: "POST" })
  .validator(createListingSchema)
  .handler(async ({ data }) => {
    await requireSeller(data.sellerId);
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user?.phone) {
      throw new Error("Add a phone number to your account before listing an item.");
    }
    const metadataSchema = await getCategoryMetadataSchema(data.listing.categoryId);
    const metadataErrors = validateMetadata(metadataSchema, data.listing.metadata);
    if (Object.keys(metadataErrors).length > 0) {
      throw new Error(
        Object.entries(metadataErrors)
          .map(([_, msg]) => msg)
          .join("; ")
      );
    }
    const listing = await insertDraftListing(data.sellerId, data.listing);
    return { id: listing.id, status: listing.status };
  });

const listingIdSchema = z.object({ id: z.string().uuid() });

export const fetchListingById = createServerFn({ method: "GET" })
  .validator(listingIdSchema)
  .handler(async ({ data }) => {
    return getListingById(data.id);
  });

const similarListingsSchema = z.object({
  listingId: z.string().uuid(),
  categoryId: z.string().uuid(),
});

export const fetchSimilarListings = createServerFn({ method: "GET" })
  .validator(similarListingsSchema)
  .handler(async ({ data }) => {
    const { getSimilarListings } = await import("./listings.server");
    return getSimilarListings(data.listingId, data.categoryId);
  });

const searchSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  condition: z.enum(ITEM_CONDITIONS).optional(),
  metadata: z.record(z.string()).optional(),
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

const sellerListingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const fetchSellerListings = createServerFn({ method: "GET" })
  .validator(sellerListingsQuerySchema)
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return getSellerListings(user.id, data);
  });

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

export const fetchListingReviews = createServerFn({ method: "GET" })
  .validator(listingIdSchema)
  .handler(async ({ data }) => {
    return getListingReviews(data.id);
  });

const createReviewSchema = z.object({
  listingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const createListingReview = createServerFn({ method: "POST" })
  .validator(createReviewSchema)
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return insertListingReview({
      listingId: data.listingId,
      reviewerId: user.id,
      rating: data.rating,
      comment: data.comment,
    });
  });
