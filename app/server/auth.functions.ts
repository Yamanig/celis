import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getSupabaseServerClient,
  getServiceSupabase,
} from "~/lib/supabase/server";
import {
  getCurrentUser,
  getCurrentUserProfile,
  updateUserProfile,
  ensureLocalUserRecord,
  listPermissions,
  getRolePermissions,
  getUserPermissions,
  setRolePermissions,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
} from "./auth.server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const fetchCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    return getCurrentUser();
  }
);

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(60),
  role: z.enum(["buyer", "seller"]).default("buyer"),
  sellerType: z.enum(["individual", "shop"]).optional(),
  businessName: z.string().max(120).optional(),
  businessRegistrationNumber: z.string().max(60).optional(),
  businessAddress: z.string().max(500).optional(),
  shopSlug: z.string().max(120).optional(),
});

export const signUp = createServerFn({ method: "POST" })
  .validator(signUpSchema)
  .handler(async ({ data }) => {
    // Use the service-role client to create the user with a confirmed email.
    // This avoids Supabase's sign-up email rate limit and skips the
    // confirmation step in this environment.
    const serviceSupabase = getServiceSupabase();
    const { data: authData, error } = await serviceSupabase.auth.admin.createUser(
      {
        email: data.email,
        password: data.password,
        email_confirm: true,
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!authData.user?.email) {
      throw new Error("Sign up succeeded but user was not returned.");
    }

    await ensureLocalUserRecord(
      authData.user.id,
      authData.user.email,
      data.role
    );

    const { db } = await import("~/db");
    const { profiles } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    await db
      .update(profiles)
      .set({
        displayName: data.displayName,
        sellerType: data.sellerType,
        businessName: data.businessName || null,
        businessRegistrationNumber:
          data.businessRegistrationNumber || null,
        businessAddress: data.businessAddress || null,
        shopSlug: data.shopSlug || null,
      })
      .where(eq(profiles.id, authData.user.id));

    // Sign in with the anon client so the session cookies are set for the user.
    const supabase = getSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (signInError) {
      throw new Error(signInError.message);
    }

    return { success: true, userId: authData.user.id };
  });

export const signIn = createServerFn({ method: "POST" })
  .validator(credentialsSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error || !authData.user?.email) {
      throw new Error(error?.message ?? "Invalid email or password");
    }

    await ensureLocalUserRecord(authData.user.id, authData.user.email);
    return { success: true, userId: authData.user.id };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  return { success: true };
});

export const fetchCurrentUserProfile = createServerFn({ method: "GET" }).handler(
  async () => {
    return getCurrentUserProfile();
  }
);

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(60),
  phone: z.string().max(15).optional(),
  bio: z.string().max(500).optional(),
  sellerType: z.enum(["individual", "shop"]).optional(),
  businessName: z.string().max(120).optional(),
  businessRegistrationNumber: z.string().max(60).optional(),
  businessAddress: z.string().max(500).optional(),
  businessLogoUrl: z.string().url().optional(),
  shopSlug: z.string().max(120).optional(),
});

export const updateCurrentUserProfile = createServerFn({ method: "POST" })
  .validator(updateProfileSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return updateUserProfile(user.id, data);
  });

export const fetchCurrentUserPermissions = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await getCurrentUser();
    if (!user) return [];
    return getUserPermissions(user);
  }
);

export const fetchAllPermissions = createServerFn({ method: "GET" }).handler(
  async () => listPermissions()
);

const rolePermissionsQuerySchema = z.object({
  role: z.string(),
});

export const fetchRolePermissions = createServerFn({ method: "GET" })
  .validator(rolePermissionsQuerySchema)
  .handler(async ({ data }) => getRolePermissions(data.role));

const updateRolePermissionsSchema = z.object({
  role: z.string(),
  permissionKeys: z.array(z.string()),
});

export const updateRolePermissions = createServerFn({ method: "POST" })
  .validator(updateRolePermissionsSchema)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return setRolePermissions(data.role, data.permissionKeys, user);
  });

export const fetchRoles = createServerFn({ method: "GET" }).handler(async () => {
  return listRoles();
});

const createRoleSchema = z.object({
  key: z.string().min(2).max(60),
  label: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  domain: z.enum(["customer", "internal"]).default("internal"),
});

export const createRoleFn = createServerFn({ method: "POST" })
  .validator(createRoleSchema)
  .handler(async ({ data }) => createRole(data));

const updateRoleSchema = z.object({
  key: z.string(),
  label: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  domain: z.enum(["customer", "internal"]).default("internal"),
});

export const updateRoleFn = createServerFn({ method: "POST" })
  .validator(updateRoleSchema)
  .handler(async ({ data }) => updateRole(data.key, data));

const deleteRoleSchema = z.object({ key: z.string() });

export const deleteRoleFn = createServerFn({ method: "POST" })
  .validator(deleteRoleSchema)
  .handler(async ({ data }) => deleteRole(data.key));
