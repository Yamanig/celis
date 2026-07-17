import { db } from "../app/db";
import {
  categories,
  categoryConditions,
  categoryFields,
  categoryFieldOptions,
} from "../app/db/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Dynamic field + option seeder for the Celis marketplace.
 *
 * Replaces the hard-coded `carsCategorySchema` and per-category `metadata_schema`
 * jsonb with the new `category_fields` / `category_field_options` model.
 *
 * Each field is identified by its own `category_field_id`. Two categories may
 * both expose a "condition" field but with DIFFERENT option sets because options
 * are scoped to the field row, not to the shared `field_key`.
 *
 * After seeding, the trigger on `category_fields` keeps `metadata_schema`
 * (used by celis.so) in sync automatically.
 *
 * Run:
 *   pnpm db:seed-fields
 * (uses DATABASE_URL / DIRECT_URL from .env). Safe to re-run.
 */

type FieldDef = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  searchable?: boolean;
  isFilter?: boolean;
  helpText?: string;
  options?: Array<{ value: string; label: string; group?: string }>;
};

const COMMON_FIELDS: FieldDef[] = [
  { key: "region", label: "Region", type: "single-select", required: true, isFilter: true, searchable: true,
    options: [
      { value: "mogadishu", label: "Mogadishu" },
      { value: "hargeisa", label: "Hargeisa" },
      { value: "kismayo", label: "Kismayo" },
      { value: "bosaso", label: "Bosaso" },
      { value: "merka", label: "Merca" },
    ] },
  { key: "exchange", label: "Exchange Possible", type: "single-select", options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ] },
];

const CARS_FIELDS: FieldDef[] = [
  { key: "make", label: "Make", type: "single-select", required: true, isFilter: true, searchable: true,
    options: [
      { value: "toyota", label: "Toyota" },
      { value: "lexus", label: "Lexus" },
      { value: "honda", label: "Honda" },
      { value: "nissan", label: "Nissan" },
      { value: "hyundai", label: "Hyundai" },
      { value: "kia", label: "Kia" },
      { value: "benz", label: "Mercedes-Benz" },
      { value: "bmw", label: "BMW" },
    ] },
  { key: "model", label: "Model", type: "text", required: true },
  { key: "color", label: "Color", type: "multi-select", searchable: true,
    options: [
      { value: "black", label: "Black", group: "POPULAR" },
      { value: "gray", label: "Gray", group: "POPULAR" },
      { value: "white", label: "White", group: "POPULAR" },
      { value: "silver", label: "Silver", group: "POPULAR" },
      { value: "blue", label: "Blue", group: "POPULAR" },
      { value: "beige", label: "Beige", group: "OTHER" },
      { value: "brown", label: "Brown", group: "OTHER" },
      { value: "green", label: "Green", group: "OTHER" },
      { value: "red", label: "Red", group: "OTHER" },
    ] },
  { key: "transmission", label: "Transmission", type: "single-select", required: true,
    options: [
      { value: "amt", label: "AMT" },
      { value: "automatic", label: "Automatic" },
      { value: "cvt", label: "CVT" },
      { value: "manual", label: "Manual" },
    ] },
  { key: "fuel_type", label: "Fuel Type", type: "single-select",
    options: [
      { value: "petrol", label: "Petrol" },
      { value: "diesel", label: "Diesel" },
      { value: "hybrid", label: "Hybrid" },
      { value: "electric", label: "Electric" },
    ] },
  { key: "mileage", label: "Mileage (km)", type: "number" },
  { key: "engine_size", label: "Engine Size (L)", type: "number" },
  { key: "vin", label: "VIN / Chassis Number", type: "text",
    helpText: "It is safe to indicate Chassis number. Celis will hide 6 symbols." },
  { key: "registered", label: "Registered Car", type: "boolean" },
  { key: "features", label: "Key Features", type: "multi-select", searchable: true,
    options: [
      { value: "air_conditioning", label: "Air Conditioning", group: "POPULAR" },
      { value: "radio", label: "AM/FM Radio", group: "POPULAR" },
      { value: "cd", label: "CD Player", group: "POPULAR" },
      { value: "wheels", label: "Alloy Wheels", group: "POPULAR" },
      { value: "airbags", label: "Airbags", group: "POPULAR" },
      { value: "android_auto", label: "Android Auto", group: "OTHER" },
      { value: "abs", label: "Anti-Lock Brakes", group: "OTHER" },
      { value: "carplay", label: "CarPlay", group: "OTHER" },
      { value: "cruise", label: "Cruise Control", group: "OTHER" },
    ] },
];

const PHONES_FIELDS: FieldDef[] = [
  { key: "brand", label: "Brand", type: "single-select", required: true, isFilter: true, searchable: true,
    options: [
      { value: "apple", label: "Apple" },
      { value: "samsung", label: "Samsung" },
      { value: "huawei", label: "Huawei" },
      { value: "xiaomi", label: "Xiaomi" },
      { value: "oppo", label: "Oppo" },
      { value: "tecno", label: "Tecno" },
      { value: "infinix", label: "Infinix" },
    ] },
  { key: "model", label: "Model", type: "text", required: true },
  { key: "storage", label: "Storage", type: "single-select",
    options: [
      { value: "16gb", label: "16 GB" },
      { value: "32gb", label: "32 GB" },
      { value: "64gb", label: "64 GB" },
      { value: "128gb", label: "128 GB" },
      { value: "256gb", label: "256 GB" },
      { value: "512gb", label: "512 GB" },
      { value: "1tb", label: "1 TB" },
    ] },
  { key: "ram", label: "RAM", type: "single-select",
    options: [
      { value: "2gb", label: "2 GB" },
      { value: "3gb", label: "3 GB" },
      { value: "4gb", label: "4 GB" },
      { value: "6gb", label: "6 GB" },
      { value: "8gb", label: "8 GB" },
      { value: "12gb", label: "12 GB" },
    ] },
  { key: "color", label: "Color", type: "multi-select", searchable: true,
    options: [
      { value: "black", label: "Black", group: "POPULAR" },
      { value: "white", label: "White", group: "POPULAR" },
      { value: "blue", label: "Blue", group: "POPULAR" },
      { value: "gold", label: "Gold", group: "OTHER" },
      { value: "silver", label: "Silver", group: "OTHER" },
      { value: "green", label: "Green", group: "OTHER" },
    ] },
  { key: "battery_health", label: "Battery Health", type: "single-select",
    options: [
      { value: "excellent", label: "Excellent" },
      { value: "good", label: "Good" },
      { value: "fair", label: "Fair" },
      { value: "needs_replacement", label: "Needs Replacement" },
    ] },
  { key: "sim_slots", label: "SIM Slots", type: "number" },
  { key: "warranty_months", label: "Warranty (months)", type: "number" },
];

const FASHION_FIELDS: FieldDef[] = [
  { key: "size", label: "Size", type: "single-select",
    options: [
      { value: "xs", label: "XS" },
      { value: "s", label: "S" },
      { value: "m", label: "M" },
      { value: "l", label: "L" },
      { value: "xl", label: "XL" },
      { value: "xxl", label: "XXL" },
    ] },
  { key: "color", label: "Color", type: "multi-select", searchable: true,
    options: [
      { value: "black", label: "Black" },
      { value: "white", label: "White" },
      { value: "blue", label: "Blue" },
      { value: "red", label: "Red" },
      { value: "green", label: "Green" },
    ] },
  { key: "material", label: "Material", type: "text" },
];

// slug -> fields
const SEED: Record<string, FieldDef[]> = {
  cars: [...COMMON_FIELDS, ...CARS_FIELDS],
  "phones-tablets": [...COMMON_FIELDS, ...PHONES_FIELDS],
  fashion: [...COMMON_FIELDS, ...FASHION_FIELDS],
};

async function getCategoryBySlug(slug: string) {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug));
  return rows[0] ?? null;
}

async function seedField(categoryId: string, def: FieldDef, sortOrder: number) {
  const [field] = await db
    .insert(categoryFields)
    .values({
      categoryId,
      fieldKey: def.key,
      label: def.label,
      type: def.type,
      required: def.required ?? false,
      searchable: def.searchable ?? false,
      isFilter: def.isFilter ?? false,
      helpText: def.helpText ?? null,
      sortOrder,
    })
    .onConflictDoUpdate({
      target: [categoryFields.categoryId, categoryFields.fieldKey],
      set: {
        label: def.label,
        type: def.type,
        required: def.required ?? false,
        searchable: def.searchable ?? false,
        isFilter: def.isFilter ?? false,
        helpText: def.helpText ?? null,
        sortOrder,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (def.options && def.options.length) {
    const opts = def.options.map((o, i) => ({
      categoryFieldId: field.id,
      value: o.value,
      label: o.label,
      group: o.group ?? "OTHER",
      sortOrder: i,
      isActive: true,
    }));
    await db
      .insert(categoryFieldOptions)
      .values(opts)
      .onConflictDoUpdate({
        target: [categoryFieldOptions.categoryFieldId, categoryFieldOptions.value],
        set: {
          label: sql`EXCLUDED.label`,
          group: sql`EXCLUDED.group`,
          sortOrder: sql`EXCLUDED.sort_order`,
          isActive: true,
        },
      });
  }
  return field;
}

async function main() {
  for (const [slug, fields] of Object.entries(SEED)) {
    const category = await getCategoryBySlug(slug);
    if (!category) {
      console.warn(`Category "${slug}" not found; skipping field seed.`);
      continue;
    }
    for (let i = 0; i < fields.length; i++) {
      await seedField(category.id, fields[i], i);
    }
    console.log(`Seeded ${fields.length} fields for "${slug}".`);
  }

  const totalFields = await db.select().from(categoryFields);
  const totalOptions = await db.select().from(categoryFieldOptions);
  console.log(`Total: ${totalFields.length} field rows, ${totalOptions.length} option rows.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
