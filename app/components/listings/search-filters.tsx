import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Combobox } from "~/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  fetchCategoryMetadataSchema,
  fetchCategoryConditions,
  type CategoryListItem,
} from "~/server/categories.functions";
import type {
  CategoryMetadataSchema,
  MetadataField,
} from "~/lib/category-metadata";

export interface SearchFiltersState {
  query: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  metadata: Record<string, string>;
  sort: "newest" | "price_asc" | "price_desc";
}

interface SearchFiltersProps {
  categories: CategoryListItem[];
  initial: Partial<SearchFiltersState>;
  onSearch: (filters: SearchFiltersState) => void;
}

const DEFAULT_FILTERS: SearchFiltersState = {
  query: "",
  categoryId: "",
  minPrice: "",
  maxPrice: "",
  condition: "",
  metadata: {},
  sort: "newest",
};

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export function SearchFilters({
  categories,
  initial,
  onSearch,
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFiltersState>({
    ...DEFAULT_FILTERS,
    ...initial,
  });
  const [metadataSchema, setMetadataSchema] =
    useState<CategoryMetadataSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [categoryConditions, setCategoryConditions] = useState<
    { code: string; label: string }[]
  >([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, ...initial }));
  }, [initial]);

  useEffect(() => {
    if (!filters.categoryId) {
      setMetadataSchema(null);
      setCategoryConditions([]);
      return;
    }
    setSchemaLoading(true);
    setConditionsLoading(true);
    fetchCategoryMetadataSchema({ data: { categoryId: filters.categoryId } })
      .then((schema) => setMetadataSchema(schema))
      .finally(() => setSchemaLoading(false));
    fetchCategoryConditions({ data: { categoryId: filters.categoryId } })
      .then((rows) => setCategoryConditions(rows))
      .finally(() => setConditionsLoading(false));
  }, [filters.categoryId]);

  const update = <K extends keyof SearchFiltersState>(
    key: K,
    value: SearchFiltersState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const updateMetadata = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value },
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categoryId,
      condition: "",
      metadata: {},
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const renderMetadataField = (field: MetadataField) => {
    const value = filters.metadata[field.key] ?? "";
    const id = `metadata-${field.key}`;

    if (field.type === "boolean") {
      return (
        <div className="space-y-2" key={field.key}>
          <Label htmlFor={id}>{field.label}</Label>
          <Select
            value={value}
            onValueChange={(v) => updateMetadata(field.key, v)}
          >
            <SelectTrigger id={id} className="w-full">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[50vh]">
              <SelectItem value="">Any</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.type === "select" && field.options && field.options.length > 0) {
      return (
        <div className="space-y-2" key={field.key}>
          <Label htmlFor={id}>{field.label}</Label>
          <Select
            value={value}
            onValueChange={(v) => updateMetadata(field.key, v)}
          >
            <SelectTrigger id={id} className="w-full">
              <SelectValue placeholder={`Any ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-[50vh]">
              <SelectItem value="">Any</SelectItem>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div className="space-y-2" key={field.key}>
        <Label htmlFor={id}>{field.label}</Label>
        <Input
          id={id}
          type={field.type === "number" ? "number" : "text"}
          placeholder={field.required ? `Enter ${field.label.toLowerCase()}` : "Any"}
          value={value}
          onChange={(e) => updateMetadata(field.key, e.target.value)}
        />
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-md border border-celis-border bg-celis-surface-base p-4"
    >
      <div className="space-y-2">
        <Label htmlFor="query">Search</Label>
        <Input
          id="query"
          placeholder="What are you looking for?"
          value={filters.query}
          onChange={(e) => update("query", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Combobox
          value={filters.categoryId}
          onValueChange={handleCategoryChange}
          placeholder="All categories"
          searchPlaceholder="Search categories..."
          options={[
            { value: "", label: "All categories" },
            ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="minPrice">Min price</Label>
          <Input
            id="minPrice"
            type="number"
            min={0}
            placeholder="0"
            value={filters.minPrice}
            onChange={(e) => update("minPrice", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxPrice">Max price</Label>
          <Input
            id="maxPrice"
            type="number"
            min={0}
            placeholder="Any"
            value={filters.maxPrice}
            onChange={(e) => update("maxPrice", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">Condition</Label>
        <Combobox
          value={filters.condition}
          onValueChange={(v) => update("condition", v)}
          placeholder={
            filters.categoryId
              ? categoryConditions.length > 0
                ? "Any condition"
                : "No conditions for this category"
              : "Select a category first"
          }
          searchPlaceholder="Search conditions..."
          options={[
            { value: "", label: "Any condition" },
            ...categoryConditions.map((c) => ({
              value: c.code,
              label: c.label,
            })),
          ]}
          disabled={!filters.categoryId || categoryConditions.length === 0}
        />
        {conditionsLoading && (
          <p className="text-xs text-celis-ink-secondary">Loading conditions...</p>
        )}
      </div>

      {schemaLoading && (
        <p className="text-sm text-celis-ink-secondary">Loading filters...</p>
      )}

      {metadataSchema && metadataSchema.fields.length > 0 && (
        <div className="space-y-4 border-t border-celis-border pt-4">
          <p className="text-sm font-medium text-celis-ink">Category filters</p>
          {metadataSchema.fields.map((field) => renderMetadataField(field))}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="sort">Sort by</Label>
        <Combobox
          value={filters.sort}
          onValueChange={(v) => update("sort", v as SearchFiltersState["sort"])}
          options={sortOptions}
        />
      </div>

      <Button type="submit" className="w-full">
        Search
      </Button>
    </form>
  );
}
