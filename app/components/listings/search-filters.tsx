import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Combobox } from "~/components/ui/combobox";
import type { CategoryListItem } from "~/server/categories.functions";
import { ITEM_CONDITIONS } from "~/db/schema";

export interface SearchFiltersState {
  query: string;
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
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
  sort: "newest",
};

const conditionOptions = [
  { value: "", label: "Any condition" },
  ...ITEM_CONDITIONS.map((condition) => ({
    value: condition,
    label: condition.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  })),
];

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

  const update = <K extends keyof SearchFiltersState>(
    key: K,
    value: SearchFiltersState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
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
          onValueChange={(v) => update("categoryId", v)}
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
          placeholder="Any condition"
          searchPlaceholder="Search conditions..."
          options={conditionOptions}
        />
      </div>

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
