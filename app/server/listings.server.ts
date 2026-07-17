import { db } from "~/db";
import { listings, users, profiles, categories, listingReviews } from "~/db/schema";
import {
  eq,
  and,
  gte,
  lte,
  ilike,
  desc,
  asc,
  sql,
  count,
} from "drizzle-orm";
import type { ListingInput } from "~/lib/validation";
import { CelisError } from "~/lib/errors";
import type { listings as listingsTable, ItemCondition } from "~/db/schema";
import { getSellerListingEligibility } from "./seller-packages.server";
import { createNotification } from "./notifications.server";

export type ListingMetadata = Record<string, string | number | boolean | null>;

export type ListingPublic = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  condition: ItemCondition | null;
  price: number;
  monetizationType: string;
  deliveryMethod: string;
  status: string;
  isFeatured: boolean;
  featuredUntil: Date | null;
  featuredFeeCents: number | null;
  images: string[];
  metadata: ListingMetadata;
  expiresAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListingDetail = ListingPublic & {
  sellerName: string | null;
  sellerPhone: string | null;
  sellerVerified: boolean;
  sellerType: "individual" | "shop";
  businessName: string | null;
  businessLogoUrl: string | null;
  businessRegistrationNumber: string | null;
  businessAddress: string | null;
  shopSlug: string | null;
};

function mapListingPublic(
  row: typeof listingsTable.$inferSelect,
  categoryName: string
): ListingPublic {
  return {
    id: row.id,
    sellerId: row.sellerId,
    title: row.title,
    description: row.description,
    categoryId: row.categoryId,
    categoryName,
    condition: row.condition,
    price: row.price,
    monetizationType: row.monetizationType,
    deliveryMethod: row.deliveryMethod,
    status: row.status,
    isFeatured: row.isFeatured,
    featuredUntil: row.featuredUntil,
    featuredFeeCents: row.featuredFeeCents,
    images: row.images,
    metadata: (row.metadata as ListingMetadata) ?? {},
    expiresAt: row.expiresAt,
    reviewedAt: row.reviewedAt,
    reviewedBy: row.reviewedBy,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function insertDraftListing(
  sellerId: string,
  input: ListingInput
) {
  const [listing] = await db
    .insert(listings)
    .values({
      sellerId,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      condition: input.condition,
      price: input.price,
      monetizationType: input.monetizationType,
      deliveryMethod: input.deliveryMethod,
      images: input.images.map((i) => i.url),
      metadata: input.metadata,
      status: "draft",
    })
    .returning();
  return listing;
}

export async function getListingById(id: string): Promise<ListingDetail | null> {
  const rows = await db
    .select({
      listing: listings,
      categoryName: categories.name,
      sellerName: profiles.displayName,
      sellerPhone: users.walletPhone,
      sellerVerifiedAt: users.verifiedAt,
      sellerType: profiles.sellerType,
      businessName: profiles.businessName,
      businessLogoUrl: profiles.businessLogoUrl,
      businessRegistrationNumber: profiles.businessRegistrationNumber,
      businessAddress: profiles.businessAddress,
      shopSlug: profiles.shopSlug,
    })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .innerJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(eq(listings.id, id))
    .limit(1);

  if (!rows[0]) return null;
  const {
    listing,
    categoryName,
    sellerName,
    sellerPhone,
    sellerVerifiedAt,
    sellerType,
    businessName,
    businessLogoUrl,
    businessRegistrationNumber,
    businessAddress,
    shopSlug,
  } = rows[0];
  return {
    ...mapListingPublic(listing, categoryName),
    sellerName,
    sellerPhone,
    sellerVerified: sellerVerifiedAt !== null,
    sellerType: sellerType ?? "individual",
    businessName,
    businessLogoUrl,
    businessRegistrationNumber,
    businessAddress,
    shopSlug,
  };
}

export async function updateListingFees(
  id: string,
  pricing: {
    feeCents: number;
    commissionBps: number | null;
    commissionAmountCents: number | null;
    appliedFeeRuleId: string | null;
    expiresAt: Date;
    currency: string;
  }
) {
  const [updated] = await db
    .update(listings)
    .set({
      feeAmountCents: pricing.feeCents,
      commissionBps: pricing.commissionBps,
      appliedFeeRuleId: pricing.appliedFeeRuleId,
      currency: pricing.currency,
      expiresAt: pricing.expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id))
    .returning();
  if (!updated) {
    throw new CelisError("Listing not found", "LISTING_NOT_FOUND", 404);
  }
  return updated;
}

export async function submitListingForReview(id: string) {
  const [updated] = await db
    .update(listings)
    .set({
      status: "pending_review",
      monetizationStatus: "active",
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id))
    .returning();
  if (!updated) {
    throw new CelisError("Listing not found", "LISTING_NOT_FOUND", 404);
  }
  return updated;
}

export async function submitShopListingForReview(
  id: string,
  sellerId: string
) {
  const eligibility = await getSellerListingEligibility(sellerId);
  if (eligibility.sellerType !== "shop" || !eligibility.canList) {
    throw new CelisError(
      "No active listing package for this shop",
      "SHOP_PACKAGE_REQUIRED",
      402
    );
  }
  return submitListingForReview(id);
}

export const FEATURED_LISTING_DURATION_DAYS = 7;

export async function featureListing(
  id: string,
  sellerId: string,
  feeCents: number,
  days: number = FEATURED_LISTING_DURATION_DAYS
) {
  const [listing] = await db
    .select({ id: listings.id, sellerId: listings.sellerId, status: listings.status })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!listing) {
    throw new CelisError("Listing not found", "LISTING_NOT_FOUND", 404);
  }
  if (listing.sellerId !== sellerId) {
    throw new CelisError("Forbidden", "FORBIDDEN", 403);
  }
  if (listing.status !== "active") {
    throw new CelisError("Only active listings can be featured", "LISTING_NOT_ACTIVE", 400);
  }

  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + days);

  const [updated] = await db
    .update(listings)
    .set({
      isFeatured: true,
      featuredUntil,
      featuredFeeCents: feeCents,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id))
    .returning();
  return updated;
}

export async function approveListing(id: string, reviewerId: string) {
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);

  if (!listing) {
    throw new CelisError("Listing not found", "LISTING_NOT_FOUND", 404);
  }

  // If the listing was already paid, keep the snapshot taken at payment time
  // so a later config change cannot alter the amount charged or expiry.
  let expiresAt = listing.expiresAt;
  if (!expiresAt) {
    const { getListingPricing } = await import("./config.server");
    const pricing = await getListingPricing(listing.price, listing.categoryId);
    expiresAt = pricing.expiresAt;
  }

  const [updated] = await db
    .update(listings)
    .set({
      status: "active",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id))
    .returning();

  await createNotification({
    userId: listing.sellerId,
    type: "listing_approved",
    title: "Your listing is live",
    body: `"${listing.title}" has been approved and is now visible to buyers.`,
    link: `/listings/${listing.id}`,
    metadata: { listingId: listing.id, title: listing.title },
  });

  return updated;
}

export async function rejectListing(
  id: string,
  reviewerId: string,
  reason: string
) {
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!listing) {
    throw new CelisError("Listing not found", "LISTING_NOT_FOUND", 404);
  }

  const [updated] = await db
    .update(listings)
    .set({
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id))
    .returning();

  await createNotification({
    userId: listing.sellerId,
    type: "listing_rejected",
    title: "Your listing was not approved",
    body: reason
      ? `"${listing.title}" was rejected. Reason: ${reason}`
      : `"${listing.title}" was rejected.`,
    link: `/dashboard`,
    metadata: { listingId: listing.id, title: listing.title, reason },
  });

  return updated;
}

export async function requireSeller(sellerId: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, sellerId))
    .limit(1);
  if (!user[0]) {
    throw new CelisError("User not found", "USER_NOT_FOUND", 404);
  }
  return user[0];
}

export interface SearchListingsFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  metadataFilters?: Record<string, string>;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

export async function searchListings(filters: SearchListingsFilters) {
  const {
    query,
    categoryId,
    minPrice,
    maxPrice,
    condition,
    metadataFilters,
    sort = "newest",
    page = 1,
    limit = 24,
  } = filters;

  const conditions = [eq(listings.status, "active")];
  if (query) {
    const term = `%${query}%`;
    conditions.push(
      sql`(${ilike(listings.title, term)} OR ${ilike(
        listings.description,
        term
      )})`
    );
  }
  if (categoryId) conditions.push(eq(listings.categoryId, categoryId));
  if (minPrice !== undefined) conditions.push(gte(listings.price, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(listings.price, maxPrice));
  if (condition) conditions.push(eq(listings.condition, condition as ItemCondition));

  if (metadataFilters && categoryId) {
    for (const [key, value] of Object.entries(metadataFilters)) {
      if (value === "" || value === undefined) continue;
      conditions.push(
        sql`(${listings.metadata} ->> ${key}) = ${value}`
      );
    }
  }

  conditions.push(
    sql`(${listings.expiresAt} IS NULL OR ${listings.expiresAt} > now())`
  );

  const sortOrder =
    sort === "price_asc"
      ? asc(listings.price)
      : sort === "price_desc"
      ? desc(listings.price)
      : desc(listings.createdAt);

  // Featured listings (not expired) sort to the top.
  const featuredFirst = sql`CASE WHEN ${listings.isFeatured} = true AND (${listings.featuredUntil} IS NULL OR ${listings.featuredUntil} > now()) THEN 0 ELSE 1 END`;

  const offset = (page - 1) * limit;

  const rows = await db
    .select({ listing: listings, categoryName: categories.name })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(featuredFirst, sortOrder)
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .where(and(...conditions));

  return {
    listings: rows.map((r) => mapListingPublic(r.listing, r.categoryName)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFeaturedListings(limit = 8) {
  const featuredFirst = sql`CASE WHEN ${listings.isFeatured} = true AND (${listings.featuredUntil} IS NULL OR ${listings.featuredUntil} > now()) THEN 0 ELSE 1 END`;
  const rows = await db
    .select({ listing: listings, categoryName: categories.name })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .where(
      and(
        eq(listings.status, "active"),
        sql`(${listings.expiresAt} IS NULL OR ${listings.expiresAt} > now())`
      )
    )
    .orderBy(featuredFirst, desc(listings.createdAt))
    .limit(limit);

  return rows.map((r) => mapListingPublic(r.listing, r.categoryName));
}

export async function getShopListings(
  shopSlug: string,
  options?: { page?: number; limit?: number }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 24;

  const sellerRows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.shopSlug, shopSlug))
    .limit(1);
  if (!sellerRows[0]) return null;

  const sellerId = sellerRows[0].id;
  const conditions = [
    eq(listings.sellerId, sellerId),
    eq(listings.status, "active"),
    sql`(${listings.expiresAt} IS NULL OR ${listings.expiresAt} > now())`,
  ];

  const offset = (page - 1) * limit;

  const featuredFirst = sql`CASE WHEN ${listings.isFeatured} = true AND (${listings.featuredUntil} IS NULL OR ${listings.featuredUntil} > now()) THEN 0 ELSE 1 END`;

  const rows = await db
    .select({ listing: listings, categoryName: categories.name })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(featuredFirst, desc(listings.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(listings)
    .where(and(...conditions));

  const sellerProfile = await db
    .select({
      displayName: profiles.displayName,
      businessName: profiles.businessName,
      businessLogoUrl: profiles.businessLogoUrl,
      businessRegistrationNumber: profiles.businessRegistrationNumber,
      businessAddress: profiles.businessAddress,
      sellerType: profiles.sellerType,
    })
    .from(profiles)
    .where(eq(profiles.id, sellerId))
    .limit(1);

  return {
    seller: sellerProfile[0],
    listings: rows.map((r) => mapListingPublic(r.listing, r.categoryName)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSellerListings(
  sellerId: string,
  options?: { page?: number; limit?: number }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;

  const where = eq(listings.sellerId, sellerId);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(listings)
    .where(where);

  const [{ value: activeCount }] = await db
    .select({ value: count() })
    .from(listings)
    .where(and(where, eq(listings.status, "active")));

  const rows = await db
    .select({ listing: listings, categoryName: categories.name })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .where(where)
    .orderBy(desc(listings.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows.map((r) => mapListingPublic(r.listing, r.categoryName)),
    total,
    activeCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function deleteListing(id: string, sellerId: string) {
  const [listing] = await db
    .delete(listings)
    .where(and(eq(listings.id, id), eq(listings.sellerId, sellerId)))
    .returning();
  return listing;
}

export async function expireStaleListings() {
  const expired = await db
    .update(listings)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(listings.status, "active"),
        sql`${listings.expiresAt} <= now()`
      )
    )
    .returning({ id: listings.id });
  return { expiredCount: expired.length };
}

export async function getListingReviews(listingId: string) {
  const rows = await db
    .select({
      review: listingReviews,
      reviewerName: profiles.displayName,
      reviewerEmail: users.email,
    })
    .from(listingReviews)
    .innerJoin(users, eq(listingReviews.reviewerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(eq(listingReviews.listingId, listingId))
    .orderBy(desc(listingReviews.createdAt));

  const [{ avg }] = await db
    .select({ avg: sql<number | null>`round(avg(${listingReviews.rating})::numeric, 1)` })
    .from(listingReviews)
    .where(eq(listingReviews.listingId, listingId));

  return {
    reviews: rows.map((r) => ({
      id: r.review.id,
      rating: r.review.rating,
      comment: r.review.comment,
      createdAt: r.review.createdAt,
      reviewerName: r.reviewerName ?? r.reviewerEmail,
    })),
    average: avg ?? 0,
    count: rows.length,
  };
}

export async function getSimilarListings(
  listingId: string,
  categoryId: string,
  limit = 8
) {
  const featuredFirst = sql`CASE WHEN ${listings.isFeatured} = true AND (${listings.featuredUntil} IS NULL OR ${listings.featuredUntil} > now()) THEN 0 ELSE 1 END`;
  const rows = await db
    .select({ listing: listings, categoryName: categories.name })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .where(
      and(
        eq(listings.status, "active"),
        eq(listings.categoryId, categoryId),
        sql`${listings.id} != ${listingId}`,
        sql`(${listings.expiresAt} IS NULL OR ${listings.expiresAt} > now())`
      )
    )
    .orderBy(featuredFirst, desc(listings.createdAt))
    .limit(limit);

  return rows.map((r) => mapListingPublic(r.listing, r.categoryName));
}

export async function insertListingReview(input: {
  listingId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
}) {
  const listing = await getListingById(input.listingId);
  if (!listing || listing.status !== "active") {
    throw new CelisError("Listing not found", "LISTING_NOT_FOUND", 404);
  }
  if (listing.sellerId === input.reviewerId) {
    throw new CelisError("You cannot review your own listing", "OWN_LISTING_REVIEW", 400);
  }

  const existing = await db
    .select()
    .from(listingReviews)
    .where(
      and(
        eq(listingReviews.listingId, input.listingId),
        eq(listingReviews.reviewerId, input.reviewerId)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    throw new CelisError("You already reviewed this listing", "REVIEW_EXISTS", 409);
  }

  const [review] = await db
    .insert(listingReviews)
    .values({
      listingId: input.listingId,
      reviewerId: input.reviewerId,
      rating: input.rating,
      comment: input.comment?.trim() || null,
    })
    .returning();
  return review;
}
