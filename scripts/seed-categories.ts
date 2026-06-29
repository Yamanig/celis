import { db } from "../app/db";
import { categories } from "../app/db/schema";

const ROOT_CATEGORIES = [
  { name: "Electronics", slug: "electronics", sortOrder: 10 },
  { name: "Vehicles", slug: "vehicles", sortOrder: 20 },
  { name: "Property", slug: "property", sortOrder: 30 },
  { name: "Fashion", slug: "fashion", sortOrder: 40 },
  { name: "Home & Garden", slug: "home-garden", sortOrder: 50 },
  { name: "Jobs", slug: "jobs", sortOrder: 60 },
  { name: "Services", slug: "services", sortOrder: 70 },
  { name: "Health & Beauty", slug: "health-beauty", sortOrder: 80 },
  { name: "Kids & Toys", slug: "kids-toys", sortOrder: 90 },
  { name: "Sports & Outdoors", slug: "sports-outdoors", sortOrder: 100 },
  { name: "Animals", slug: "animals", sortOrder: 110 },
  { name: "Food & Agriculture", slug: "food-agriculture", sortOrder: 120 },
  { name: "Education", slug: "education", sortOrder: 130 },
  { name: "Other", slug: "other", sortOrder: 999 },
];

async function seed() {
  await db
    .insert(categories)
    .values(ROOT_CATEGORIES)
    .onConflictDoNothing({ target: categories.slug });

  const rows = await db.select().from(categories);
  console.log(`Seeded ${rows.length} categories.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
