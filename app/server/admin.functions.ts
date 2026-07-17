import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { UserRole } from "~/db/schema";
import {
  getAdminDashboardStats,
  getAdminRecentActivity,
  getAdminUsers,
  createInternalUser,
  updateUserRole,
  toggleUserVerification,
  toggleUserSuperAdmin,
  getUnverifiedSellers,
  reviewSellerVerification,
  getAdminListings,
  updateListingStatus,
  approveListing,
  rejectListing,
  extendListingExpiry,
  notifyExpiringSeller,
  getAdminCategories,
  createCategory,
  updateCategory,
  getAdminCategoryFees,
  createCategoryFee,
  updateCategoryFee,
  deleteCategoryFee,
  getAdminOrders,
  updateOrderStatus,
  getAdminPayouts,
  retryPayout,
  markPayoutCompleted,
  getAdminLedger,
  exportAdminLedger,
  getFailedPaymentsReport,
  getNewUsersReport,
  getNewListingsReport,
  exportFailedPaymentsReport,
  exportNewUsersReport,
  exportNewListingsReport,
  getPlatformConfigAll,
  updatePlatformConfig,
  runListingExpirySweep,
} from "./admin.server";
import { getAdminAuditLogs } from "./audit.server";
import {
  listListingPackages,
  assignSellerPackage,
} from "./seller-packages.server";
import { requirePermission } from "./auth.server";

const userRoleSchema = z.string();

export const fetchAdminStats = createServerFn({ method: "GET" }).handler(async () => {
  return getAdminDashboardStats();
});

export const fetchAdminRecentActivity = createServerFn({ method: "GET" }).handler(
  async () => {
    return getAdminRecentActivity();
  }
);

const usersQuerySchema = z
  .object({
    search: z.string().optional(),
    role: userRoleSchema.optional(),
    domain: z.enum(["customer", "internal"]).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  })
  .default({});

export const fetchAdminUsers = createServerFn({ method: "GET" })
  .validator(usersQuerySchema)
  .handler(async ({ data }) => {
    return getAdminUsers(data);
  });

const createInternalUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: userRoleSchema,
  department: z.string().optional(),
});

export const createAdminInternalUser = createServerFn({ method: "POST" })
  .validator(createInternalUserSchema)
  .handler(async ({ data }) => {
    return createInternalUser(data);
  });

const updateRoleSchema = z.object({
  id: z.string().uuid(),
  role: userRoleSchema,
});

export const updateAdminUserRole = createServerFn({ method: "POST" })
  .validator(updateRoleSchema)
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return updateUserRole(data.id, data.role as UserRole, user.id);
  });

const userIdSchema = z.object({ id: z.string().uuid() });

export const toggleAdminUserVerification = createServerFn({ method: "POST" })
  .validator(userIdSchema)
  .handler(async ({ data }) => {
    return toggleUserVerification(data.id);
  });

export const toggleAdminUserSuperAdmin = createServerFn({ method: "POST" })
  .validator(userIdSchema)
  .handler(async ({ data }) => {
    return toggleUserSuperAdmin(data.id);
  });

const unverifiedSellersQuerySchema = z
  .object({
    search: z.string().optional(),
    status: z.enum(["pending", "rejected", "suspended"]).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  })
  .default({});

export const fetchUnverifiedSellers = createServerFn({ method: "GET" })
  .validator(unverifiedSellersQuerySchema)
  .handler(async ({ data }) => {
    return getUnverifiedSellers(data);
  });

const reviewSellerVerificationSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "suspend"]),
  reason: z.string().optional(),
});

export const reviewAdminSellerVerification = createServerFn({ method: "POST" })
  .validator(reviewSellerVerificationSchema)
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return reviewSellerVerification(data.id, data.action, data.reason ?? "", user.id);
  });

const listingsQuerySchema = z
  .object({
    status: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    sellerId: z.string().uuid().optional(),
    expiryWindow: z.coerce.number().int().min(0).optional(),
    packageId: z.string().uuid().optional(),
    paymentStatus: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  })
  .default({});

export const fetchAdminListings = createServerFn({ method: "GET" })
  .validator(listingsQuerySchema)
  .handler(async ({ data }) => {
    return getAdminListings(data);
  });

const listingStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "active",
    "draft",
    "pending_review",
    "sold",
    "expired",
    "rejected",
    "suspended",
  ]),
});

const extendExpirySchema = z.object({
  id: z.string().uuid(),
  days: z.coerce.number().int().min(1),
  reason: z.string().min(1),
});

export const extendAdminListingExpiry = createServerFn({ method: "POST" })
  .validator(extendExpirySchema)
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return extendListingExpiry(data.id, data.days, data.reason, user.id);
  });

const notifySellerSchema = z.object({
  id: z.string().uuid(),
  channel: z.enum(["sms", "email", "push"]).default("sms"),
});

export const notifyAdminExpiringSeller = createServerFn({ method: "POST" })
  .validator(notifySellerSchema)
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return notifyExpiringSeller(data.id, data.channel, user.id);
  });

export const updateAdminListingStatus = createServerFn({ method: "POST" })
  .validator(listingStatusSchema)
  .handler(async ({ data }) => {
    return updateListingStatus(data.id, data.status);
  });

const reviewListingSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export const reviewAdminListing = createServerFn({ method: "POST" })
  .validator(reviewListingSchema)
  .handler(async ({ data }) => {
    const { requirePermission } = await import("./auth.server");
    const user = await requirePermission("listings:moderate");
    const { insertAuditLog } = await import("./audit.server");
    if (data.action === "approve") {
      await approveListing(data.id, user.id);
      await insertAuditLog({
        action: "listing_approved",
        resourceType: "listing",
        resourceId: data.id,
        metadata: { actorId: user.id },
      });
      return { success: true, id: data.id, status: "active" as const };
    }
    await rejectListing(data.id, user.id, data.reason ?? "");
    await insertAuditLog({
      action: "listing_rejected",
      resourceType: "listing",
      resourceId: data.id,
      metadata: { actorId: user.id, reason: data.reason },
    });
    return { success: true, id: data.id, status: "rejected" as const };
  });

const categoriesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  })
  .default({});

export const fetchAdminCategories = createServerFn({ method: "GET" })
  .validator(categoriesQuerySchema)
  .handler(async ({ data }) => {
    return getAdminCategories(data);
  });

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  sortOrder: z.number().int().optional(),
});

export const createAdminCategory = createServerFn({ method: "POST" })
  .validator(categorySchema)
  .handler(async ({ data }) => {
    return createCategory(data);
  });

const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateAdminCategory = createServerFn({ method: "POST" })
  .validator(updateCategorySchema)
  .handler(async ({ data }) => {
    return updateCategory(data.id, {
      name: data.name,
      slug: data.slug,
      sortOrder: data.sortOrder,
    });
  });

const categoryFeesQuerySchema = z.object({
  categoryId: z.string().uuid(),
});

export const fetchAdminCategoryFees = createServerFn({ method: "GET" })
  .validator(categoryFeesQuerySchema)
  .handler(async ({ data }) => {
    return getAdminCategoryFees(data.categoryId);
  });

const categoryFeeSchema = z.object({
  categoryId: z.string().uuid(),
  feeType: z.enum(["listing_fee", "commission"]),
  amount: z.coerce.number().int().min(0).optional().default(0),
  percentage: z.coerce.number().int().min(0).max(10000).optional().default(0),
  isActive: z.boolean().optional().default(true),
  effectiveFrom: z.string().datetime().optional(),
  effectiveUntil: z.string().datetime().optional(),
});

export const createAdminCategoryFee = createServerFn({ method: "POST" })
  .validator(categoryFeeSchema)
  .handler(async ({ data }) => {
    return createCategoryFee({
      categoryId: data.categoryId,
      feeType: data.feeType,
      amount: data.amount,
      percentage: data.percentage,
      isActive: data.isActive,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
      effectiveUntil: data.effectiveUntil ? new Date(data.effectiveUntil) : undefined,
    });
  });

const updateCategoryFeeSchema = categoryFeeSchema
  .omit({ categoryId: true })
  .partial()
  .extend({ id: z.string().uuid() });

export const updateAdminCategoryFee = createServerFn({ method: "POST" })
  .validator(updateCategoryFeeSchema)
  .handler(async ({ data }) => {
    const { id, ...input } = data;
    return updateCategoryFee(id, {
      ...input,
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
      effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : null,
    });
  });

const categoryFeeIdSchema = z.object({ id: z.string().uuid() });

export const deleteAdminCategoryFee = createServerFn({ method: "POST" })
  .validator(categoryFeeIdSchema)
  .handler(async ({ data }) => {
    return deleteCategoryFee(data.id);
  });

const ordersQuerySchema = z
  .object({
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  })
  .default({});

export const fetchAdminOrders = createServerFn({ method: "GET" })
  .validator(ordersQuerySchema)
  .handler(async ({ data }) => {
    return getAdminOrders(data);
  });

const orderStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "completed",
    "cancelled",
    "disputed",
  ]),
});

export const updateAdminOrderStatus = createServerFn({ method: "POST" })
  .validator(orderStatusSchema)
  .handler(async ({ data }) => {
    return updateOrderStatus(data.id, data.status);
  });

const createOrderSchema = z.object({
  listingId: z.string().uuid(),
  buyerEmail: z.string().email(),
  salePrice: z.coerce.number().int().min(0),
});

export const createAdminOrder = createServerFn({ method: "POST" })
  .validator(createOrderSchema)
  .handler(async ({ data }) => {
    await requirePermission("orders:manage");
    const { db } = await import("~/db");
    const { users, listings } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { createOrder } = await import("./orders.server");

    const [buyer] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.buyerEmail))
      .limit(1);
    if (!buyer) throw new Error("Buyer not found");

    const [listing] = await db
      .select({ sellerId: listings.sellerId })
      .from(listings)
      .where(eq(listings.id, data.listingId))
      .limit(1);
    if (!listing) throw new Error("Listing not found");

    return createOrder({
      listingId: data.listingId,
      buyerId: buyer.id,
      sellerId: listing.sellerId,
      salePrice: data.salePrice,
    });
  });

const payoutsQuerySchema = z
  .object({
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  })
  .default({});

export const fetchAdminPayouts = createServerFn({ method: "GET" })
  .validator(payoutsQuerySchema)
  .handler(async ({ data }) => {
    return getAdminPayouts(data);
  });

const payoutActionSchema = z.object({
  id: z.string().uuid(),
  note: z.string().optional(),
});

export const retryAdminPayout = createServerFn({ method: "POST" })
  .validator(payoutActionSchema)
  .handler(async ({ data }) => {
    return retryPayout(data.id);
  });

export const completeAdminPayout = createServerFn({ method: "POST" })
  .validator(payoutActionSchema)
  .handler(async ({ data }) => {
    return markPayoutCompleted(data.id, data.note);
  });

const ledgerQuerySchema = z
  .object({
    from: z.string().optional(),
    to: z.string().optional(),
    type: z.enum(["all", "payment", "payout", "refund"]).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  })
  .default({ type: "all" as const });

export const fetchAdminLedger = createServerFn({ method: "GET" })
  .validator(ledgerQuerySchema)
  .handler(async ({ data }) => {
    return getAdminLedger(data);
  });

export const exportAdminLedgerCsv = createServerFn({ method: "GET" })
  .validator(ledgerQuerySchema)
  .handler(async ({ data }) => {
    return exportAdminLedger(data);
  });

const failedPaymentsBaseSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  includePending: z.coerce.boolean().optional().default(false),
});

const failedPaymentsQuerySchema = failedPaymentsBaseSchema.extend({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const fetchFailedPaymentsReport = createServerFn({ method: "GET" })
  .validator(failedPaymentsQuerySchema)
  .handler(async ({ data }) => {
    return getFailedPaymentsReport(data);
  });

export const exportFailedPaymentsReportCsv = createServerFn({ method: "GET" })
  .validator(failedPaymentsBaseSchema)
  .handler(async ({ data }) => {
    return exportFailedPaymentsReport(data);
  });

const dateRangeBaseSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

const dateRangeQuerySchema = dateRangeBaseSchema.extend({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const fetchNewUsersReport = createServerFn({ method: "GET" })
  .validator(dateRangeQuerySchema)
  .handler(async ({ data }) => {
    return getNewUsersReport(data);
  });

export const exportNewUsersReportCsv = createServerFn({ method: "GET" })
  .validator(dateRangeBaseSchema)
  .handler(async ({ data }) => {
    return exportNewUsersReport(data);
  });

export const fetchNewListingsReport = createServerFn({ method: "GET" })
  .validator(dateRangeQuerySchema)
  .handler(async ({ data }) => {
    return getNewListingsReport(data);
  });

export const exportNewListingsReportCsv = createServerFn({ method: "GET" })
  .validator(dateRangeBaseSchema)
  .handler(async ({ data }) => {
    return exportNewListingsReport(data);
  });

const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const fetchAdminAuditLogs = createServerFn({ method: "GET" })
  .validator(auditLogQuerySchema)
  .handler(async ({ data }) => {
    await requirePermission("audit:read");
    return getAdminAuditLogs(data);
  });

export const fetchPlatformConfigAll = createServerFn({ method: "GET" }).handler(
  async () => {
    return getPlatformConfigAll();
  }
);

export const runAdminExpirySweep = createServerFn({ method: "POST" }).handler(
  async () => {
    return runListingExpirySweep();
  }
);

const updateConfigSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.record(z.unknown())]),
  effectiveFrom: z.string().datetime().optional(),
  effectiveUntil: z.string().datetime().optional(),
});

export const updateAdminPlatformConfig = createServerFn({ method: "POST" })
  .validator(updateConfigSchema)
  .handler(async ({ data }) => {
    // adminId will be resolved inside the server function via requireAdmin
    const { getCurrentUser } = await import("./auth.server");
    const admin = await getCurrentUser();
    if (!admin) throw new Error("Unauthorized");
    return updatePlatformConfig(
      data.key,
      data.value,
      admin.id,
      data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
      data.effectiveUntil ? new Date(data.effectiveUntil) : undefined
    );
  });

const packageSchema = z.object({
  code: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  sellerTypeEligibility: z.enum(["individual", "shop"]).optional(),
  listingAllowance: z.coerce.number().int().min(1),
  isUnlimited: z.boolean().optional(),
  featuredAllowance: z.coerce.number().int().min(0).optional(),
  durationDays: z.coerce.number().int().min(1),
  price: z.coerce.number().int().min(0),
  currency: z.string().max(3).optional(),
  autoRenew: z.boolean().optional(),
  gracePeriodDays: z.coerce.number().int().min(0).optional(),
});

export const fetchAdminListingPackages = createServerFn({ method: "GET" }).handler(
  async () => {
    await requirePermission("settings:manage");
    return listListingPackages();
  }
);

export const createAdminListingPackage = createServerFn({ method: "POST" })
  .validator(packageSchema)
  .handler(async ({ data }) => {
    await requirePermission("settings:manage");
    const { createListingPackage } = await import("./seller-packages.server");
    return createListingPackage(data);
  });

export const updateAdminListingPackage = createServerFn({ method: "POST" })
  .validator(
    packageSchema.partial().extend({
      id: z.string().uuid(),
      isActive: z.boolean().optional(),
    })
  )
  .handler(async ({ data }) => {
    await requirePermission("settings:manage");
    const { id, ...input } = data;
    const { updateListingPackage } = await import("./seller-packages.server");
    return updateListingPackage(id, input);
  });

const assignPackageSchema = z.object({
  sellerEmail: z.string().email().optional(),
  sellerNumber: z.string().min(1).max(20).optional(),
  packageId: z.string().uuid(),
  assignmentSource: z.string().max(50).optional(),
  paymentReference: z.string().max(255).optional(),
  pricePaidCents: z.coerce.number().int().min(0).optional(),
});

export const assignAdminSellerPackage = createServerFn({ method: "POST" })
  .validator(assignPackageSchema)
  .handler(async ({ data }) => {
    await requirePermission("users:manage");
    const { db } = await import("~/db");
    const { users, profiles } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { getCurrentUser } = await import("./auth.server");
    const actor = await getCurrentUser();

    let sellerId: string | undefined;
    if (data.sellerNumber) {
      const rows = await db
        .select({ userId: profiles.id })
        .from(profiles)
        .where(eq(profiles.sellerNumber, data.sellerNumber))
        .limit(1);
      sellerId = rows[0]?.userId;
    } else if (data.sellerEmail) {
      const rows = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, data.sellerEmail))
        .limit(1);
      sellerId = rows[0]?.id;
    }

    if (!sellerId) throw new Error("Seller not found");
    return assignSellerPackage(sellerId, data.packageId, {
      assignedBy: actor?.id,
      assignmentSource: data.assignmentSource,
      paymentReference: data.paymentReference,
      pricePaidCents: data.pricePaidCents,
    });
  });
