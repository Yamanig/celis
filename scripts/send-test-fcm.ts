import { createClient } from "@supabase/supabase-js";
import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

function initFirebase() {
  if (getApps().length) return getApps()[0];
  if (!FIREBASE_SERVICE_ACCOUNT) {
    console.error("FIREBASE_SERVICE_ACCOUNT is not set.");
    console.error("Set it to the Firebase service account JSON string or file path.");
    process.exit(1);
  }
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
  } catch {
    const fs = require("node:fs") as typeof import("node:fs");
    if (!fs.existsSync(FIREBASE_SERVICE_ACCOUNT)) {
      console.error(`Service account file not found: ${FIREBASE_SERVICE_ACCOUNT}`);
      process.exit(1);
    }
    sa = JSON.parse(fs.readFileSync(FIREBASE_SERVICE_ACCOUNT, "utf-8")) as ServiceAccount;
  }
  return initializeApp({ credential: cert(sa) });
}

async function main() {
  const userId = process.argv[2];
  const title = process.argv[3] ?? "Celis Test Push";
  const body = process.argv[4] ?? "This is a test push notification from Celis.";

  if (!userId) {
    console.error("Usage: npx tsx scripts/send-test-fcm.ts <user-id> [title] [body]");
    console.error("");
    console.error("Required env vars:");
    console.error("  SUPABASE_URL");
    console.error("  SUPABASE_SERVICE_ROLE_KEY");
    console.error("  FIREBASE_SERVICE_ACCOUNT — JSON string or path to service account JSON file");
    process.exit(1);
  }

  const fcmApp = initFirebase();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("fcm_token")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile?.fcm_token) {
    console.error("No FCM token found for user:", userId);
    process.exit(1);
  }

  console.log("FCM token found:", profile.fcm_token.slice(0, 12) + "...");

  try {
    await getMessaging(fcmApp).send({
      token: profile.fcm_token,
      notification: { title, body },
      data: { type: "test" },
      android: {
        priority: "high",
        notification: { channelId: "celis-default", sound: "default" },
      },
    });
    console.log("Push notification sent successfully.");
  } catch (err: unknown) {
    console.error("Push notification failed:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main().catch(console.error);
