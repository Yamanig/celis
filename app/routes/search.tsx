import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { ListingGrid } from "~/components/listings/listing-grid";
import {
  SearchFilters,
  type SearchFiltersState,
} from "~/components/listings/search-filters";
import { Button } from "~/components/ui/button";
import { fetchListings } from "~/server/listings.functions";
import { listCategories } from "~/server/categories.functions";
import { ChevronLeft, ChevronRight } from "lucide-react";

const searchParamsSchema = z.object({
  query: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  condition: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Search listings | Celis" },
      { name: "description", content: "Search thousands of local listings on Celis. Find electronics, cars, apartments, and more." },
    ],
  }),

  validateSearch: searchParamsSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const [result, categories] = await Promise.all([
      fetchListings({
        data: {
          query: search.query,
          categoryId: search.categoryId,
          minPrice: search.minPrice,
          maxPrice: search.maxPrice,
          condition: search.condition || undefined,
          metadata: search.metadata,
          sort: search.sort || "newest",
          page: search.page || 1,
          limit: 24,
        },
      }),
      listCategories(),
    ]);
    return { result, categories, search };
  },
});

function SearchPage() {
  const { result, categories, search } = Route.useLoaderData();
  const navigate = useNavigate({ from: "/search" });

  const initialFilters: SearchFiltersState = {
    query: search.query ?? "",
    categoryId: search.categoryId ?? "",
    minPrice: search.minPrice?.toString() ?? "",
    maxPrice: search.maxPrice?.toString() ?? "",
    condition: search.condition ?? "",
    metadata: search.metadata ?? {},
    sort: search.sort ?? "newest",
  };

  const handleSearch = (filters: SearchFiltersState) => {
    navigate({
      search: {
        query: filters.query || undefined,
        categoryId: filters.categoryId || undefined,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        condition: filters.condition || undefined,
        metadata: Object.keys(filters.metadata).length > 0 ? filters.metadata : undefined,
        sort: filters.sort,
        page: 1,
      },
    });
  };

  const goToPage = (page: number) => {
    navigate({ search: (prev) => ({ ...prev, page }) });
  };

  return (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Browse listings</h1>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside>
            <SearchFilters
              categories={categories}
              initial={initialFilters}
              onSearch={handleSearch}
            />
          </aside>

          <section className="space-y-6">
            <div className="flex items-center justify-between text-sm text-celis-ink-secondary">
              <span>
                {result.total} result{result.total === 1 ? "" : "s"}
              </span>
              <span>
                Page {result.page} of {result.totalPages}
              </span>
            </div>

            <ListingGrid
              listings={result.listings}
              emptyMessage="No listings match your search."
            />

            {result.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={result.page <= 1}
                  onClick={() => goToPage(result.page - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-celis-ink-secondary">
                  {result.page} / {result.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={result.page >= result.totalPages}
                  onClick={() => goToPage(result.page + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
