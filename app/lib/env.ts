import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  DATABASE_POOL_SIZE: z.coerce.number().int().positive().optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().default("listing-images"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Fail fast at boot rather than at the first payment-gateway write (SEC-12).
  PAYMENT_CREDENTIALS_ENCRYPTION_KEY: z.string().min(32),
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
});

export const env = envSchema.parse(process.env);

// A production deploy must not run with NODE_ENV=development — it enables query
// logging and dev tools (SEC-12 / PROD-5).
if (
  env.NODE_ENV !== "production" &&
  !/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(env.APP_URL)
) {
  console.error(
    `[env] NODE_ENV is "${env.NODE_ENV}" but APP_URL is "${env.APP_URL}" — ` +
      "set NODE_ENV=production for non-local deployments."
  );
}
