import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { users, passwordResets } from "~/db/schema";
import { getServiceSupabase } from "~/lib/supabase/server";
import { CelisError } from "~/lib/errors";

const requestResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export const requestPasswordReset = createServerFn({ method: "POST" })
  .validator(requestResetSchema)
  .handler(async ({ data }) => {
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, data.email.toLowerCase()))
      .limit(1);

    if (!user) {
      throw new CelisError("Email not found", "NOT_FOUND", 404);
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResets).values({
      email: user.email,
      token,
      expiresAt,
    });

    return { token, email: user.email };
  });

export const resetPasswordByToken = createServerFn({ method: "POST" })
  .validator(resetPasswordSchema)
  .handler(async ({ data }) => {
    const [reset] = await db
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.token, data.token))
      .limit(1);

    if (!reset) {
      throw new CelisError("Invalid reset link", "INVALID_TOKEN", 400);
    }

    if (reset.usedAt) {
      throw new CelisError("Reset link already used", "INVALID_TOKEN", 400);
    }

    if (new Date() > reset.expiresAt) {
      throw new CelisError("Reset link expired", "INVALID_TOKEN", 400);
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, reset.email.toLowerCase()))
      .limit(1);

    if (!user) {
      throw new CelisError("User not found", "NOT_FOUND", 404);
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: data.password,
    });

    if (error) {
      throw new CelisError(error.message, "RESET_ERROR", 500);
    }

    await db
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(eq(passwordResets.id, reset.id));

    return { ok: true };
  });
