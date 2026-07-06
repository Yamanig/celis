import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { ListingGrid } from "~/components/listings/listing-grid";
import { fetchShopListings } from "~/server/listings.functions";
import { Pagination } from "~/components/ui/pagination";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Store, MapPin, CheckCircle2 } from "lucide-react";

const shopSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/shops/$shopSlug")({
  component: ShopPage,
  validateSearch: shopSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ params, deps: { search } }) => {
    const result = await fetchShopListings({
      data: { shopSlug: params.shopSlug, page: search.page, limit: 24 },
    });
    if (!result) {
      throw new Error("Shop not found");
    }
    return result;
  },
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-celis-ink-secondary">
        <h1 className="text-2xl font-semibold text-celis-ink">Shop not found</h1>
        <p>{error.message}</p>
      </main>
      <SiteFooter />
    </div>
  ),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.seller?.businessName
          ? `${loaderData.seller.businessName} - Celis Shop`
          : "Celis Shop",
      },
    ],
  }),
});

function ShopPage() {
  const { seller, listings, total, page, totalPages } = Route.useLoaderData();
  const navigate = useNavigate({ from: Route.path });

  const displayName = seller.businessName || seller.displayName || "Shop";

  return (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Card className="mb-8 overflow-hidden border-celis-border bg-celis-surface-base">
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-celis-primary-subtle">
              {seller.businessLogoUrl ? (
                <img
                  src={seller.businessLogoUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Store className="h-8 w-8 text-celis-primary" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-celis-ink sm:text-3xl">
                  {displayName}
                </h1>
                <Badge variant="secondary" className="capitalize">
                  {seller.sellerType}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-celis-ink-secondary">
                {seller.businessAddress && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {seller.businessAddress}
                  </span>
                )}
                {seller.businessRegistrationNumber && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Reg: {seller.businessRegistrationNumber}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-celis-ink">
            Listings ({total})
          </h2>
        </div>

        <ListingGrid
          listings={listings}
          emptyMessage="This shop has no active listings right now."
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(p) =>
            navigate({ search: (prev) => ({ ...prev, page: p }) })
          }
        />
      </main>

      <SiteFooter />
    </div>
  );
}
