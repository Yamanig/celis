import { createServerFn } from "@tanstack/react-start";
import {
  getRootCategories,
  getCategoryCounts,
  getMinMaxPrices,
} from "./categories.server";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await getRootCategories();
  return rows.map<CategoryListItem>((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
});

export const fetchCategoryCounts = createServerFn({ method: "GET" }).handler(
  async () => {
    return getCategoryCounts();
  }
);

export const fetchPriceRange = createServerFn({ method: "GET" }).handler(
  async () => {
    return getMinMaxPrices();
  }
);
