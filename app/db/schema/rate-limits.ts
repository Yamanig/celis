import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Fixed-window counter for auth abuse control (SEC-5). One row per limiter key
 * (e.g. `signin:ip:1.2.3.4`, `otp:phone:+2526...`). `enforceRateLimit` in
 * `app/server/rate-limit.server.ts` upserts this row and rejects once `count`
 * exceeds the limit inside the current window.
 */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
