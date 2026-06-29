import { db } from "~/db";
import {
  users,
  profiles,
  listings,
  categories,
  walletPayments,
  orders,
  payouts,
  platformConfigs,
} from "~/db/schema";
import {
  eq,
  desc,
  count,
  ilike,
  or,
  and,
  sql,
  gte,
  lte,
  sum,
} from "drizzle-orm";
import { requireAdmin } from "./auth.server";
import type { UserRole } from "~/db/schema";
import {
  calculateListingPricing,
  DEFAULT_LISTING_TIERS,
} from "~/lib/pricing";
import { getListingTiersConfig } from "./config.server";

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
      isVerified: r.user.verifiedAt !== null,
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
  page?: number;
  limit?: number;
}) {
  await requireAdmin();

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;

  const conditions = [];
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
  if (options?.role) {
    conditions.push(eq(users.role, options.role));
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
      displayName: r.profile?.displayName ?? null,
      phone: r.user.walletPhone ?? r.profile?.phone ?? null,
      isVerified: r.user.verifiedAt !== null,
      isSuperAdmin: r.user.isSuperAdmin,
      createdAt: r.user.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateUserRole(id: string, role: UserRole) {
  await requireAdmin();
  await db.update(users).set({ role }).where(eq(users.id, id));
  return { success: true };
}

export async function toggleUserVerification(id: string) {
  await requireAdmin();
  const [user] = await db
    .select({ verifiedAt: users.verifiedAt })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  const next = user?.verifiedAt ? null : new Date();
  await db.update(users).set({ verifiedAt: next }).where(eq(users.id, id));
  return { success: true, verified: next !== null };
}

export async function toggleUserSuperAdmin(id: string) {
  await requireAdmin();
  const [user] = await db
    .select({ isSuperAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  const next = !user?.isSuperAdmin;
  await db.update(users).set({ isSuperAdmin: next }).where(eq(users.id, id));
  return { success: true, isSuperAdmin: next };
}

export async function getAdminListings(options?: {
  status?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();
  const config = await getListingTiersConfig();

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;

  const conditions = [];
  if (options?.status)
    conditions.push(eq(listings.status, options.status as never));
  if (options?.categoryId)
    conditions.push(eq(listings.categoryId, options.categoryId));

  const where = conditions.length ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .innerJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where);

  const rows = await db
    .select({
      listing: listings,
      categoryName: categories.name,
      sellerName: profiles.displayName,
      sellerEmail: users.email,
    })
    .from(listings)
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .innerJoin(users, eq(listings.sellerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(where)
    .orderBy(desc(listings.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows.map((r) => {
      const pricing = calculateListingPricing(
        r.listing.price,
        r.listing.condition,
        config
      );
      return {
        id: r.listing.id,
        title: r.listing.title,
        price: r.listing.price,
        status: r.listing.status,
        condition: r.listing.condition,
        categoryName: r.categoryName,
        sellerName: r.sellerName ?? r.sellerEmail,
        tierLabel: pricing.tierLabel,
        expiresAt: r.listing.expiresAt,
        createdAt: r.listing.createdAt,
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateListingStatus(
  id: string,
  status: "active" | "draft" | "sold" | "expired" | "suspended"
) {
  await requireAdmin();
  await db.update(listings).set({ status }).where(eq(listings.id, id));
  return { success: true };
}

export async function getAdminCategories(options?: {
  page?: number;
  limit?: number;
}) {
  await requireAdmin();

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
  await requireAdmin();
  const [row] = await db
    .insert(categories)
    .values({
      name: input.name,
      slug: input.slug,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
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
  await requireAdmin();
  const [row] = await db
    .update(categories)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(categories.id, id))
    .returning();
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getAdminOrders(options?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();

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
  await requireAdmin();
  const updates: Record<string, unknown> = { status };
  if (status === "completed") updates.completedAt = new Date();
  if (status === "disputed") updates.disputedAt = new Date();
  await db.update(orders).set(updates).where(eq(orders.id, id));
  return { success: true };
}

export async function getAdminPayouts(options?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();

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
  await requireAdmin();
  await db
    .update(payouts)
    .set({ status: "pending", updatedAt: new Date() })
    .where(eq(payouts.id, id));
  return { success: true };
}

export async function markPayoutCompleted(id: string, note?: string) {
  await requireAdmin();
  await db
    .update(payouts)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payouts.id, id));
  // Note is not persisted because there is no note column; logged via description if needed.
  void note;
  return { success: true };
}

type LedgerType = "all" | "payment" | "payout" | "refund";

async function getAdminLedgerRows(options?: {
  from?: string;
  to?: string;
  type?: LedgerType;
}) {
  await requireAdmin();

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

const CONFIG_DEFAULTS: Record<string, string | number | boolean | object> = {
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
  await requireAdmin();

  const rows = await db.select().from(platformConfigs);
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return Object.entries(CONFIG_DEFAULTS).map(([key, defaultValue]) => {
    const stored = map.get(key);
    const value = stored !== undefined ? stored : defaultValue;
    const row = rows.find((r) => r.key === key);
    return {
      key,
      value: value as string | number | boolean,
      defaultValue,
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null,
      description: row?.description ?? null,
    };
  });
}

export async function updatePlatformConfig(
  key: string,
  value: string | number | boolean | object,
  adminId: string
) {
  await requireAdmin();

  const existing = await db
    .select({ value: platformConfigs.value })
    .from(platformConfigs)
    .where(eq(platformConfigs.key, key))
    .limit(1);

  const previous = existing[0]?.value;
  const note = `Updated by ${adminId}; previous: ${JSON.stringify(previous)}`;

  if (existing.length === 0) {
    await db.insert(platformConfigs).values({
      key,
      value,
      description: note,
      updatedBy: adminId,
    });
  } else {
    await db
      .update(platformConfigs)
      .set({ value, description: note, updatedBy: adminId, updatedAt: new Date() })
      .where(eq(platformConfigs.key, key));
  }

  return { success: true };
}

export async function runListingExpirySweep() {
  await requireAdmin();
  const { expireStaleListings } = await import("./listings.server");
  return expireStaleListings();
}
