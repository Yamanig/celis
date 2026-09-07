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
import {
  startPhoneAuth,
  confirmPhoneAuth,
  startAddPhone,
  confirmAddPhone,
  setPasswordForCurrentSession,
} from "./phone-auth.server";
import {
  enforceRateLimit,
  clearRateLimit,
  getClientIp,
} from "./rate-limit.server";
import { db } from "~/db";
import { users, profiles } from "~/db/schema";
import { eq, or } from "drizzle-orm";
import { e164PhoneSchema, otpSchema } from "~/lib/validation";
import { CelisError } from "~/lib/errors";

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
  password: z.string().min(8).max(72),
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
    // SEC-5: cap account creation per IP.
    await enforceRateLimit(`signup:ip:${getClientIp()}`, {
      max: 5,
      windowSec: 3600,
    });

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
      throw new CelisError(error.message, "SIGNUP_FAILED", 400);
    }

    if (!authData.user?.email) {
      throw new CelisError(
        "Sign up succeeded but user was not returned.",
        "SIGNUP_FAILED",
        500
      );
    }

    await ensureLocalUserRecord(
      authData.user.id,
      authData.user.email,
      data.role
    );

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
      throw new CelisError(signInError.message, "SIGNUP_FAILED", 400);
    }

    return { success: true, userId: authData.user.id, needsPhone: true };
  });

export const signIn = createServerFn({ method: "POST" })
  .validator(credentialsSchema)
  .handler(async ({ data }) => {
    // SEC-5: per-IP and per-identifier rate limiting + failed-login backoff.
    const email = data.email.toLowerCase();
    await enforceRateLimit(`signin:ip:${getClientIp()}`, {
      max: 20,
      windowSec: 300,
    });
    await enforceRateLimit(`signin:id:${email}`, { max: 10, windowSec: 300 });
    await enforceRateLimit(`signin:fail:${email}`, { max: 5, windowSec: 900 });

    const supabase = getSupabaseServerClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: data.password,
    });

    if (error || !authData.user?.email) {
      throw new CelisError(
        error?.message ?? "Invalid email or password",
        "INVALID_CREDENTIALS",
        401
      );
    }

    await clearRateLimit(`signin:fail:${email}`);
    await ensureLocalUserRecord(authData.user.id, authData.user.email);
    return {
      success: true,
      userId: authData.user.id,
      needsPhone: !authData.user.phone,
    };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  return { success: true };
});

/* ------------------------------------------------------------------ *
 * Phone + WhatsApp OTP (SEC-1 reset, SEC-5 hardening)                 *
 * ------------------------------------------------------------------ */

const phoneOnlySchema = z.object({ phone: e164PhoneSchema });
const phoneOtpSchema = z.object({ phone: e164PhoneSchema, token: otpSchema });

/** Start phone sign-in / sign-up: send a WhatsApp code. */
export const requestPhoneOtp = createServerFn({ method: "POST" })
  .validator(phoneOnlySchema)
  .handler(async ({ data }) => {
    await enforceRateLimit(`otp:ip:${getClientIp()}`, { max: 10, windowSec: 600 });
    await enforceRateLimit(`otp:phone:${data.phone}`, { max: 5, windowSec: 600 });
    await startPhoneAuth(data.phone, true);
    return { ok: true };
  });

/** Verify the phone code and establish the session. */
export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .validator(phoneOtpSchema)
  .handler(async ({ data }) => {
    await enforceRateLimit(`otpverify:ip:${getClientIp()}`, {
      max: 15,
      windowSec: 600,
    });
    const { userId } = await confirmPhoneAuth(data.phone, data.token);
    return { success: true, userId, needsPhone: false };
  });

/** Add a phone to the signed-in account: send a confirmation code. */
export const requestAddPhoneOtp = createServerFn({ method: "POST" })
  .validator(phoneOnlySchema)
  .handler(async ({ data }) => {
    await enforceRateLimit(`otp:phone:${data.phone}`, { max: 5, windowSec: 600 });
    await startAddPhone(data.phone);
    return { ok: true };
  });

/** Verify the code from requestAddPhoneOtp. */
export const verifyAddPhoneOtp = createServerFn({ method: "POST" })
  .validator(phoneOtpSchema)
  .handler(async ({ data }) => {
    await enforceRateLimit(`otpverify:ip:${getClientIp()}`, {
      max: 15,
      windowSec: 600,
    });
    const { userId } = await confirmAddPhone(data.phone, data.token);
    return { success: true, userId };
  });

/**
 * SEC-1: password reset. The user proves control of the phone on their account
 * via WhatsApp OTP, then sets a new password. Always returns a generic result so
 * a caller cannot enumerate which numbers have accounts.
 */
export const requestPasswordResetOtp = createServerFn({ method: "POST" })
  .validator(phoneOnlySchema)
  .handler(async ({ data }) => {
    await enforceRateLimit(`reset:ip:${getClientIp()}`, {
      max: 10,
      windowSec: 600,
    });
    await enforceRateLimit(`reset:phone:${data.phone}`, {
      max: 5,
      windowSec: 600,
    });

    const digits = data.phone.replace(/\D/g, "");
    const [match] = await db
      .select({ id: users.id })
      .from(users)
      .leftJoin(profiles, eq(profiles.id, users.id))
      .where(
        or(
          eq(users.walletPhone, digits),
          eq(users.walletPhone, data.phone),
          eq(profiles.phone, digits),
          eq(profiles.phone, data.phone)
        )
      )
      .limit(1);

    if (match) {
      // shouldCreateUser:false so an unknown number cannot silently create one
      await startPhoneAuth(data.phone, false).catch(() => {});
    }
    return { ok: true };
  });

const resetPasswordSchema = z.object({
  phone: e164PhoneSchema,
  token: otpSchema,
  password: z.string().min(8).max(72),
});

/** Verify the reset OTP and set the new password in one step. */
export const resetPasswordWithOtp = createServerFn({ method: "POST" })
  .validator(resetPasswordSchema)
  .handler(async ({ data }) => {
    await enforceRateLimit(`otpverify:ip:${getClientIp()}`, {
      max: 15,
      windowSec: 600,
    });
    await confirmPhoneAuth(data.phone, data.token);
    await setPasswordForCurrentSession(data.password);
    // Don't leave the reset session signed in.
    await getSupabaseServerClient().auth.signOut();
    return { ok: true };
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
