/**
 * Processes pending notification_jobs by sending FCM push notifications.
 *
 * This is a worker script. Run it as a cron job (e.g., every 10 seconds) or
 * as a long-running process. It polls the `notification_jobs` table for pending
 * entries, sends FCM pushes via Firebase Admin SDK, and marks jobs as sent or failed.
 *
 * Usage:
 *   $env:FIREBASE_SERVICE_ACCOUNT = '{"type":"service_account",...}'
 *   $env:SUPABASE_URL = "..."
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "..."
 *   npx tsx scripts/process-notification-jobs.ts
 *
 * For long-running mode:
 *   npx tsx scripts/process-notification-jobs.ts --watch
 */

import { createClient } from "@supabase/supabase-js";
import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// ── Config ──────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

const POLL_INTERVAL_MS = 10_000; // poll every 10 seconds
const BATCH_SIZE = 20;           // process up to this many jobs per batch

// ── Init ────────────────────────────────────────────────────────

function initFirebase() {
  if (getApps().length) return getApps()[0];
  if (!FIREBASE_SERVICE_ACCOUNT) {
    console.error("[notification-worker] FIREBASE_SERVICE_ACCOUNT not set. Exiting.");
    process.exit(1);
  }
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT) as ServiceAccount;
  } catch {
    const fs = require("node:fs") as typeof import("node:fs");
    if (!fs.existsSync(FIREBASE_SERVICE_ACCOUNT)) {
      console.error(`[notification-worker] Service account file not found: ${FIREBASE_SERVICE_ACCOUNT}`);
      process.exit(1);
    }
    sa = JSON.parse(fs.readFileSync(FIREBASE_SERVICE_ACCOUNT, "utf-8")) as ServiceAccount;
  }
  return initializeApp({ credential: cert(sa) });
}

const fcmApp = initFirebase();
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Types ───────────────────────────────────────────────────────

type NotificationJob = {
  id: string;
  user_id: string;
  payload: {
    type: string;
    conversation_id?: string;
    listing_id?: string;
    title: string;
    body: string;
    [key: string]: unknown;
  };
  status: string;
  created_at: string;
};

// ── Process a single job ────────────────────────────────────────

async function processJob(job: NotificationJob): Promise<"sent" | "failed"> {
  // Read FCM token at send time (may have been registered after job creation)
  const { data: profile } = await supabase
    .from("profiles")
    .select("fcm_token")
    .eq("id", job.user_id)
    .maybeSingle();

  if (!profile?.fcm_token) {
    // No token — mark as sent (nothing to do). If they register later, future jobs will deliver.
    return "sent";
  }

  try {
    const dataPayload: Record<string, string> = { type: job.payload.type };
    if (job.payload.conversation_id) dataPayload.conversation_id = job.payload.conversation_id;
    if (job.payload.listing_id) dataPayload.listing_id = job.payload.listing_id;

    await getMessaging(fcmApp).send({
      token: profile.fcm_token,
      notification: {
        title: job.payload.title,
        body: job.payload.body,
      },
      data: dataPayload,
      android: {
        priority: "high",
        notification: {
          channelId: "celis-default",
          sound: "default",
        },
      },
    });
    return "sent";
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? (error as { code: string }).code
      : null;
    const isInvalidToken = code === "messaging/invalid-registration-token"
      || code === "messaging/registration-token-not-registered";

    if (isInvalidToken) {
      await supabase
        .from("profiles")
        .update({ fcm_token: null })
        .eq("fcm_token", profile.fcm_token);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    await supabase
      .from("notification_jobs")
      .update({ status: "failed", error_message: errorMessage.slice(0, 500), processed_at: new Date().toISOString() })
      .eq("id", job.id);

    return "failed";
  }
}

// ── Poll and process batch ──────────────────────────────────────

async function processBatch(): Promise<number> {
  // Fetch pending jobs
  const { data: jobs, error } = await supabase
    .from("notification_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error || !jobs?.length) return 0;

  // Mark as processing
  const ids = jobs.map((j: NotificationJob) => j.id);
  await supabase
    .from("notification_jobs")
    .update({ status: "processing" })
    .in("id", ids);

  let processed = 0;
  for (const job of jobs as NotificationJob[]) {
    const result = await processJob(job);
    if (result === "sent" || result === "failed") {
      // Already updated to "failed" in processJob on error. Update to "sent" on success.
      await supabase
        .from("notification_jobs")
        .update({ status: result, processed_at: new Date().toISOString() })
        .eq("id", job.id);
      processed++;
    }
  }

  return processed;
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const watchMode = process.argv.includes("--watch");

  console.log("[notification-worker] Starting...");
  if (watchMode) {
    console.log("[notification-worker] Watch mode. Polling every", POLL_INTERVAL_MS / 1000, "s.");
  }

  do {
    try {
      const count = await processBatch();
      if (count > 0) {
        console.log(`[notification-worker] Processed ${count} job(s).`);
      }
    } catch (err) {
      console.error("[notification-worker] Batch error:", err);
    }

    if (watchMode) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  } while (watchMode);

  console.log("[notification-worker] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[notification-worker] Fatal:", err);
  process.exit(1);
});
