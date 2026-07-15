import { db } from "~/db";
import { profiles, users, listings, listingPackages, sellerSubscriptions } from "~/db/schema";
import { eq, and, gte, count, desc } from "drizzle-orm";

export async function getSellerProfile(sellerId: string) {
  const rows = await db
    .select({ profile: profiles, user: users })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(eq(users.id, sellerId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getActiveSellerSubscription(sellerId: string) {
  const now = new Date();
  const rows = await db
    .select({
      subscription: sellerSubscriptions,
      package: listingPackages,
    })
    .from(sellerSubscriptions)
    .innerJoin(listingPackages, eq(sellerSubscriptions.packageId, listingPackages.id))
    .where(
      and(
        eq(sellerSubscriptions.sellerId, sellerId),
        eq(sellerSubscriptions.status, "active"),
        gte(sellerSubscriptions.expiresAt, now)
      )
    )
    .orderBy(desc(sellerSubscriptions.expiresAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function countSubscriptionListings(
  sellerId: string,
  since: Date
) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(listings)
    .where(
      and(
        eq(listings.sellerId, sellerId),
        gte(listings.createdAt, since)
      )
    );
  return Number(value);
}

export async function getSellerListingEligibility(sellerId: string) {
  const seller = await getSellerProfile(sellerId);
  const sellerType = seller?.profile?.sellerType ?? "individual";

  if (sellerType === "individual") {
    return {
      sellerType,
      canList: true,
      requiresPayment: true,
      feeCents: null as number | null,
      remainingListings: null as number | null,
      subscription: null,
    };
  }

  const sub = await getActiveSellerSubscription(sellerId);
  if (!sub) {
    return {
      sellerType,
      canList: false,
      requiresPayment: false,
      feeCents: null,
      remainingListings: 0,
      subscription: null,
    };
  }

  const used = await countSubscriptionListings(
    sellerId,
    sub.subscription.startedAt
  );
  const remaining = sub.package.isUnlimited
    ? null
    : Math.max(0, sub.package.listingAllowance - used);

  return {
    sellerType,
    canList: sub.package.isUnlimited || (remaining !== null && remaining > 0),
    requiresPayment: false,
    feeCents: null,
    remainingListings: remaining,
    subscription: sub,
  };
}

export async function assignSellerPackage(
  sellerId: string,
  packageId: string,
  options?: {
    assignedBy?: string;
    assignmentSource?: string;
    paymentReference?: string;
    pricePaidCents?: number;
  }
) {
  const pkg = await db
    .select()
    .from(listingPackages)
    .where(eq(listingPackages.id, packageId))
    .limit(1);
  if (!pkg[0]) throw new Error("Package not found");

  const startedAt = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pkg[0].durationDays);

  await db.insert(sellerSubscriptions).values({
    sellerId,
    packageId,
    startedAt,
    expiresAt,
    status: "active",
    assignedBy: options?.assignedBy,
    assignmentSource: options?.assignmentSource,
    paymentReference: options?.paymentReference,
    pricePaidCents: options?.pricePaidCents,
  });

  return getActiveSellerSubscription(sellerId);
}

export async function listListingPackages() {
  return db
    .select()
    .from(listingPackages)
    .where(eq(listingPackages.isActive, true))
    .orderBy(listingPackages.price, listingPackages.name);
}

export async function createListingPackage(input: {
  name: string;
  description?: string;
  listingAllowance: number;
  durationDays: number;
  price: number;
  currency?: string;
  isUnlimited?: boolean;
  featuredAllowance?: number;
  autoRenew?: boolean;
  gracePeriodDays?: number;
}) {
  const [pkg] = await db
    .insert(listingPackages)
    .values({
      name: input.name,
      description: input.description,
      listingAllowance: input.listingAllowance,
      isUnlimited: input.isUnlimited ?? false,
      durationDays: input.durationDays,
      price: input.price,
      currency: input.currency ?? "USD",
      featuredAllowance: input.featuredAllowance,
      autoRenew: input.autoRenew,
      gracePeriodDays: input.gracePeriodDays,
    })
    .returning();
  return pkg;
}

export async function updateListingPackage(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    listingAllowance: number;
    isUnlimited: boolean;
    featuredAllowance: number;
    durationDays: number;
    price: number;
    currency: string;
    autoRenew: boolean;
    gracePeriodDays: number;
    isActive: boolean;
  }>
) {
  const [pkg] = await db
    .update(listingPackages)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(listingPackages.id, id))
    .returning();
  return pkg;
}

export async function getSellerSubscriptions(sellerId: string) {
  return db
    .select({
      subscription: sellerSubscriptions,
      package: listingPackages,
    })
    .from(sellerSubscriptions)
    .innerJoin(
      listingPackages,
      eq(sellerSubscriptions.packageId, listingPackages.id)
    )
    .where(eq(sellerSubscriptions.sellerId, sellerId))
    .orderBy(desc(sellerSubscriptions.createdAt));
}

export async function getCurrentSellerSubscription(sellerId: string) {
  const sub = await getActiveSellerSubscription(sellerId);
  if (!sub) return null;
  const used = await countSubscriptionListings(
    sellerId,
    sub.subscription.startedAt
  );
  return {
    packageName: sub.package.name,
    listingAllowance: sub.package.isUnlimited
      ? null
      : sub.package.listingAllowance,
    isUnlimited: sub.package.isUnlimited,
    used,
    remaining: sub.package.isUnlimited
      ? null
      : Math.max(0, sub.package.listingAllowance - used),
    expiresAt: sub.subscription.expiresAt,
  };
}
