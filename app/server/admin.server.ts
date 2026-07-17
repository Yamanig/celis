import { db } from "~/db";
import {
  users,
  profiles,
  authUsers,
  listings,
  categories,
  walletPayments,
  orders,
  payouts,
  platformConfigs,
  listingPackages,
  sellerSubscriptions,
  categoryFees,
  roles,
} from "~/db/schema";
import {
  eq,
  desc,
  asc,
  count,
  ilike,
  or,
  and,
  sql,
  gte,
  lte,
  sum,
  inArray,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAdmin, requirePermission, isInternalRole } from "./auth.server";
import { insertAuditLog } from "./audit.server";
import { createNotification } from "./notifications.server";
import { generateUniqueSellerNumber } from "./seller-packages.server";
import type { UserRole, ListingStatus, VerificationStatus } from "~/db/schema";
import { getServiceSupabase } from "~/lib/supabase/server";
import {
  calculateListingPricing,
  DEFAULT_LISTING_TIERS,
} from "~/lib/pricing";
import { getListingTiersConfig } from "./config.server";
import { approveListing, rejectListing } from "./listings.server";

interface DashboardCounts extends Record<string, unknown> {
  users: number;
  listings: number;
  active_listings: number;
  suspended_listings: number;
  expiring_soon: number;
  orders: number;
  payments: number;
  completed_payments: number;
  total_revenue: number;
  total_payouts: number;
  pending_payouts: number;
}

const RECENT_LIMIT = 10;
const TREND_DAYS = 14;
const EXPIRING_SOON_DAYS = 3;

function getTrendStart() {
  const d = new Date();
  d.setDate(d.getDate() - TREND_DAYS + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getAdminDashboardStats() {
  const admin = await requireAdmin();
  const trendStart = getTrendStart();

  const expiringSoonThreshold = new Date();
  expiringSoonThreshold.setDate(
    expiringSoonThreshold.getDate() + EXPIRING_SOON_DAYS
  );

  const countsResult = await db.execute(sql`
    WITH counts AS (
      SELECT
        (SELECT count(*)::int FROM ${users}) AS users,
        (SELECT count(*)::int FROM ${listings}) AS listings,
        (SELECT count(*)::int FROM ${listings} WHERE ${listings.status} = 'active') AS active_listings,
        (SELECT count(*)::int FROM ${listings} WHERE ${listings.status} = 'suspended') AS suspended_listings,
        (
          SELECT count(*)::int
          FROM ${listings}
          WHERE ${listings.status} = 'active'
            AND ${listings.expiresAt} <= ${expiringSoonThreshold.toISOString()}
            AND ${listings.expiresAt} >= now()
        ) AS expiring_soon,
        (SELECT count(*)::int FROM ${orders}) AS orders,
        (SELECT count(*)::int FROM ${walletPayments}) AS payments,
        (SELECT count(*)::int FROM ${walletPayments} WHERE ${walletPayments.status} = 'completed') AS completed_payments,
        (SELECT COALESCE(sum(${walletPayments.amount}), 0)::int FROM ${walletPayments} WHERE ${walletPayments.status} = 'completed') AS total_revenue,
        (SELECT COALESCE(sum(${payouts.amount}), 0)::int FROM ${payouts} WHERE ${payouts.status} = 'completed') AS total_payouts,
        (SELECT count(*)::int FROM ${payouts} WHERE ${payouts.status} = 'pending') AS pending_payouts
    )
    SELECT * FROM counts
  `);
  const countsRow = (countsResult as unknown as DashboardCounts[])[0];

  const totalRevenue = Number(countsRow.total_revenue ?? 0);
  const totalPayouts = Number(countsRow.total_payouts ?? 0);

  const ordersByStatus = await db
    .select({ status: orders.status, value: count() })
    .from(orders)
    .groupBy(orders.status);

  const paymentsByDay = await db
    .select({
      day: sql<string>`to_char(${walletPayments.createdAt}, 'YYYY-MM-DD')`,
      amount: sum(walletPayments.amount),
      count: count(),
    })
    .from(walletPayments)
    .where(sql`${walletPayments.createdAt} >= ${trendStart.toISOString()}`)
    .groupBy(sql`to_char(${walletPayments.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${walletPayments.createdAt}, 'YYYY-MM-DD')`);

  const payoutsByDay = await db
    .select({
      day: sql<string>`to_char(${payouts.createdAt}, 'YYYY-MM-DD')`,
      amount: sum(payouts.amount),
      count: count(),
    })
    .from(payouts)
    .where(
      and(
        eq(payouts.status, "completed"),
        sql`${payouts.createdAt} >= ${trendStart.toISOString()}`
      )
    )
    .groupBy(sql`to_char(${payouts.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${payouts.createdAt}, 'YYYY-MM-DD')`);

  const trendMap = new Map<string, { payments: number; payouts: number }>();
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(trendStart);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    trendMap.set(key, { payments: 0, payouts: 0 });
  }
  for (const row of paymentsByDay) {
    const existing = trendMap.get(row.day);
    if (existing) existing.payments = Number(row.amount ?? 0);
  }
  for (const row of payoutsByDay) {
    const existing = trendMap.get(row.day);
    if (existing) existing.payouts = Number(row.amount ?? 0);
  }
  const trend = Array.from(trendMap.entries()).map(([date, values]) => ({
    date,
    payments: values.payments,
    payouts: values.payouts,
    net: values.payments - values.payouts,
  }));

  const result = {
    admin,
    counts: {
      users: countsRow.users,
      listings: countsRow.listings,
      activeListings: countsRow.active_listings,
      suspendedListings: countsRow.suspended_listings,
      orders: countsRow.orders,
      payments: countsRow.payments,
      completedPayments: countsRow.completed_payments,
      pendingPayouts: countsRow.pending_payouts,
      expiringSoon: countsRow.expiring_soon,
      totalRevenue,
      totalPayouts,
      netRevenue: Number(totalRevenue) - Number(totalPayouts),
    },
    ordersByStatus: ordersByStatus.map((r) => ({
      status: r.status,
      value: Number(r.value),
    })),
    trend,
  };
  return result;
}

export async function getAdminRecentActivity() {
  await requireAdmin();

  const recentListings = await db
    .select({
      listing: listings,
      categoryName: categories.name,
      sellerName: profiles.displayName,
    })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .innerJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .orderBy(desc(listings.createdAt))
    .limit(RECENT_LIMIT);

  const recentUsers = await db
    .select({ user: users, profile: profiles })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .orderBy(desc(users.createdAt))
    .limit(RECENT_LIMIT);

  const recentPayments = await db
    .select({
      payment: walletPayments,
      userEmail: users.email,
    })
    .from(walletPayments)
    .innerJoin(users, eq(walletPayments.userId, users.id))
    .orderBy(desc(walletPayments.createdAt))
    .limit(RECENT_LIMIT);

  return {
    recentListings: recentListings.map((r) => ({
      id: r.listing.id,
      title: r.listing.title,
      price: r.listing.price,
      status: r.listing.status,
      categoryName: r.categoryName,
      sellerName: r.sellerName ?? "Unknown",
      createdAt: toDateString(r.listing.createdAt),
    })),
    recentUsers: recentUsers.map((r) => ({
      id: r.user.id,
      email: r.user.email,
      role: r.user.role,
      displayName: r.profile?.displayName ?? null,
      isVerified:
        r.user.verificationStatus === "approved" || r.user.verifiedAt !== null,
      isSuperAdmin: r.user.isSuperAdmin,
      createdAt: toDateString(r.user.createdAt),
    })),
    recentPayments: recentPayments.map((r) => ({
      id: r.payment.id,
      amount: r.payment.amount,
      status: r.payment.status,
      userEmail: r.userEmail,
      createdAt: toDateString(r.payment.createdAt),
    })),
  };
}

function toDateString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export async function getAdminUsers(options?: {
  search?: string;
  role?: UserRole;
  domain?: "customer" | "internal";
  page?: number;
  limit?: number;
}) {
  await requirePermission("users:read");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;

  const conditions = [];
  if (options?.search) {
    const term = `%${options.search}%`;
    conditions.push(
      or(
        ilike(users.email, term),
        ilike(profiles.displayName, term),
        ilike(users.walletPhone, term),
        ilike(profiles.sellerNumber, term)
      )
    );
  }
  if (options?.role) {
    conditions.push(eq(users.role, options.role));
  }
  if (options?.domain) {
    const domainRoles = await db
      .select({ key: roles.key })
      .from(roles)
      .where(eq(roles.domain, options.domain));
    const roleKeys = domainRoles.map((r) => r.key);
    if (roleKeys.length > 0) {
      conditions.push(inArray(users.role, roleKeys));
    } else {
      // No roles in this domain; return empty result.
      conditions.push(sql`1 = 0`);
    }
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where);

  const rows = await db
    .select({ user: users, profile: profiles })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows.map((r) => ({
      id: r.user.id,
      email: r.user.email,
      role: r.user.role,
      isInternal: r.user.isInternal,
      displayName: r.profile?.displayName ?? null,
      phone: r.user.walletPhone ?? r.profile?.phone ?? null,
      isVerified:
        r.user.verificationStatus === "approved" || r.user.verifiedAt !== null,
      verificationStatus: r.user.verificationStatus,
      verificationRejectionReason: r.user.verificationRejectionReason,
      isSuperAdmin: r.user.isSuperAdmin,
      sellerType: r.profile?.sellerType ?? "individual",
      businessName: r.profile?.businessName ?? null,
      sellerNumber: r.profile?.sellerNumber ?? null,
      createdAt: r.user.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateUserRole(id: string, role: UserRole, actorId: string) {
  await requirePermission("users:manage");

  const roleRecord = await db
    .select({ key: roles.key, domain: roles.domain })
    .from(roles)
    .where(eq(roles.key, role))
    .limit(1);
  if (!roleRecord[0]) throw new Error("Role not found");

  const [user] = await db
    .select({ role: users.role, isInternal: users.isInternal })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!user) throw new Error("User not found");

  // Prevent promoting an external customer to an internal role through the
  // simple role dropdown. Internal users must be created via the invite flow.
  if (roleRecord[0].domain === "internal" && !user.isInternal && user.role !== "admin") {
    throw new Error(
      "External customers cannot be converted to internal staff via role change. Use the invite internal user flow."
    );
  }

  await db.update(users).set({ role }).where(eq(users.id, id));
  await insertAuditLog({
    action: "user_role_changed",
    resourceType: "user",
    resourceId: id,
    metadata: { previousRole: user.role, newRole: role, actorId },
  });
  return { success: true };
}

export async function createInternalUser(input: {
  email: string;
  password: string;
  role: UserRole;
  department?: string;
}) {
  await requirePermission("users:manage");

  if (!(await isInternalRole(input.role as UserRole))) {
    throw new Error("Selected role is not an internal staff role");
  }

  const supabase = getServiceSupabase();

  // Create the Supabase Auth user. Do not send an email confirmation; internal
  // users are provisioned directly by administrators.
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Failed to create auth user");
  }

  const id = authData.user.id;

  // Mirror into auth.users so local FKs are satisfied.
  await db
    .insert(authUsers)
    .values({ id, email: input.email })
    .onConflictDoNothing({ target: authUsers.id });

  await db.insert(users).values({
    id,
    email: input.email,
    role: input.role as UserRole,
    isInternal: true,
    department: input.department || null,
    verificationStatus: "approved",
    verifiedAt: new Date(),
  });

  await db.insert(profiles).values({
    id,
    displayName: input.email.split("@")[0],
    sellerNumber: await generateUniqueSellerNumber(),
  });

  await insertAuditLog({
    action: "internal_user_created",
    resourceType: "user",
    resourceId: id,
    metadata: { email: input.email, role: input.role, department: input.department },
  });

  return { id, email: input.email };
}

export async function toggleUserVerification(id: string) {
  await requirePermission("users:manage");
  const [user] = await db
    .select({ verifiedAt: users.verifiedAt, verificationStatus: users.verificationStatus })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  const approving = user?.verificationStatus !== "approved";
  const updates = approving
    ? { verificationStatus: "approved" as VerificationStatus, verifiedAt: new Date(), verificationRejectionReason: null }
    : { verificationStatus: "pending" as VerificationStatus, verifiedAt: null, verificationRejectionReason: null };
  await db.update(users).set(updates).where(eq(users.id, id));
  await insertAuditLog({
    action: "user_verification_toggled",
    resourceType: "user",
    resourceId: id,
    metadata: { verified: approving },
  });
  return { success: true, verified: approving };
}

export async function getUnverifiedSellers(options?: {
  search?: string;
  status?: VerificationStatus;
  page?: number;
  limit?: number;
}) {
  await requirePermission("seller:verify");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;

  const conditions = [
    eq(users.role, "seller"),
    or(
      eq(users.verificationStatus, "pending"),
      eq(users.verificationStatus, "rejected")
    ),
  ];

  if (options?.search) {
    const term = `%${options.search}%`;
    conditions.push(
      or(
        ilike(users.email, term),
        ilike(profiles.displayName, term),
        ilike(users.walletPhone, term)
      )
    );
  }
  if (options?.status) {
    conditions.push(eq(users.verificationStatus, options.status));
  }

  const where = and(...conditions);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where);

  const rows = await db
    .select({ user: users, profile: profiles })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows.map((r) => ({
      id: r.user.id,
      email: r.user.email,
      displayName: r.profile?.displayName ?? null,
      phone: r.user.walletPhone ?? r.profile?.phone ?? null,
      sellerType: r.profile?.sellerType ?? "individual",
      businessName: r.profile?.businessName ?? null,
      businessRegistrationNumber: r.profile?.businessRegistrationNumber ?? null,
      businessAddress: r.profile?.businessAddress ?? null,
      verificationStatus: r.user.verificationStatus,
      verificationRejectionReason: r.user.verificationRejectionReason,
      verifiedAt: r.user.verifiedAt,
      createdAt: r.user.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function reviewSellerVerification(
  id: string,
  action: "approve" | "reject" | "suspend",
  reason: string,
  actorId: string
) {
  await requirePermission("seller:verify");

  const [user] = await db
    .select({ verificationStatus: users.verificationStatus, verifiedAt: users.verifiedAt })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!user) throw new Error("User not found");

  const previousStatus = user.verificationStatus;
  const updates: {
    verificationStatus: VerificationStatus;
    verifiedAt: Date | null;
    verificationRejectionReason: string | null;
    updatedAt: Date;
  } = {
    verificationStatus: "pending",
    verifiedAt: null,
    verificationRejectionReason: null,
    updatedAt: new Date(),
  };

  if (action === "approve") {
    updates.verificationStatus = "approved";
    updates.verifiedAt = new Date();
  } else if (action === "reject") {
    updates.verificationStatus = "rejected";
    updates.verificationRejectionReason = reason || null;
  } else if (action === "suspend") {
    updates.verificationStatus = "suspended";
    updates.verificationRejectionReason = reason || null;
  }

  await db.update(users).set(updates).where(eq(users.id, id));

  await insertAuditLog({
    action: action === "approve" ? "seller_verification_approved" : action === "reject" ? "seller_verification_rejected" : "seller_verification_suspended",
    resourceType: "user",
    resourceId: id,
    metadata: {
      previousStatus,
      newStatus: updates.verificationStatus,
      reason: action === "approve" ? undefined : reason,
      actorId,
    },
  });

  const notificationType =
    action === "approve"
      ? "seller_verification_approved"
      : action === "reject"
      ? "seller_verification_rejected"
      : "seller_verification_suspended";
  const title =
    action === "approve"
      ? "Seller verification approved"
      : action === "reject"
      ? "Seller verification rejected"
      : "Seller verification suspended";
  const body =
    action === "approve"
      ? "Your seller verification has been approved. You can now publish listings."
      : reason
      ? `Your seller verification was ${action}ed. Reason: ${reason}`
      : `Your seller verification was ${action}ed.`;

  await createNotification({
    userId: id,
    type: notificationType,
    title,
    body,
    link: "/dashboard",
    metadata: { previousStatus, newStatus: updates.verificationStatus, reason },
  });

  return { success: true, status: updates.verificationStatus };
}

export async function toggleUserSuperAdmin(id: string) {
  const actor = await requirePermission("users:manage");
  if (!actor.isSuperAdmin) {
    throw new Error("Only super admins can change super-admin status");
  }
  const [user] = await db
    .select({ isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  const next = !user?.isSuperAdmin;
  await db.update(users).set({ isSuperAdmin: next }).where(eq(users.id, id));
  await insertAuditLog({
    action: "user_super_admin_toggled",
    resourceType: "user",
    resourceId: id,
    metadata: { isSuperAdmin: next, actorId: actor.id },
  });
  return { success: true, isSuperAdmin: next };
}

export async function getAdminListings(options?: {
  status?: string;
  categoryId?: string;
  sellerId?: string;
  expiryWindow?: number;
  packageId?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}) {
  await requirePermission("listings:read");
  const config = await getListingTiersConfig();

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;

  const conditions = [];
  if (options?.status)
    conditions.push(eq(listings.status, options.status as never));
  if (options?.categoryId)
    conditions.push(eq(listings.categoryId, options.categoryId));
  if (options?.sellerId)
    conditions.push(eq(listings.sellerId, options.sellerId));
  if (options?.paymentStatus)
    conditions.push(eq(listings.monetizationStatus, options.paymentStatus as never));

  const now = new Date();

  if (options?.expiryWindow !== undefined) {
    const threshold = new Date();
    threshold.setDate(now.getDate() + options.expiryWindow);
    if (options.expiryWindow === 0) {
      // Already expired
      conditions.push(sql`${listings.expiresAt} < ${now.toISOString()}`);
    } else {
      conditions.push(
        sql`${listings.expiresAt} <= ${threshold.toISOString()}`,
        sql`${listings.expiresAt} >= ${now.toISOString()}`
      );
    }
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const activeSubscription = db
    .select({
      sellerId: sellerSubscriptions.sellerId,
      packageId: sellerSubscriptions.packageId,
    })
    .from(sellerSubscriptions)
    .where(
      and(
        eq(sellerSubscriptions.status, "active"),
        gte(sellerSubscriptions.expiresAt, now)
      )
    )
    .as("active_subscription");

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .innerJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .leftJoin(activeSubscription, eq(activeSubscription.sellerId, listings.sellerId))
    .leftJoin(listingPackages, eq(listingPackages.id, activeSubscription.packageId))
    .where(where);

  const orderBy =
    options?.expiryWindow !== undefined
      ? asc(listings.expiresAt)
      : desc(listings.createdAt);

  const rows = await db
    .select({
      listing: listings,
      categoryName: categories.name,
      sellerName: profiles.displayName,
      sellerEmail: users.email,
      packageName: listingPackages.name,
    })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .innerJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .leftJoin(activeSubscription, eq(activeSubscription.sellerId, listings.sellerId))
    .leftJoin(listingPackages, eq(listingPackages.id, activeSubscription.packageId))
    .where(where)
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows.map((r) => {
      const pricing = calculateListingPricing(
        r.listing.price,
        config,
        { monetizationModel: "fixed_only" }
      );
      return {
        id: r.listing.id,
        title: r.listing.title,
        price: r.listing.price,
        status: r.listing.status,
        condition: r.listing.condition,
        categoryName: r.categoryName,
        sellerName: r.sellerName ?? r.sellerEmail,
        sellerId: r.listing.sellerId,
        packageName: r.packageName,
        tierLabel: pricing.tierLabel,
        monetizationStatus: r.listing.monetizationStatus,
        expiresAt: r.listing.expiresAt,
        reviewedAt: r.listing.reviewedAt,
        rejectionReason: r.listing.rejectionReason,
        createdAt: r.listing.createdAt,
        updatedAt: r.listing.updatedAt,
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function extendListingExpiry(
  listingId: string,
  days: number,
  reason: string,
  actorId: string
) {
  await requirePermission("listings:moderate");
  const [listing] = await db
    .select({ expiresAt: listings.expiresAt })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!listing) throw new Error("Listing not found");

  const previousExpiresAt = listing.expiresAt;
  const newExpiresAt = new Date();
  if (previousExpiresAt && previousExpiresAt > newExpiresAt) {
    newExpiresAt.setTime(previousExpiresAt.getTime());
  }
  newExpiresAt.setDate(newExpiresAt.getDate() + days);

  const extensionLog = {
    previousExpiresAt: previousExpiresAt?.toISOString() ?? null,
    newExpiresAt: newExpiresAt.toISOString(),
    extendedBy: actorId,
    reason,
    timestamp: new Date().toISOString(),
  };

  await db
    .update(listings)
    .set({
      expiresAt: newExpiresAt,
      expiryExtensionLog: sql`COALESCE(${listings.expiryExtensionLog}, '[]'::jsonb) || ${JSON.stringify([extensionLog])}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId));

  await insertAuditLog({
    action: "listing_expiry_extended",
    resourceType: "listing",
    resourceId: listingId,
    metadata: extensionLog,
  });

  return { success: true, newExpiresAt };
}

export async function notifyExpiringSeller(
  listingId: string,
  channel: string,
  actorId: string
) {
  await requirePermission("listings:moderate");
  const [listing] = await db
    .select({ sellerId: listings.sellerId, title: listings.title, expiresAt: listings.expiresAt })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!listing) throw new Error("Listing not found");

  const result = `queued_${channel}`;
  const entry = {
    channel,
    sentAt: new Date().toISOString(),
    result,
  };

  await db
    .update(listings)
    .set({
      expiryNotifiedAt: sql`COALESCE(${listings.expiryNotifiedAt}, '[]'::jsonb) || ${JSON.stringify([entry])}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, listingId));

  await createNotification({
    userId: listing.sellerId,
    type: "listing_expiring_soon",
    title: "Your listing is expiring soon",
    body: listing.expiresAt
      ? `"${listing.title}" expires on ${new Date(listing.expiresAt).toLocaleDateString()}. Renew it to keep it visible.`
      : `"${listing.title}" is expiring soon. Renew it to keep it visible.`,
    link: `/dashboard`,
    metadata: { listingId, channel, expiresAt: listing.expiresAt?.toISOString() },
  });

  await insertAuditLog({
    action: "listing_expiry_notification_sent",
    resourceType: "listing",
    resourceId: listingId,
    metadata: { channel, result, sellerId: listing.sellerId, actorId },
  });

  return { success: true, result };
}

export async function updateListingStatus(id: string, status: ListingStatus) {
  await requirePermission("listings:moderate");
  await db.update(listings).set({ status }).where(eq(listings.id, id));
  await insertAuditLog({
    action: "listing_status_changed",
    resourceType: "listing",
    resourceId: id,
    metadata: { status },
  });
  return { success: true };
}

export { approveListing, rejectListing };

export async function getAdminCategories(options?: {
  page?: number;
  limit?: number;
}) {
  await requirePermission("categories:manage");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(categories);

  const rows = await db
    .select({
      category: categories,
      listingCount: count(listings.id),
    })
    .from(categories)
    .leftJoin(listings, eq(listings.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(categories.sortOrder, categories.name)
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows.map((r) => ({
      id: r.category.id,
      name: r.category.name,
      slug: r.category.slug,
      sortOrder: r.category.sortOrder,
      listingCount: r.listingCount,
      createdAt: r.category.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createCategory(input: {
  name: string;
  slug: string;
  sortOrder?: number;
}) {
  await requirePermission("categories:manage");
  const [row] = await db
    .insert(categories)
    .values({
      name: input.name,
      slug: input.slug,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  await insertAuditLog({
    action: "category_created",
    resourceType: "category",
    resourceId: row.id,
    metadata: { name: row.name, slug: row.slug },
  });
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateCategory(
  id: string,
  input: { name?: string; slug?: string; sortOrder?: number }
) {
  await requirePermission("categories:manage");
  const [row] = await db
    .update(categories)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(categories.id, id))
    .returning();
  await insertAuditLog({
    action: "category_updated",
    resourceType: "category",
    resourceId: id,
    metadata: input,
  });
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getAdminCategoryFees(categoryId: string) {
  await requirePermission("categories:manage");
  const rows = await db
    .select({
      fee: categoryFees,
      categoryName: categories.name,
    })
    .from(categoryFees)
    .leftJoin(categories, eq(categoryFees.categoryId, categories.id))
    .where(eq(categoryFees.categoryId, categoryId))
    .orderBy(categoryFees.feeType, categoryFees.createdAt);

  return rows.map((r) => ({
    id: r.fee.id,
    categoryId: r.fee.categoryId,
    categoryName: r.categoryName,
    feeType: r.fee.feeType,
    amount: r.fee.amount,
    percentage: r.fee.percentage,
    isActive: r.fee.isActive,
    effectiveFrom: r.fee.effectiveFrom?.toISOString() ?? null,
    effectiveUntil: r.fee.effectiveUntil?.toISOString() ?? null,
    startsAt: r.fee.startsAt?.toISOString() ?? null,
    endsAt: r.fee.endsAt?.toISOString() ?? null,
    createdAt: r.fee.createdAt?.toISOString() ?? null,
    updatedAt: r.fee.updatedAt?.toISOString() ?? null,
  }));
}

export async function createCategoryFee(input: {
  categoryId: string;
  feeType: "listing_fee" | "commission";
  amount?: number;
  percentage?: number;
  isActive?: boolean;
  effectiveFrom?: Date;
  effectiveUntil?: Date;
}) {
  await requirePermission("categories:manage");
  const [row] = await db
    .insert(categoryFees)
    .values({
      categoryId: input.categoryId,
      feeType: input.feeType,
      amount: input.feeType === "listing_fee" ? (input.amount ?? 0) : 0,
      percentage: input.feeType === "commission" ? (input.percentage ?? 0) : 0,
      isActive: input.isActive ?? true,
      effectiveFrom: input.effectiveFrom ?? null,
      effectiveUntil: input.effectiveUntil ?? null,
    })
    .returning();
  await insertAuditLog({
    action: "category_fee_created",
    resourceType: "category_fee",
    resourceId: row.id,
    metadata: {
      categoryId: row.categoryId,
      feeType: row.feeType,
      amount: row.amount,
      percentage: row.percentage,
    },
  });
  return row;
}

export async function updateCategoryFee(
  id: string,
  input: {
    feeType?: "listing_fee" | "commission";
    amount?: number;
    percentage?: number;
    isActive?: boolean;
    effectiveFrom?: Date | null;
    effectiveUntil?: Date | null;
  }
) {
  await requirePermission("categories:manage");
  const updates: Partial<typeof categoryFees.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.feeType !== undefined) updates.feeType = input.feeType;
  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.percentage !== undefined) updates.percentage = input.percentage;
  if (input.isActive !== undefined) updates.isActive = input.isActive;
  if (input.effectiveFrom !== undefined) updates.effectiveFrom = input.effectiveFrom;
  if (input.effectiveUntil !== undefined) updates.effectiveUntil = input.effectiveUntil;

  const [row] = await db
    .update(categoryFees)
    .set(updates)
    .where(eq(categoryFees.id, id))
    .returning();
  await insertAuditLog({
    action: "category_fee_updated",
    resourceType: "category_fee",
    resourceId: id,
    metadata: input,
  });
  return row;
}

export async function deleteCategoryFee(id: string) {
  await requirePermission("categories:manage");
  await db.delete(categoryFees).where(eq(categoryFees.id, id));
  await insertAuditLog({
    action: "category_fee_deleted",
    resourceType: "category_fee",
    resourceId: id,
    metadata: {},
  });
  return { success: true };
}

export async function getAdminOrders(options?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  await requirePermission("orders:read");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;

  const conditions = [];
  if (options?.status)
    conditions.push(eq(orders.status, options.status as never));

  const where = conditions.length ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(orders)
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .innerJoin(users, eq(orders.buyerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .innerJoin(sql`users as seller`, eq(orders.sellerId, sql`seller.id`))
    .leftJoin(
      sql`profiles as seller_profile`,
      eq(sql`seller_profile.id`, sql`seller.id`)
    )
    .where(where);

  const rows = await db
    .select({
      order: orders,
      listingTitle: listings.title,
      buyerName: profiles.displayName,
      buyerEmail: users.email,
      sellerName: sql<string>`seller_profile.display_name`,
      sellerEmail: sql<string>`seller.email`,
    })
    .from(orders)
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .innerJoin(users, eq(orders.buyerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .innerJoin(sql`users as seller`, eq(orders.sellerId, sql`seller.id`))
    .leftJoin(
      sql`profiles as seller_profile`,
      eq(sql`seller_profile.id`, sql`seller.id`)
    )
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows.map((r) => ({
      id: r.order.id,
      listingTitle: r.listingTitle,
      salePrice: r.order.salePrice,
      platformFee: r.order.platformFee,
      shippingFee: r.order.shippingFee,
      netPayout: r.order.netPayout,
      status: r.order.status,
      buyerName: r.buyerName ?? r.buyerEmail,
      sellerName: r.sellerName ?? r.sellerEmail,
      createdAt: r.order.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateOrderStatus(
  id: string,
  status:
    | "pending"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "completed"
    | "cancelled"
    | "disputed"
) {
  await requirePermission("orders:manage");

  if (status === "completed") {
    const { completeOrder } = await import("./orders.server");
    await completeOrder(id);
  } else {
    const updates: Record<string, unknown> = { status };
    if (status === "disputed") updates.disputedAt = new Date();
    await db.update(orders).set(updates).where(eq(orders.id, id));
  }

  await insertAuditLog({
    action: "order_status_changed",
    resourceType: "order",
    resourceId: id,
    metadata: { status },
  });
  return { success: true };
}

export async function getAdminPayouts(options?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  await requirePermission("payouts:read");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;

  const conditions = [];
  if (options?.status)
    conditions.push(eq(payouts.status, options.status as never));

  const where = conditions.length ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(payouts)
    .innerJoin(users, eq(payouts.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where);

  const rows = await db
    .select({
      payout: payouts,
      userName: profiles.displayName,
      userEmail: users.email,
    })
    .from(payouts)
    .innerJoin(users, eq(payouts.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where)
    .orderBy(desc(payouts.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows.map((r) => ({
      id: r.payout.id,
      amount: r.payout.amount,
      fee: r.payout.fee,
      currency: r.payout.currency,
      status: r.payout.status,
      transferMethod: r.payout.transferMethod,
      destinationWallet: r.payout.destinationWallet,
      destinationPhone: r.payout.destinationPhone,
      bankTransferRef: r.payout.bankTransferRef,
      userName: r.userName ?? r.userEmail,
      createdAt: r.payout.createdAt,
      completedAt: r.payout.completedAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function retryPayout(id: string) {
  await requirePermission("payouts:manage");
  await db
    .update(payouts)
    .set({ status: "pending", updatedAt: new Date() })
    .where(eq(payouts.id, id));
  await insertAuditLog({
    action: "payout_retried",
    resourceType: "payout",
    resourceId: id,
  });
  return { success: true };
}

export async function markPayoutCompleted(id: string, note?: string) {
  await requirePermission("payouts:manage");
  const [payout] = await db
    .select({ userId: payouts.userId, amount: payouts.amount, currency: payouts.currency })
    .from(payouts)
    .where(eq(payouts.id, id))
    .limit(1);

  await db
    .update(payouts)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payouts.id, id));

  await insertAuditLog({
    action: "payout_completed",
    resourceType: "payout",
    resourceId: id,
    metadata: note ? { note } : undefined,
  });

  if (payout) {
    const amount = (payout.amount / 100).toFixed(2);
    await createNotification({
      userId: payout.userId,
      type: "payout_completed",
      title: "Payout completed",
      body: `Your payout of ${amount} ${payout.currency ?? "USD"} has been sent.`,
      link: "/dashboard",
      metadata: { payoutId: id, amount: payout.amount, currency: payout.currency, note },
    });
  }

  return { success: true };
}

type LedgerType = "all" | "payment" | "payout" | "refund";

async function getAdminLedgerRows(options?: {
  from?: string;
  to?: string;
  type?: LedgerType;
}) {
  await requirePermission("reports:read");

  const type = options?.type ?? "all";
  const from = options?.from ? new Date(options.from) : undefined;
  const to = options?.to ? new Date(options.to) : undefined;

  const includePayments = type === "all" || type === "payment";
  const includePayouts =
    type === "all" || type === "payout" || type === "refund";

  const paymentRows = includePayments
    ? await db
        .select({
          id: walletPayments.id,
          date: walletPayments.createdAt,
          type: sql<string>`'payment'`,
          partyEmail: users.email,
          amount: walletPayments.amount,
          currency: walletPayments.currency,
          status: walletPayments.status,
          reference: walletPayments.merchantRef,
        })
        .from(walletPayments)
        .innerJoin(users, eq(walletPayments.userId, users.id))
        .where(
          and(
            from ? gte(walletPayments.createdAt, from) : undefined,
            to ? lte(walletPayments.createdAt, to) : undefined
          )
        )
    : [];

  const payoutRows = includePayouts
    ? await db
        .select({
          id: payouts.id,
          date: payouts.createdAt,
          type: sql<string>`'payout'`,
          partyEmail: users.email,
          amount: payouts.amount,
          currency: payouts.currency,
          status: payouts.status,
          reference: payouts.bankTransferRef,
        })
        .from(payouts)
        .innerJoin(users, eq(payouts.userId, users.id))
        .where(
          and(
            from ? gte(payouts.createdAt, from) : undefined,
            to ? lte(payouts.createdAt, to) : undefined
          )
        )
    : [];

  const totals = {
    payments: paymentRows.reduce((sum, r) => sum + r.amount, 0),
    payouts: payoutRows.reduce((sum, r) => sum + r.amount, 0),
  };

  const rows = [...paymentRows, ...payoutRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const mapped = rows.map((r) => ({
    id: r.id,
    date: r.date,
    type: r.type as LedgerType | "payment" | "payout",
    party: r.partyEmail,
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    reference: r.reference,
  }));

  return { rows: mapped, totals };
}

export async function getAdminLedger(options?: {
  from?: string;
  to?: string;
  type?: LedgerType;
  page?: number;
  limit?: number;
}) {
  const { rows, totals } = await getAdminLedgerRows(options);
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const total = rows.length;
  const offset = (page - 1) * limit;
  const items = rows.slice(offset, offset + limit);

  return {
    items,
    totals,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function exportAdminLedger(options?: {
  from?: string;
  to?: string;
  type?: LedgerType;
}) {
  const { rows, totals } = await getAdminLedgerRows(options);
  return { rows, totals };
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getFailedPaymentsReport(options?: {
  from?: string;
  to?: string;
  includePending?: boolean;
  page?: number;
  limit?: number;
}) {
  await requirePermission("reports:read");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const from = options?.from ? startOfDay(new Date(options.from)) : undefined;
  const to = options?.to ? endOfDay(new Date(options.to)) : undefined;

  const statusCondition = options?.includePending
    ? or(eq(walletPayments.status, "failed"), eq(walletPayments.status, "pending"))
    : eq(walletPayments.status, "failed");
  const dateConditions = [
    statusCondition,
    from ? gte(walletPayments.createdAt, from) : undefined,
    to ? lte(walletPayments.createdAt, to) : undefined,
  ].filter(Boolean);
  const where = and(...dateConditions);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(walletPayments)
    .innerJoin(users, eq(walletPayments.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where);

  const rows = await db
    .select({
      payment: walletPayments,
      userEmail: users.email,
      userName: profiles.displayName,
    })
    .from(walletPayments)
    .innerJoin(users, eq(walletPayments.userId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where)
    .orderBy(desc(walletPayments.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows.map((r) => {
      const payload = (r.payment.callbackPayload ?? {}) as Record<string, unknown>;
      return {
        id: r.payment.id,
        merchantRef: r.payment.merchantRef,
        walletRef: r.payment.walletRef,
        userEmail: r.userEmail,
        userName: r.userName,
        amount: r.payment.amount,
        currency: r.payment.currency,
        provider: r.payment.walletProvider,
        status: r.payment.status,
        retryCount: r.payment.retryCount,
        errorCode: typeof payload.code === "string" ? payload.code : null,
        errorMessage:
          typeof payload.error === "string" ? payload.error : null,
        createdAt: r.payment.createdAt,
        updatedAt: r.payment.updatedAt,
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function exportFailedPaymentsReport(options?: {
  from?: string;
  to?: string;
  includePending?: boolean;
}) {
  const { items } = await getFailedPaymentsReport({
    ...options,
    page: 1,
    limit: 10_000,
  });
  return items;
}

export async function getNewUsersReport(options?: {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  await requirePermission("reports:read");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const from = options?.from ? startOfDay(new Date(options.from)) : startOfDay(new Date());
  const to = options?.to ? endOfDay(new Date(options.to)) : endOfDay(new Date());

  const where = and(gte(users.createdAt, from), lte(users.createdAt, to));

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where);

  const rows = await db
    .select({ user: users, profile: profiles })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows.map((r) => ({
      id: r.user.id,
      email: r.user.email,
      displayName: r.profile?.displayName ?? null,
      phone: r.user.walletPhone ?? r.profile?.phone ?? null,
      role: r.user.role,
      sellerType: r.profile?.sellerType ?? "individual",
      isVerified:
        r.user.verificationStatus === "approved" || r.user.verifiedAt !== null,
      createdAt: r.user.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function exportNewUsersReport(options?: {
  from?: string;
  to?: string;
}) {
  const { items } = await getNewUsersReport({ ...options, page: 1, limit: 10_000 });
  return items;
}

export async function getNewListingsReport(options?: {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  await requirePermission("reports:read");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const from = options?.from ? startOfDay(new Date(options.from)) : startOfDay(new Date());
  const to = options?.to ? endOfDay(new Date(options.to)) : endOfDay(new Date());

  const reviewer = alias(users, "reviewer");
  const reviewerProfile = alias(profiles, "reviewer_profile");

  const where = and(gte(listings.createdAt, from), lte(listings.createdAt, to));

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .innerJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .leftJoin(reviewer, eq(reviewer.id, listings.reviewedBy))
    .leftJoin(reviewerProfile, eq(reviewerProfile.id, reviewer.id))
    .where(where);

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
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows.map((r) => ({
      id: r.listing.id,
      title: r.listing.title,
      price: r.listing.price,
      condition: r.listing.condition,
      categoryName: r.categoryName,
      sellerName: r.sellerName ?? r.sellerEmail,
      status: r.listing.status,
      monetizationStatus: r.listing.monetizationStatus,
      monetizationType: r.listing.monetizationType,
      reviewerName: r.reviewerName,
      rejectionReason: r.listing.rejectionReason,
      createdAt: r.listing.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function exportNewListingsReport(options?: {
  from?: string;
  to?: string;
}) {
  const { items } = await getNewListingsReport({ ...options, page: 1, limit: 10_000 });
  return items;
}

const CONFIG_DEFAULTS: Record<string, string | number | boolean | object> = {
  platform_monetization_model: "fixed_only",
  listing_fee_cents: 100,
  commission_bps: 500,
  local_pickup_enabled: true,
  platform_shipping_enabled: true,
  commission_model_enabled: true,
  evc_enabled: true,
  premier_wallet_enabled: true,
  edahab_enabled: true,
  bank_transfer_payouts_enabled: true,
  listing_tiers: DEFAULT_LISTING_TIERS,
};

export async function getPlatformConfigAll() {
  await requirePermission("settings:manage");

  const rows = await db.select().from(platformConfigs);
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return Object.entries(CONFIG_DEFAULTS).map(([key, defaultValue]) => {
    const stored = map.get(key);
    const value = stored !== undefined ? stored : defaultValue;
    const row = rows.find((r) => r.key === key);
    return {
      key,
      value: value as string | number | boolean | object,
      defaultValue,
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null,
      description: row?.description ?? null,
      effectiveFrom: row?.effectiveFrom ?? null,
      effectiveUntil: row?.effectiveUntil ?? null,
    };
  });
}

export async function updatePlatformConfig(
  key: string,
  value: string | number | boolean | object,
  adminId: string,
  effectiveFrom?: Date | null,
  effectiveUntil?: Date | null
) {
  await requirePermission("settings:manage");

  const existing = await db
    .select({ value: platformConfigs.value, description: platformConfigs.description })
    .from(platformConfigs)
    .where(eq(platformConfigs.key, key))
    .limit(1);

  const previous = existing[0]?.value;

  const setValues = {
    value,
    updatedBy: adminId,
    updatedAt: new Date(),
    effectiveFrom: effectiveFrom ?? null,
    effectiveUntil: effectiveUntil ?? null,
  };

  if (existing.length === 0) {
    await db.insert(platformConfigs).values({
      key,
      ...setValues,
    });
  } else {
    await db
      .update(platformConfigs)
      .set({
        ...setValues,
        // Preserve any existing business description instead of overwriting
        // it with audit text; the audit log records the actual change.
        description: existing[0].description,
      })
      .where(eq(platformConfigs.key, key));
  }

  await insertAuditLog({
    action: "config_updated",
    resourceType: "platform_config",
    resourceId: key,
    metadata: { previous, value },
  });

  return { success: true };
}

export async function runListingExpirySweep() {
  const user = await requirePermission("listings:moderate");
  const { expireStaleListings } = await import("./listings.server");
  const result = await expireStaleListings();
  await insertAuditLog({
    action: "expiry_sweep_run",
    resourceType: "listings",
    metadata: { expiredCount: result.expiredCount, actorId: user.id },
  });
  return result;
}
