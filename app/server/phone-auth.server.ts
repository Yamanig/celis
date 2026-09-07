import { eq } from "drizzle-orm";
import { db } from "~/db";
import { users, profiles } from "~/db/schema";
import { getSupabaseServerClient } from "~/lib/supabase/server";
import { CelisError } from "~/lib/errors";
import { phoneToSyntheticEmail } from "~/lib/phone";
import { ensureLocalUserRecord } from "./auth.server";

/**
 * Persist a verified phone onto the app-level user record. Web signups collect
 * no phone otherwise, and the mobile `handle_new_user` trigger (which would do
 * this) is not applied here. `walletPhone` (varchar 15) holds digits only.
 */
async function persistVerifiedPhone(userId: string, e164: string) {
  const digits = e164.replace(/\D/g, "").slice(0, 15);
  await db
    .update(users)
    .set({ walletPhone: digits, updatedAt: new Date() })
    .where(eq(users.id, userId));
  await db
    .update(profiles)
    .set({ phone: digits, updatedAt: new Date() })
    .where(eq(profiles.id, userId));
}

/**
 * Web phone + WhatsApp OTP auth. Delivery is handled by the Supabase "Send SMS"
 * auth hook the mobile team already deployed (`whatsapp-otp` edge function →
 * self-hosted WAHA). Supabase owns OTP generation, storage, rate limiting, and
 * verification — this module only starts the flow and turns a verified code into
 * a web session (cookies, via the SSR client).
 *
 * Mirrors `celis mobile/lib/auth.ts`.
 */

/**
 * The Supabase "Send SMS" hook has a hard 5s deadline. Our WAHA box usually
 * delivers the WhatsApp message but responds slower than that, so signInWithOtp
 * / updateUser come back with a hook error even though Supabase already
 * generated + stored the OTP and the code reaches the handset.
 *
 * Anything that isn't a clearly terminal error (rate limit, number already
 * taken, bad OTP) is treated as "delivery uncertain": we let the user go on to
 * the verify screen instead of dead-ending them. A genuine non-delivery just
 * fails at verify and they resend.
 */
function isTerminalAuthError(message: string): CelisError | null {
  const m = message.toLowerCase();
  if (m.includes("otp") && (m.includes("expired") || m.includes("invalid"))) {
    return new CelisError(
      "That code is wrong or has expired — request a new one.",
      "OTP_INVALID",
      400
    );
  }
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("over_")) {
    return new CelisError(
      "Too many attempts. Wait a minute and try again.",
      "RATE_LIMITED",
      429
    );
  }
  if (m.includes("phone") && (m.includes("exists") || m.includes("already registered") || m.includes("taken"))) {
    return new CelisError(
      "This number already has a Celis account.",
      "PHONE_EXISTS",
      409
    );
  }
  if (m.includes("invalid phone") || m.includes("phone_number_invalid")) {
    return new CelisError("Enter a valid phone number.", "INVALID_PHONE", 400);
  }
  return null;
}

/** Error for a failed verifyOtp — a real message for known cases, generic otherwise. */
function verifyError(message: string): CelisError {
  return (
    isTerminalAuthError(message) ??
    new CelisError(
      "That code is wrong or has expired — request a new one.",
      "OTP_INVALID",
      400
    )
  );
}

/**
 * Send a login/signup code to `phone` (strict E.164). One call for both new and
 * existing numbers when `createUser` is true. Returns `deliveryUnconfirmed` when
 * the Supabase hook timed out (the code was still generated and usually still
 * delivered).
 */
export async function startPhoneAuth(
  phone: string,
  createUser: boolean
): Promise<{ deliveryUnconfirmed: boolean }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: createUser },
  });
  if (error) {
    const terminal = isTerminalAuthError(error.message);
    if (terminal) throw terminal;
    console.warn(
      "[phone-auth] signInWithOtp non-terminal error, proceeding to verify:",
      error.status,
      error.code,
      error.message
    );
    return { deliveryUnconfirmed: true };
  }
  return { deliveryUnconfirmed: false };
}

/** Verify the code from `startPhoneAuth` and establish the web session. */
export async function confirmPhoneAuth(phone: string, token: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error || !data.user) {
    throw verifyError(error?.message ?? "");
  }

  await ensureLocalUserRecord(
    data.user.id,
    data.user.email ?? phoneToSyntheticEmail(phone)
  );
  await persistVerifiedPhone(data.user.id, phone);
  return { userId: data.user.id };
}

/** Attach a phone to the signed-in account and send a confirmation code. */
export async function startAddPhone(
  phone: string
): Promise<{ deliveryUnconfirmed: boolean }> {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new CelisError("Sign in first.", "UNAUTHORIZED", 401);
  }
  const { error } = await supabase.auth.updateUser({ phone });
  if (error) {
    const terminal = isTerminalAuthError(error.message);
    if (terminal) throw terminal;
    console.warn(
      "[phone-auth] updateUser(phone) non-terminal error, proceeding to verify:",
      error.status,
      error.code,
      error.message
    );
    return { deliveryUnconfirmed: true };
  }
  return { deliveryUnconfirmed: false };
}

/** Verify the code from `startAddPhone`. */
export async function confirmAddPhone(phone: string, token: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "phone_change",
  });
  if (error || !data.user) {
    throw verifyError(error?.message ?? "");
  }
  await persistVerifiedPhone(data.user.id, phone);
  return { userId: data.user.id };
}

/**
 * Set a new password for the currently-signed-in session (used by the
 * phone-OTP password reset, once the code has been verified).
 */
export async function setPasswordForCurrentSession(password: string) {
  const supabase = getSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new CelisError(
      "Verify your phone number before setting a new password.",
      "UNAUTHORIZED",
      401
    );
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[phone-auth] updateUser(password) failed:", error.status, error.code, error.message);
    throw (
      isTerminalAuthError(error.message) ??
      new CelisError(
        "Couldn't update the password. Try a different one.",
        "PASSWORD_UPDATE_FAILED",
        400
      )
    );
  }
  return { ok: true };
}
