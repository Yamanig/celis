import { db } from "../app/db";
import { users, profiles } from "../app/db/schema";
import { eq, ne, or, isNotNull, and } from "drizzle-orm";

async function main() {
  const rows = await db
    .select({
      userId: profiles.id,
      sellerNumber: profiles.sellerNumber,
      role: users.role,
      isInternal: users.isInternal,
      email: users.email,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.id, users.id))
    .where(
      and(
        isNotNull(profiles.sellerNumber),
        or(ne(users.role, "seller"), eq(users.isInternal, true))
      )
    );

  if (rows.length === 0) {
    console.log("No non-seller seller numbers found. Nothing to clean up.");
    return;
  }

  console.log(`Found ${rows.length} profile(s) with seller numbers that do not belong to external sellers:`);
  for (const row of rows) {
    console.log(`  - ${row.email} (role: ${row.role}, internal: ${row.isInternal}, number: ${row.sellerNumber})`);
  }

  const result = await db
    .update(profiles)
    .set({ sellerNumber: null, updatedAt: new Date() })
    .where(
      and(
        isNotNull(profiles.sellerNumber),
        or(ne(users.role, "seller"), eq(users.isInternal, true))
      )
    );

  console.log(`Cleared seller numbers from ${result.length} profile(s).`);
}

main()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  });
