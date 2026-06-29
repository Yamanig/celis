import { db } from "~/db";
import { users, profiles, authUsers } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getSupabaseServerClient } from "~/lib/supabase/server";
import type { UserRole } from "~/db/schema";

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
  phone: string | null;
  isVerified: boolean;
}

export async function getAuthUser() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const authUser = await getAuthUser();
  if (!authUser?.email) return null;

  const rows = await db
    .select({
      user: users,
      profile: profiles,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(eq(users.id, authUser.id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    // Auth exists but local record missing — create it on the fly.
    return ensureLocalUserRecord(authUser.id, authUser.email);
  }

  return {
    id: row.user.id,
    email: row.user.email,
    role: row.user.role,
    displayName: row.profile?.displayName ?? null,
    phone: row.user.walletPhone ?? row.profile?.phone ?? null,
    isVerified: row.user.verifiedAt !== null,
  };
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const rows = await db
    .select({
      user: users,
      profile: profiles,
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(eq(users.id, user.id))
    .limit(1);

  const row = rows[0];
  if (!row) throw new Error("User record not found");

  return {
    id: row.user.id,
    email: row.user.email,
    role: row.user.role,
    displayName: row.profile?.displayName ?? null,
    phone: row.user.walletPhone ?? row.profile?.phone ?? null,
    bio: row.profile?.bio ?? null,
    isVerified: row.user.verifiedAt !== null,
  };
}

export async function updateUserProfile(
  id: string,
  input: {
    displayName: string;
    phone?: string;
    bio?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user || user.id !== id) throw new Error("Unauthorized");

  await db
    .update(users)
    .set({ walletPhone: input.phone || null, updatedAt: new Date() })
    .where(eq(users.id, id));

  await db
    .update(profiles)
    .set({
      displayName: input.displayName,
      phone: input.phone || null,
      bio: input.bio || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, id));

  return getCurrentUserProfile();
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }
  return user;
}

export async function ensureLocalUserRecord(
  id: string,
  email: string,
  role: UserRole = "buyer"
): Promise<CurrentUser> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (existing.length === 0) {
    // Ensure the auth mirror row exists so the users FK is satisfied.
    const existingMirror = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(eq(authUsers.id, id))
      .limit(1);
    if (existingMirror.length === 0) {
      await db.insert(authUsers).values({ id, email });
    }

    await db.insert(users).values({ id, email, role });
    await db.insert(profiles).values({
      id,
      displayName: email.split("@")[0],
    });
  }

  return {
    id,
    email,
    role,
    displayName: email.split("@")[0],
    phone: null,
    isVerified: false,
  };
}
