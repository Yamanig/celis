import { db } from "../app/db";
import { categories, categoryConditions } from "../app/db/schema";
import { eq, inArray } from "drizzle-orm";

const DEFAULT_CONDITIONS = [
  { code: "new_with_tags" as const, label: "New with tags", sortOrder: 1 },
  { code: "like_new" as const, label: "Like new", sortOrder: 2 },
  { code: "good" as const, label: "Good", sortOrder: 3 },
  { code: "fair" as const, label: "Fair", sortOrder: 4 },
  { code: "poor" as const, label: "Poor", sortOrder: 5 },
];

const CATEGORY_SPECIFIC: Record<
  string,
  Array<{ code: string; label: string; sortOrder: number }>
> = {
  electronics: [
    { code: "brand_new", label: "Brand New", sortOrder: 1 },
    { code: "used", label: "Used", sortOrder: 2 },
    { code: "refurbished", label: "Refurbished", sortOrder: 3 },
  ],
  vehicles: [
    { code: "brand_new", label: "Brand New", sortOrder: 1 },
    { code: "local_used", label: "Local Used", sortOrder: 2 },
  ],
};

async function seed() {
  const allCategories = await db.select().from(categories);

  for (const category of allCategories) {
    const mappings =
      CATEGORY_SPECIFIC[category.slug] ??
      DEFAULT_CONDITIONS.map((c) => ({ ...c }));

    await db
      .insert(categoryConditions)
      .values(
        mappings.map((m) => ({
          categoryId: category.id,
          code: m.code,
          label: m.label,
          sortOrder: m.sortOrder,
        }))
      )
      .onConflictDoNothing();
  }

  const rows = await db.select().from(categoryConditions);
  console.log(`Seeded ${rows.length} category-condition mappings.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
