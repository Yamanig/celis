import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { UserRole } from "~/db/schema";
import {
  getAdminDashboardStats,
  getAdminRecentActivity,
  getAdminUsers,
  updateUserRole,
  toggleUserVerification,
  toggleUserSuperAdmin,
  getAdminListings,
  updateListingStatus,
  getAdminCategories,
  createCategory,
  updateCategory,
  getAdminOrders,
  updateOrderStatus,
  getAdminPayouts,
  retryPayout,
  markPayoutCompleted,
  getAdminLedger,
  exportAdminLedger,
  getPlatformConfigAll,
  updatePlatformConfig,
  runListingExpirySweep,
} from "./admin.server";

const userRoleSchema = z.enum(["buyer", "seller", "admin"]);

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
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  })
  .default({});

export const fetchAdminUsers = createServerFn({ method: "GET" })
  .validator(usersQuerySchema)
  .handler(async ({ data }) => {
    return getAdminUsers(data);
  });

const updateRoleSchema = z.object({
  id: z.string().uuid(),
  role: userRoleSchema,
});

export const updateAdminUserRole = createServerFn({ method: "POST" })
  .validator(updateRoleSchema)
  .handler(async ({ data }) => {
    return updateUserRole(data.id, data.role as UserRole);
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

const listingsQuerySchema = z
  .object({
    status: z.string().optional(),
    categoryId: z.string().uuid().optional(),
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
  status: z.enum(["active", "draft", "sold", "expired", "suspended"]),
});

export const updateAdminListingStatus = createServerFn({ method: "POST" })
  .validator(listingStatusSchema)
  .handler(async ({ data }) => {
    return updateListingStatus(data.id, data.status);
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
});

export const updateAdminPlatformConfig = createServerFn({ method: "POST" })
  .validator(updateConfigSchema)
  .handler(async ({ data }) => {
    // adminId will be resolved inside the server function via requireAdmin
    const { getCurrentUser } = await import("./auth.server");
    const admin = await getCurrentUser();
    if (!admin) throw new Error("Unauthorized");
    return updatePlatformConfig(data.key, data.value, admin.id);
  });
