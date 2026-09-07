import { sql } from "drizzle-orm";
import { db } from "~/db";
import { CelisError } from "~/lib/errors";
import { getRequestHeader } from "@tanstack/react-start/server";

export interface RateLimitRule {
  /** Max attempts allowed inside the window. */
  max: number;
  /** Window length in seconds. */
  windowSec: number;
}

/**
 * Fixed-window rate limiter backed by the `rate_limits` table (SEC-5). One
 * atomic upsert per call: the window resets when it has aged past `windowSec`,
 * otherwise the counter increments. Throws `CelisError(429)` once `max` is
 * exceeded.
 *
 * Postgres-backed so it survives restarts / redeploys and stays correct across
 * multiple server instances.
 */
/** Pull the underlying error text out of a possibly drizzle-wrapped DB error. */
function dbErrorInfo(err: unknown): { message: string; code: string } {
  const parts: string[] = [];
  let code = "";
  let cur: unknown = err;
  for (let i = 0; i < 4 && cur; i++) {
    if (cur instanceof Error) parts.push(cur.message);
    const c = (cur as { code?: unknown }).code;
    if (typeof c === "string" && !code) code = c;
    cur = (cur as { cause?: unknown }).cause;
  }
  return { message: parts.join(" | "), code };
}

let tableMissingWarned = false;

export async function enforceRateLimit(
  key: string,
  { max, windowSec }: RateLimitRule
): Promise<void> {
  let result: unknown;
  try {
    result = await db.execute(sql`
      INSERT INTO rate_limits (key, count, window_started_at)
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_started_at < now() - (${windowSec} * interval '1 second')
          THEN 1
          ELSE rate_limits.count + 1
        END,
        window_started_at = CASE
          WHEN rate_limits.window_started_at < now() - (${windowSec} * interval '1 second')
          THEN now()
          ELSE rate_limits.window_started_at
        END
      RETURNING count
    `);
  } catch (err) {
    // Fail open if the table is not there yet (migration 0035 not applied), so a
    // deploy that lands the code before the migration doesn't lock everyone out.
    const { message, code } = dbErrorInfo(err);
    if (code === "42P01" || /relation "?rate_limits"? does not exist/i.test(message)) {
      if (!tableMissingWarned) {
        tableMissingWarned = true;
        console.error(
          "[rate-limit] rate_limits table is missing — apply drizzle/0035_auth_rate_limits.sql. Rate limiting is DISABLED until then."
        );
      }
      return;
    }
    console.error("[rate-limit] unexpected error, failing open:", message || err);
    return;
  }

  const row = (result as { count: number }[])[0];
  if (row && Number(row.count) > max) {
    throw new CelisError(
      "Too many attempts. Please wait a minute and try again.",
      "RATE_LIMITED",
      429
    );
  }
}

/** Clear a limiter key (e.g. after a successful sign-in). Best-effort. */
export async function clearRateLimit(key: string): Promise<void> {
  try {
    await db.execute(sql`DELETE FROM rate_limits WHERE key = ${key}`);
  } catch {
    // non-fatal
  }
}

/** Best-effort client IP from the proxy headers; falls back to "unknown". */
export function getClientIp(): string {
  try {
    const forwardedFor = getRequestHeader("x-forwarded-for");
    return (
      forwardedFor?.split(",")[0]?.trim() ||
      getRequestHeader("x-real-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}
