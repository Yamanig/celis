import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
        <Select
          value={filters.categoryId}
          onValueChange={(v) => update("categoryId", v)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select
          value={filters.condition}
          onValueChange={(v) => update("condition", v)}
        >
          <SelectTrigger id="condition">
            <SelectValue placeholder="Any condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any condition</SelectItem>
            {ITEM_CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort">Sort by</Label>
        <Select
          value={filters.sort}
          onValueChange={(v) => update("sort", v as SearchFiltersState["sort"])}
        >
          <SelectTrigger id="sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: low to high</SelectItem>
            <SelectItem value="price_desc">Price: high to low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        Search
      </Button>
    </form>
  );
}
