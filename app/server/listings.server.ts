import { db } from "~/db";
import { listings, users, profiles, categories } from "~/db/schema";
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

export type ListingPublic = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  condition: string;
  price: number;
  monetizationType: string;
  deliveryMethod: string;
  status: string;
  images: string[];
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListingDetail = ListingPublic & {
  sellerName: string | null;
  sellerPhone: string | null;
  sellerVerified: boolean;
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
    images: row.images,
    expiresAt: row.expiresAt,
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
    })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .innerJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(eq(listings.id, id))
    .limit(1);

  if (!rows[0]) return null;
  const { listing, categoryName, sellerName, sellerPhone, sellerVerifiedAt } =
    rows[0];
  return {
    ...mapListingPublic(listing, categoryName),
    sellerName,
    sellerPhone,
    sellerVerified: sellerVerifiedAt !== null,
  };
}

export async function activateListing(id: string) {
  const { getListingPricing } = await import("./config.server");
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);

  if (!listing) {
    throw new CelisError("Listing not found", "LISTING_NOT_FOUND", 404);
  }

  const pricing = await getListingPricing(listing.price, listing.condition);

  const [updated] = await db
    .update(listings)
    .set({
      status: "active",
      expiresAt: pricing.expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id))
    .returning();
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

  const orderBy =
    sort === "price_asc"
      ? asc(listings.price)
      : sort === "price_desc"
      ? desc(listings.price)
      : desc(listings.createdAt);

  conditions.push(
    sql`(${listings.expiresAt} IS NULL OR ${listings.expiresAt} > now())`
  );

  const offset = (page - 1) * limit;

  const rows = await db
    .select({ listing: listings, categoryName: categories.name })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(orderBy)
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
    .orderBy(desc(listings.createdAt))
    .limit(limit);

  return rows.map((r) => mapListingPublic(r.listing, r.categoryName));
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
