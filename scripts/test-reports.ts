import { db } from "~/db";
import { listings, categories, users, profiles } from "~/db/schema";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

async function main() {
  const reviewer = alias(users, "reviewer");
  const reviewerProfile = alias(profiles, "reviewer_profile");
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = new Date();
  const where = and(gte(listings.createdAt, from), lte(listings.createdAt, to));

  try {
    const rows = await db
      .select({
        listing: listings,
        categoryName: categories.name,
        sellerName: profiles.displayName,
        sellerEmail: users.email,
        reviewerName: reviewerProfile.displayName,
      })
      .from(listings)
      .innerJoin(categories, eq(listings.categoryId, categories.id))
      .innerJoin(users, eq(listings.sellerId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.id))
      .leftJoin(reviewer, eq(reviewer.id, listings.reviewedBy))
      .leftJoin(reviewerProfile, eq(reviewerProfile.id, reviewer.id))
      .where(where)
      .orderBy(desc(listings.createdAt))
      .limit(5);
    console.log("OK", rows.length, "rows");
  } catch (e) {
    console.error("ERROR", e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main();
