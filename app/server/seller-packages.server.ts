import { db } from "~/db";
import { profiles, users, listings, listingPackages, sellerSubscriptions } from "~/db/schema";
import { eq, and, or, gte, lte, count, desc, isNull } from "drizzle-orm";

function randomSellerNumber() {
  // 8-digit number, padded with leading zeros.
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

export async function generateUniqueSellerNumber(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const candidate = randomSellerNumber();
    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.sellerNumber, candidate))
      .limit(1);
    if (existing.length === 0) return candidate;
    attempts++;
  }
  // Fallback: include timestamp to guarantee uniqueness.
  return String(Date.now()).slice(-8);
}

export async function ensureProfileSellerNumber(profileId: string) {
  const rows = await db
    .select({
      sellerNumber: profiles.sellerNumber,
      role: users.role,
      isInternal: users.isInternal,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.id, users.id))
    .where(eq(profiles.id, profileId))
    .limit(1);
  const row = rows[0];
  if (!row || row.role !== "seller" || row.isInternal) {
    // Only external sellers receive seller numbers. Clear any existing number
    // for buyers or internal staff.
    if (row?.sellerNumber) {
      await db
        .update(profiles)
        .set({ sellerNumber: null, updatedAt: new Date() })
        .where(eq(profiles.id, profileId));
    }
    return null;
  }
  if (row.sellerNumber) return row.sellerNumber;
  const sellerNumber = await generateUniqueSellerNumber();
  await db
    .update(profiles)
    .set({ sellerNumber, updatedAt: new Date() })
    .where(eq(profiles.id, profileId));
  return sellerNumber;
}

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
        eq(listingPackages.isActive, true),
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
        gte(listings.createdAt, since),
        or(
          eq(listings.status, "active"),
          eq(listings.status, "pending_review"),
          eq(listings.status, "sold")
        )
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
  if (!pkg[0].isActive) throw new Error("Cannot assign an inactive package");

  const startedAt = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pkg[0].durationDays);

  // A seller can only have one active subscription at a time. Cancel any
  // existing active subscription before assigning the new one.
  await db
    .update(sellerSubscriptions)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(sellerSubscriptions.sellerId, sellerId),
        eq(sellerSubscriptions.status, "active")
      )
    );

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

export async function listListingPackages(
  options: { sellerType?: "individual" | "shop" } = {}
) {
  const now = new Date();
  const conditions = [
    eq(listingPackages.isActive, true),
    or(isNull(listingPackages.effectiveFrom), lte(listingPackages.effectiveFrom, now)),
    or(isNull(listingPackages.effectiveUntil), gte(listingPackages.effectiveUntil, now)),
  ];
  if (options.sellerType) {
    conditions.push(
      or(
        isNull(listingPackages.sellerTypeEligibility),
        eq(listingPackages.sellerTypeEligibility, options.sellerType)
      )
    );
  }
  return db
    .select()
    .from(listingPackages)
    .where(and(...conditions))
    .orderBy(listingPackages.price, listingPackages.name);
}

export async function createListingPackage(input: {
  code: string;
  name: string;
  description?: string;
  sellerTypeEligibility?: "individual" | "shop" | null;
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
      code: input.code,
      name: input.name,
      description: input.description,
      sellerTypeEligibility: input.sellerTypeEligibility ?? null,
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
    code: string;
    name: string;
    description: string;
    sellerTypeEligibility: "individual" | "shop" | null;
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

  // Deactivating a package should revoke access for sellers currently on it.
  if (pkg && input.isActive === false) {
    await db
      .update(sellerSubscriptions)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(sellerSubscriptions.packageId, id),
          eq(sellerSubscriptions.status, "active")
        )
      );
  }

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
