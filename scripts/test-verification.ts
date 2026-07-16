import { db } from "~/db";
import { users } from "~/db/schema";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const rows = await db.select({ count: sql<number>`count(*)` }).from(users);
    console.log("OK users table accessible, count:", rows[0].count);
    const sample = await db.select({ id: users.id, verificationStatus: users.verificationStatus }).from(users).limit(1);
    console.log("OK verification_status column exists", sample[0]);
  } catch (e) {
    console.error("ERROR", e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main();
