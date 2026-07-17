import { db } from "../app/db";
import { categories } from "../app/db/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Idempotent subcategory seeder.
 *
 * Adds a category -> subcategory hierarchy under the existing root categories
 * so the mobile app's hierarchical category picker (Phase 6) and any web
 * browse UI have child categories to display.
 *
 * Safe to re-run: uses `slug` (unique) + onConflictDoNothing, and links each
 * child to its parent root by slug.
 *
 * Run:
 *   pnpm db:seed-categories
 * (uses DATABASE_URL / DIRECT_URL from .env)
 */

type SubDef = { slug: string; name: string; sortOrder: number };

const SUBCATEGORIES: Record<string, SubDef[]> = {
  electronics: [
    { slug: "phones-tablets", name: "Phones & Tablets", sortOrder: 1 },
    { slug: "laptops-computers", name: "Laptops & Computers", sortOrder: 2 },
    { slug: "tv-audio", name: "TV & Audio", sortOrder: 3 },
    { slug: "cameras", name: "Cameras", sortOrder: 4 },
    { slug: "gaming", name: "Gaming & Consoles", sortOrder: 5 },
    { slug: "accessories", name: "Electronics Accessories", sortOrder: 6 },
  ],
  vehicles: [
    { slug: "cars", name: "Cars", sortOrder: 1 },
    { slug: "motorcycles", name: "Motorcycles & Scooters", sortOrder: 2 },
    { slug: "trucks-buses", name: "Trucks & Buses", sortOrder: 3 },
    { slug: "car-parts", name: "Car Parts & Accessories", sortOrder: 4 },
    { slug: "heavy-machinery", name: "Heavy Machinery", sortOrder: 5 },
  ],
  fashion: [
    { slug: "men-clothing", name: "Men's Clothing", sortOrder: 1 },
    { slug: "women-clothing", name: "Women's Clothing", sortOrder: 2 },
    { slug: "shoes", name: "Shoes & Footwear", sortOrder: 3 },
    { slug: "bags-accessories", name: "Bags & Accessories", sortOrder: 4 },
    { slug: "watches-jewelry", name: "Watches & Jewelry", sortOrder: 5 },
  ],
  home: [
    { slug: "furniture", name: "Furniture", sortOrder: 1 },
    { slug: "appliances", name: "Home Appliances", sortOrder: 2 },
    { slug: "kitchen", name: "Kitchen & Dining", sortOrder: 3 },
    { slug: "decor", name: "Decor & Lighting", sortOrder: 4 },
    { slug: "garden", name: "Garden & Outdoor", sortOrder: 5 },
  ],
  property: [
    { slug: "houses-sale", name: "Houses for Sale", sortOrder: 1 },
    { slug: "houses-rent", name: "Houses for Rent", sortOrder: 2 },
    { slug: "land", name: "Land & Plots", sortOrder: 3 },
    { slug: "commercial", name: "Commercial Property", sortOrder: 4 },
    { slug: "apartments", name: "Apartments", sortOrder: 5 },
  ],
  animals: [
    { slug: "livestock", name: "Livestock", sortOrder: 1 },
    { slug: "pets", name: "Pets", sortOrder: 2 },
    { slug: "pet-supplies", name: "Pet Supplies", sortOrder: 3 },
    { slug: "farm-equipment", name: "Farm Equipment", sortOrder: 4 },
  ],
  food: [
    { slug: "fresh-produce", name: "Fresh Produce", sortOrder: 1 },
    { slug: "grains-cereal", name: "Grains & Cereal", sortOrder: 2 },
    { slug: "livestock-feed", name: "Livestock Feed", sortOrder: 3 },
    { slug: "processed-food", name: "Processed Food", sortOrder: 4 },
  ],
  education: [
    { slug: "books", name: "Books & Notes", sortOrder: 1 },
    { slug: "courses", name: "Courses & Training", sortOrder: 2 },
    { slug: "tutoring", name: "Tutoring", sortOrder: 3 },
  ],
  jobs: [
    { slug: "full-time", name: "Full-time", sortOrder: 1 },
    { slug: "part-time", name: "Part-time", sortOrder: 2 },
    { slug: "remote", name: "Remote", sortOrder: 3 },
  ],
  services: [
    { slug: "repair", name: "Repair & Maintenance", sortOrder: 1 },
    { slug: "construction", name: "Construction", sortOrder: 2 },
    { slug: "cleaning", name: "Cleaning", sortOrder: 3 },
    { slug: "beauty", name: "Beauty & Personal Care", sortOrder: 4 },
  ],
  beauty: [
    { slug: "skincare", name: "Skincare", sortOrder: 1 },
    { slug: "haircare", name: "Haircare", sortOrder: 2 },
    { slug: "makeup", name: "Makeup", sortOrder: 3 },
    { slug: "fragrance", name: "Fragrance", sortOrder: 4 },
  ],
  repair: [
    { slug: "phone-repair", name: "Phone Repair", sortOrder: 1 },
    { slug: "appliance-repair", name: "Appliance Repair", sortOrder: 2 },
    { slug: "construction-services", name: "Construction Services", sortOrder: 3 },
  ],
  tools: [
    { slug: "power-tools", name: "Power Tools", sortOrder: 1 },
    { slug: "hand-tools", name: "Hand Tools", sortOrder: 2 },
    { slug: "machinery", name: "Machinery & Equipment", sortOrder: 3 },
  ],
  leisure: [
    { slug: "sports", name: "Sports & Fitness", sortOrder: 1 },
    { slug: "events", name: "Events & Tickets", sortOrder: 2 },
    { slug: "hobbies", name: "Hobbies & Games", sortOrder: 3 },
  ],
  kids: [
    { slug: "baby-gear", name: "Baby Gear", sortOrder: 1 },
    { slug: "kids-clothing", name: "Kids' Clothing", sortOrder: 2 },
    { slug: "toys", name: "Toys", sortOrder: 3 },
  ],
};

async function seed() {
  const roots = await db
    .select()
    .from(categories)
    .where(isNull(categories.parentId));

  let added = 0;
  for (const root of roots) {
    const subs = SUBCATEGORIES[root.slug];
    if (!subs?.length) continue;

    for (const sub of subs) {
      await db
        .insert(categories)
        .values({
          name: sub.name,
          slug: `${root.slug}-${sub.slug}`,
          parentId: root.id,
          sortOrder: sub.sortOrder,
          metadataSchema: {},
        })
        .onConflictDoNothing({ target: categories.slug });
      added += 1;
    }
  }

  const total = await db.$count(categories);
  console.log(`Ensured subcategory hierarchy under ${roots.length} roots (${added} attempted inserts). Total categories: ${total}.`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
