import { db } from "../app/db";
import { platformConfigs, categoryFees } from "../app/db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  // Ensure the monetization model config exists.
  const existing = await db
    .select({ key: platformConfigs.key })
    .from(platformConfigs)
    .where(eq(platformConfigs.key, "platform_monetization_model"))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(platformConfigs).values({
      key: "platform_monetization_model",
      value: "fixed_only",
      description:
        "Platform monetization model: fixed_only, commission_only, or hybrid",
    });
    console.log("Inserted platform_monetization_model config.");
  } else {
    console.log("platform_monetization_model config already exists.");
  }

  // Seed a global fallback listing fee and commission rule.
  const existingFees = await db.select().from(categoryFees);
  if (existingFees.length === 0) {
    await db.insert(categoryFees).values([
      {
        feeType: "listing_fee",
        amount: 100, // $1.00
        percentage: 0,
        isActive: true,
      },
      {
        feeType: "commission",
        amount: 0,
        percentage: 500, // 5%
        isActive: true,
      },
    ]);
    console.log("Seeded default category fees.");
  } else {
    console.log("Category fees already exist.");
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
