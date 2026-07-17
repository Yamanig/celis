export type MetadataFieldType = "text" | "number" | "boolean" | "select";

export interface MetadataField {
  key: string;
  type: MetadataFieldType;
  label: string;
  required?: boolean;
  options?: string[];
}

export interface CategoryMetadataSchema {
  fields: MetadataField[];
}

export function isValidMetadataSchema(value: unknown): value is CategoryMetadataSchema {
  return (
    typeof value === "object" &&
    value !== null &&
    "fields" in value &&
    Array.isArray((value as CategoryMetadataSchema).fields) &&
    (value as CategoryMetadataSchema).fields.every(
      (f) =>
        typeof f === "object" &&
        f !== null &&
        typeof f.key === "string" &&
        typeof f.label === "string" &&
        ["text", "number", "boolean", "select"].includes(f.type)
    )
  );
}

export function validateMetadata(
  schema: CategoryMetadataSchema | undefined | null,
  metadata: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!schema) return errors;

  for (const field of schema.fields) {
    const value = metadata[field.key];
    if (field.required && (value === undefined || value === "" || value === null)) {
      errors[field.key] = `${field.label} is required`;
      continue;
    }
    if (value === undefined || value === null || value === "") continue;

    if (field.type === "number" && Number.isNaN(Number(value))) {
      errors[field.key] = `${field.label} must be a number`;
    }
    if (field.type === "select" && field.options && !field.options.includes(String(value))) {
      errors[field.key] = `${field.label} is invalid`;
    }
  }
  return errors;
}

export function normalizeMetadataValue(
  type: MetadataFieldType,
  value: unknown
): string | number | boolean {
  if (type === "boolean") return value === true || value === "true";
  if (type === "number") {
    const n = Number(value);
    return Number.isNaN(n) ? 0 : n;
  }
  return value === undefined || value === null ? "" : String(value);
}

export function formatMetadataValue(field: MetadataField, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (field.type === "boolean") return value ? "Yes" : "No";
  return String(value);
}
