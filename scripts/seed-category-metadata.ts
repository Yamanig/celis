import { db } from "../app/db";
import { categories, categoryClosure, categoryConditions } from "../app/db/schema";
import { eq } from "drizzle-orm";
import type { MetadataField } from "../app/lib/category-metadata";
import type { ItemCondition } from "../app/db/schema/enums";

interface SeedCondition {
  code: ItemCondition;
  label: string;
  description?: string;
  sortOrder: number;
}

interface SeedCategory {
  slug: string;
  name: string;
  parentSlug?: string;
  fields: MetadataField[];
  conditions?: SeedCondition[];
}

const SEED: SeedCategory[] = [
  {
    slug: "electronics",
    name: "Electronics",
    fields: [
      { key: "brand", type: "text", label: "Brand", required: true },
      { key: "model", type: "text", label: "Model", required: true },
      {
        key: "condition",
        type: "select",
        label: "Condition",
        required: true,
        options: ["Brand New", "Used", "Refurbished"],
      },
      { key: "storage", type: "text", label: "Storage", required: false },
      { key: "color", type: "text", label: "Color", required: false },
      {
        key: "warranty_months",
        type: "number",
        label: "Warranty (months)",
        required: false,
      },
    ],
    conditions: [
      { code: "brand_new", label: "Brand New", sortOrder: 10 },
      { code: "used", label: "Used", sortOrder: 20 },
      { code: "refurbished", label: "Refurbished", sortOrder: 30 },
    ],
  },
  {
    slug: "phones",
    name: "Phones",
    parentSlug: "electronics",
    fields: [
      { key: "brand", type: "text", label: "Brand", required: true },
      { key: "model", type: "text", label: "Model", required: true },
      {
        key: "condition",
        type: "select",
        label: "Condition",
        required: true,
        options: ["Brand New", "Used", "Refurbished"],
      },
      { key: "storage", type: "text", label: "Storage", required: false },
      { key: "color", type: "text", label: "Color", required: false },
      {
        key: "battery_health",
        type: "select",
        label: "Battery Health",
        required: false,
        options: ["Excellent", "Good", "Fair", "Needs Replacement"],
      },
      {
        key: "sim_slots",
        type: "number",
        label: "SIM Slots",
        required: false,
      },
      {
        key: "warranty_months",
        type: "number",
        label: "Warranty (months)",
        required: false,
      },
    ],
    conditions: [
      { code: "brand_new", label: "Brand New", sortOrder: 10 },
      { code: "used", label: "Used", sortOrder: 20 },
      { code: "refurbished", label: "Refurbished", sortOrder: 30 },
    ],
  },
  {
    slug: "property",
    name: "Property",
    fields: [
      {
        key: "property_type",
        type: "select",
        label: "Property Type",
        required: true,
        options: ["Apartment", "House", "Villa", "Land", "Commercial"],
      },
      { key: "bedrooms", type: "number", label: "Bedrooms", required: false },
      { key: "bathrooms", type: "number", label: "Bathrooms", required: false },
      {
        key: "square_meters",
        type: "number",
        label: "Square Meters",
        required: false,
      },
      { key: "furnished", type: "boolean", label: "Furnished", required: false },
      {
        key: "parking_spaces",
        type: "number",
        label: "Parking Spaces",
        required: false,
      },
      { key: "district", type: "text", label: "District", required: false },
    ],
  },
];

async function getCategoryBySlug(slug: string) {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug));
  return rows[0] ?? null;
}

async function getOrCreateCategory(
  slug: string,
  name: string,
  parentId?: string
) {
  const existing = await getCategoryBySlug(slug);
  if (existing) return { created: false as const, category: existing };

  const [inserted] = await db
    .insert(categories)
    .values({ slug, name, parentId, metadataSchema: {} })
    .returning();

  return { created: true as const, category: inserted };
}

async function seedClosure(childId: string, parentId?: string) {
  // Self-reference (depth 0)
  await db.insert(categoryClosure).values({
    ancestorId: childId,
    descendantId: childId,
    depth: 0,
  });

  if (!parentId) return;

  // Copy all parent paths and increase depth by one.
  const parentPaths = await db
    .select()
    .from(categoryClosure)
    .where(eq(categoryClosure.descendantId, parentId));

  for (const path of parentPaths) {
    await db.insert(categoryClosure).values({
      ancestorId: path.ancestorId,
      descendantId: childId,
      depth: path.depth + 1,
    });
  }
}

async function seedConditions(
  categoryId: string,
  conditions: SeedCondition[]
) {
  if (conditions.length === 0) return;

  await db
    .insert(categoryConditions)
    .values(
      conditions.map((c) => ({
        categoryId,
        code: c.code,
        label: c.label,
        description: c.description ?? null,
        sortOrder: c.sortOrder,
      }))
    )
    .onConflictDoNothing({
      target: [categoryConditions.categoryId, categoryConditions.code],
    });
}

async function main() {
  for (const item of SEED) {
    let parentId: string | undefined;

    if (item.parentSlug) {
      const parent = await getCategoryBySlug(item.parentSlug);
      if (!parent) {
        console.warn(
          `Parent category "${item.parentSlug}" not found; skipping "${item.slug}".`
        );
        continue;
      }
      parentId = parent.id;
    }

    const { created, category } = await getOrCreateCategory(
      item.slug,
      item.name,
      parentId
    );

    if (created && parentId) {
      await seedClosure(category.id, parentId);
    }

    await db
      .update(categories)
      .set({ metadataSchema: { fields: item.fields } })
      .where(eq(categories.id, category.id));

    if (item.conditions) {
      await seedConditions(category.id, item.conditions);
    }

    console.log(
      `Seeded metadata for "${item.slug}" (${item.conditions?.length ?? 0} conditions)`
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
