import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getSupabaseServerClient,
  getServiceSupabase,
} from "~/lib/supabase/server";
import { getCurrentUser, ensureLocalUserRecord } from "./auth.server";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const fetchCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    return getCurrentUser();
  }
);

export const signUp = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      displayName: z.string().min(2).max(60),
      role: z.enum(["buyer", "seller"]).default("buyer"),
    })
  )
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

    if (data.displayName) {
      const { db } = await import("~/db");
      const { profiles } = await import("~/db/schema");
      const { eq } = await import("drizzle-orm");
      await db
        .update(profiles)
        .set({ displayName: data.displayName })
        .where(eq(profiles.id, authData.user.id));
    }

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
