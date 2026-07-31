import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getServiceSupabase } from "~/lib/supabase/server";

type ProfileWithToken = { fcm_token: string | null } | null;

function getFirebaseServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    const path = raw;
    const fs = require("node:fs") as typeof import("node:fs");
    if (!fs.existsSync(path)) return null;
    return JSON.parse(fs.readFileSync(path, "utf-8")) as ServiceAccount;
  }
}

function getFcmApp() {
  const existing = getApps();
  if (existing.length) return existing[0];
  const sa = getFirebaseServiceAccount();
  if (!sa) return null;
  return initializeApp({ credential: cert(sa) });
}

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
};

/**
 * Send a push notification to a specific user by their profile ID.
 * Reads fcm_token from profiles, sends via FCM V1, clears invalid tokens.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<boolean> {
  const app = getFcmApp();
  if (!app) {
    console.warn("[fcm] Firebase not configured, skipping push to user", userId);
    return false;
  }

  const supabase = getServiceSupabase();
  const { data: profile } = (await supabase
    .from("profiles")
    .select("fcm_token")
    .eq("id", userId)
    .maybeSingle()) as { data: ProfileWithToken; error: unknown };

  if (!profile?.fcm_token) return false;

  return sendPushToToken(profile.fcm_token, payload);
}

/**
 * Send a push notification to a single FCM token.
 * Returns false and clears the token if it's invalid/expired.
 */
export async function sendPushToToken(fcmToken: string, payload: PushPayload): Promise<boolean> {
  const app = getFcmApp();
  if (!app) {
    console.warn("[fcm] Firebase not configured, skipping push to token");
    return false;
  }

  try {
    await getMessaging(app).send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data ?? {},
      android: {
        priority: "high",
        notification: {
          channelId: payload.channelId ?? "celis-default",
          sound: "default",
        },
      },
    });
    return true;
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? (error as { code: string }).code
      : null;
    const isInvalidToken = code === "messaging/invalid-registration-token"
      || code === "messaging/registration-token-not-registered";

    if (isInvalidToken) {
      const supabase = getServiceSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .update({ fcm_token: null })
        .eq("fcm_token", fcmToken);
    }

    return false;
  }
}

/**
 * Returns true when Firebase FCM is configured and available.
 */
export function isFcmConfigured(): boolean {
  return getFcmApp() !== null;
}
