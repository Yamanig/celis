import { getServiceSupabase } from "../app/lib/supabase/server";
import { db } from "../app/db";
import { authUsers, users, profiles } from "../app/db/schema";
import { eq } from "drizzle-orm";

function requireEnv(): { email: string; password: string } {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "seed-admin: set ADMIN_EMAIL and ADMIN_PASSWORD before running.\n" +
        "  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='<12+ char secret>' pnpm db:seed-admin"
    );
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("seed-admin: ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }
  return { email, password };
}

const { email: EMAIL, password: PASSWORD } = requireEnv();

async function main() {
  const supabase = getServiceSupabase();

  // Ensure the auth mirror row exists in public."auth.users" (Drizzle FK target)
  const existingMirror = await db
    .select({ id: authUsers.id })
    .from(authUsers)
    .where(eq(authUsers.email, EMAIL))
    .limit(1);

  // Check Supabase Auth for an existing user with this email
  const {
    data: { users: existingAuthUsers },
    error: listError,
  } = await supabase.auth.admin.listUsers();

  if (listError) {
    throw listError;
  }

  let authUser = existingAuthUsers.find((u) => u.email === EMAIL);

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    authUser = data.user;
    console.log("Created Supabase auth user:", authUser.id);
  } else {
    console.log("Supabase auth user already exists:", authUser.id);
  }

  const userId = authUser.id;

  if (existingMirror.length === 0) {
    await db.insert(authUsers).values({ id: userId, email: EMAIL });
    console.log("Inserted auth mirror row.");
  }

  // Upsert users row
  const existingUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existingUsers.length === 0) {
    await db.insert(users).values({
      id: userId,
      email: EMAIL,
      role: "admin",
      isSuperAdmin: true,
    });
    await db.insert(profiles).values({
      id: userId,
      displayName: "Celis Admin",
    });
    console.log("Inserted admin user/profile.");
  } else {
    await db
      .update(users)
      .set({ role: "admin", isSuperAdmin: true })
      .where(eq(users.id, userId));
    console.log("Updated admin user role.");
  }

  console.log("\nAdmin account ready:");
  console.log("Email:", EMAIL);
  console.log("Password: (set from ADMIN_PASSWORD env var)");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
