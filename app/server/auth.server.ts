import { db } from "~/db";
import { users, profiles, authUsers, permissions, rolePermissions, roles } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getSupabaseServerClient } from "~/lib/supabase/server";
import {
  generateUniqueSellerNumber,
  ensureProfileSellerNumber,
} from "./seller-packages.server";
import type { UserRole } from "~/db/schema";

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  sellerNumber: string | null;
  phone: string | null;
  isVerified: boolean;
  verificationStatus: import("~/db/schema").VerificationStatus;
  isSuperAdmin: boolean;
  isInternal: boolean;
  department: string | null;
  mfaEnabled: boolean;
  lastLoginAt: Date | null;
}

export async function getAuthUser() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;

  const rows = await db
    .select({
      user: users,
      profile: profiles,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(eq(users.id, authUser.id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    // Auth exists but local record missing — create it on the fly.
    return ensureLocalUserRecord(authUser.id, authUser.email);
  }

  return {
    id: row.user.id,
    email: row.user.email,
    role: row.user.role,
    displayName: row.profile?.displayName ?? null,
    sellerNumber: row.profile?.sellerNumber ?? null,
    phone: row.user.walletPhone ?? row.profile?.phone ?? null,
    isVerified:
      row.user.verificationStatus === "approved" || row.user.verifiedAt !== null,
    verificationStatus: row.user.verificationStatus,
    isSuperAdmin: row.user.isSuperAdmin,
    isInternal: row.user.isInternal || row.user.role === "admin",
    department: row.user.department ?? null,
    mfaEnabled: row.user.mfaEnabled,
    lastLoginAt: row.user.lastLoginAt,
  };
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const rows = await db
    .select({
      user: users,
      profile: profiles,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(eq(users.id, user.id))
    .limit(1);

  const row = rows[0];
  if (!row) throw new Error("User record not found");

  return {
    id: row.user.id,
    email: row.user.email,
    role: row.user.role,
    displayName: row.profile?.displayName ?? null,
    sellerNumber: row.profile?.sellerNumber ?? null,
    phone: row.user.walletPhone ?? row.profile?.phone ?? null,
    bio: row.profile?.bio ?? null,
    sellerType: row.profile?.sellerType ?? "individual",
    businessName: row.profile?.businessName ?? null,
    businessRegistrationNumber:
      row.profile?.businessRegistrationNumber ?? null,
    businessAddress: row.profile?.businessAddress ?? null,
    businessLogoUrl: row.profile?.businessLogoUrl ?? null,
    shopSlug: row.profile?.shopSlug ?? null,
    isVerified:
      row.user.verificationStatus === "approved" || row.user.verifiedAt !== null,
    verificationStatus: row.user.verificationStatus,
    isSuperAdmin: row.user.isSuperAdmin,
    isInternal: row.user.isInternal || row.user.role === "admin",
    department: row.user.department ?? null,
    mfaEnabled: row.user.mfaEnabled,
    lastLoginAt: row.user.lastLoginAt,
  };
}

export async function updateUserProfile(
  id: string,
  input: {
    displayName: string;
    phone?: string;
    bio?: string;
    sellerType?: "individual" | "shop";
    businessName?: string;
    businessRegistrationNumber?: string;
    businessAddress?: string;
    businessLogoUrl?: string;
    shopSlug?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user || user.id !== id) throw new Error("Unauthorized");

  await db
    .update(users)
    .set({ walletPhone: input.phone || null, updatedAt: new Date() })
    .where(eq(users.id, id));

  await db
    .update(profiles)
    .set({
      displayName: input.displayName,
      phone: input.phone || null,
      bio: input.bio || null,
      sellerType: input.sellerType,
      businessName: input.businessName || null,
      businessRegistrationNumber:
        input.businessRegistrationNumber || null,
      businessAddress: input.businessAddress || null,
      businessLogoUrl: input.businessLogoUrl || null,
      shopSlug: input.shopSlug || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, id));

  return getCurrentUserProfile();
}

export async function listPermissions() {
  return db.select().from(permissions).orderBy(permissions.key);
}

export async function getRolePermissions(role: string) {
  const rows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.role, role));
  return rows.map((r) => r.key);
}

export async function getUserPermissions(user: CurrentUser): Promise<string[]> {
  if (user.isSuperAdmin) {
    const all = await listPermissions();
    return all.map((p) => p.key);
  }
  return getRolePermissions(user.role);
}

export async function hasPermission(
  user: CurrentUser,
  permissionKey: string
): Promise<boolean> {
  const perms = await getUserPermissions(user);
  return perms.includes(permissionKey);
}

export async function requirePermission(
  permissionKey: string
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  if (await hasPermission(user, permissionKey)) return user;
  throw new Error("Forbidden");
}

export async function requireAdmin(): Promise<CurrentUser> {
  return requirePermission("admin:access");
}

export interface RoleRecord {
  id: string;
  key: string;
  label: string;
  description: string | null;
  domain: "customer" | "internal";
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function slugifyRoleKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function listRoles(): Promise<RoleRecord[]> {
  return db.select().from(roles).orderBy(roles.domain, roles.label);
}

export async function getRoleByKey(key: string): Promise<RoleRecord | null> {
  const [row] = await db.select().from(roles).where(eq(roles.key, key)).limit(1);
  return row ?? null;
}

export async function createRole(input: {
  key: string;
  label: string;
  description?: string;
  domain: "customer" | "internal";
}) {
  await requirePermission("settings:manage");

  const key = slugifyRoleKey(input.key);
  if (!key) throw new Error("Role key is required");
  const existing = await getRoleByKey(key);
  if (existing) throw new Error("Role key already exists");

  const [created] = await db
    .insert(roles)
    .values({
      key,
      label: input.label.trim(),
      description: input.description?.trim() || null,
      domain: input.domain,
    })
    .returning();
  return created;
}

export async function updateRole(
  key: string,
  input: { label: string; description?: string; domain: "customer" | "internal" }
) {
  await requirePermission("settings:manage");

  const [updated] = await db
    .update(roles)
    .set({
      label: input.label.trim(),
      description: input.description?.trim() || null,
      domain: input.domain,
      updatedAt: new Date(),
    })
    .where(eq(roles.key, key))
    .returning();
  if (!updated) throw new Error("Role not found");
  return updated;
}

export async function deleteRole(key: string) {
  await requirePermission("settings:manage");

  const role = await getRoleByKey(key);
  if (!role) throw new Error("Role not found");
  if (role.isSystem) throw new Error("System roles cannot be deleted");

  const [userUsingRole] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, key))
    .limit(1);
  if (userUsingRole) throw new Error("Role is assigned to one or more users");

  await db.delete(rolePermissions).where(eq(rolePermissions.role, key));
  await db.delete(roles).where(eq(roles.key, key));
  return { success: true };
}

/**
 * Returns true for roles that are part of the internal staff domain.
 * External customers are buyer and seller.
 */
export async function isInternalRole(role: UserRole): Promise<boolean> {
  const row = await getRoleByKey(role);
  return row?.domain === "internal";
}

/**
 * Maker-checker control: an officer should not approve/reject a record
 * they created or last materially modified.
 */
export function canReviewRecord(
  officerId: string,
  recordCreatedById?: string | null,
  recordUpdatedById?: string | null
): boolean {
  if (!recordCreatedById && !recordUpdatedById) return true;
  return (
    recordCreatedById !== officerId && recordUpdatedById !== officerId
  );
}

export async function setRolePermissions(
  role: string,
  permissionKeys: string[],
  actor: CurrentUser
) {
  if (!actor.isSuperAdmin) {
    throw new Error("Only super admins can manage role permissions");
  }

  const allPerms = await listPermissions();
  const validKeys = new Set(allPerms.map((p) => p.key));
  const keys = permissionKeys.filter((k) => validKeys.has(k));

  await db.transaction(async (tx) => {
    await tx.delete(rolePermissions).where(eq(rolePermissions.role, role));
    if (keys.length > 0) {
      const permIds = allPerms
        .filter((p) => keys.includes(p.key))
        .map((p) => ({ role, permissionId: p.id }));
      await tx.insert(rolePermissions).values(permIds);
    }
  });

  return getRolePermissions(role);
}

export async function ensureLocalUserRecord(
  id: string,
  email: string,
  role: UserRole = "buyer"
): Promise<CurrentUser> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const isInternal = await isInternalRole(role);

  if (existing.length === 0) {
    // Ensure the auth mirror row exists so the users FK is satisfied.
    const existingMirror = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(eq(authUsers.id, id))
      .limit(1);
    if (existingMirror.length === 0) {
      await db.insert(authUsers).values({ id, email });
    }

    await db.insert(users).values({ id, email, role, isInternal });
    await db.insert(profiles).values({
      id,
      displayName: email.split("@")[0],
      sellerNumber: await generateUniqueSellerNumber(),
    });
  } else {
    await ensureProfileSellerNumber(id);
  }

  const profileRow = await db
    .select({ displayName: profiles.displayName, sellerNumber: profiles.sellerNumber })
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);

  return {
    id,
    email,
    role,
    displayName: profileRow[0]?.displayName ?? email.split("@")[0],
    sellerNumber: profileRow[0]?.sellerNumber ?? null,
    phone: null,
    isVerified: false,
    verificationStatus: "pending" as import("~/db/schema").VerificationStatus,
    isSuperAdmin: false,
    isInternal,
    department: null,
    mfaEnabled: false,
    lastLoginAt: null,
  };
}
