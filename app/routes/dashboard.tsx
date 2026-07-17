import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { useAuth } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Pagination } from "~/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ListingStatusBadge } from "~/components/admin/status-badge";
import {
  fetchSellerListings,
  removeListing,
  fetchCurrentSellerSubscription,
} from "~/server/listings.functions";
import { PaymentModal } from "~/components/listings/payment-modal";
import { getFeaturedListingFee } from "~/server/config.functions";
import { formatPrice } from "~/lib/format";
import { Trash2, Package, Store, Calendar, Sparkles } from "lucide-react";

const dashboardSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard | Celis" },
      { name: "description", content: "Manage your listings, orders, and seller package from your Celis dashboard." },
    ],
  }),

  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/auth/sign-in", search: { redirect: "/dashboard" } });
    }
    if (context.user.role === "admin") {
      throw redirect({ to: "/admin" });
    }
  },
  validateSearch: dashboardSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const [listingsData, featuredFeeCents] = await Promise.all([
      fetchSellerListings({ data: { page: search.page, limit: 10 } }),
      getFeaturedListingFee(),
    ]);
    return { ...listingsData, featuredFeeCents };
  },
});

function DashboardPage() {
  const { user } = useAuth();
  const { items, total, activeCount, page, totalPages, featuredFeeCents } =
    Route.useLoaderData();
  const navigate = useNavigate({ from: "/dashboard" });
  const router = useRouter();
  const [listings, setListings] = useState(items);
  const [featureModal, setFeatureModal] = useState<{
    open: boolean;
    listingId: string | null;
  }>({ open: false, listingId: null });
  const [subscription, setSubscription] = useState<{
    packageName: string;
    listingAllowance: number | null;
    isUnlimited: boolean;
    used: number;
    remaining: number | null;
    expiresAt: Date;
  } | null>(null);

  useEffect(() => {
    if (user?.role === "seller") {
      fetchCurrentSellerSubscription().then(setSubscription);
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    await removeListing({ data: { id } });
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {user?.displayName ?? user?.email ?? "Dashboard"}
            </h1>
            <p className="text-sm text-celis-ink-secondary">
              {user?.role === "seller" ? "Seller dashboard" : "Buyer dashboard"}
            </p>
            {user?.sellerNumber && (
              <p className="mt-1 text-xs text-celis-ink-tertiary">
                Seller number: <span className="font-mono">{user.sellerNumber}</span>
              </p>
            )}
          </div>
          <Button asChild>
            <Link to="/sell">List new item</Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-celis-ink-secondary">
                Total listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Store className="h-5 w-5 text-celis-primary" />
                {total}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-celis-ink-secondary">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Package className="h-5 w-5 text-celis-success" />
                {activeCount}
              </div>
            </CardContent>
          </Card>

          {user?.role === "seller" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-celis-ink-secondary">
                  {subscription ? "Package" : "No package"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-2xl font-bold">
                  <Calendar className="h-5 w-5 text-celis-primary" />
                  {subscription ? (
                    <span>
                      {subscription.isUnlimited
                        ? "Unlimited"
                        : `${subscription.remaining} / ${subscription.listingAllowance}`}
                    </span>
                  ) : (
                    <span className="text-base font-normal text-celis-ink-secondary">
                      N/A
                    </span>
                  )}
                </div>
                {subscription && (
                  <p className="mt-1 text-xs text-celis-ink-secondary">
                    {subscription.packageName} · Expires{" "}
                    {new Date(subscription.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your listings</CardTitle>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="py-8 text-center text-celis-ink-secondary">
                <p className="mb-4">You haven&apos;t listed anything yet.</p>
                <Button asChild>
                  <Link to="/sell">Create your first listing</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-celis-border">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={listing.images[0] ?? "/placeholder.svg"}
                        alt={listing.title}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                      <div>
                        <p className="font-medium">
                          <Link
                            to="/listings/$id"
                            params={{ id: listing.id }}
                            className="hover:text-celis-primary"
                          >
                            {listing.title}
                          </Link>
                        </p>
                        <p className="text-sm text-celis-ink-secondary">
                          {formatPrice(listing.price)} · {listing.categoryName}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <ListingStatusBadge status={listing.status} />
                          {listing.isFeatured && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-celis-caution/10 px-2 py-0.5 text-xs font-medium text-celis-caution">
                              <Sparkles className="h-3 w-3" />
                              Featured
                            </span>
                          )}
                        </div>
                        {listing.status === "pending_review" && (
                          <p className="mt-1 text-xs text-celis-ink-tertiary">
                            Awaiting officer review before going live.
                          </p>
                        )}
                        {listing.status === "rejected" &&
                          "rejectionReason" in listing &&
                          listing.rejectionReason && (
                            <p className="mt-1 text-xs text-celis-destructive">
                              Reason: {listing.rejectionReason}
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {listing.status === "active" && featuredFeeCents > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setFeatureModal({ open: true, listingId: listing.id })
                          }
                        >
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          {listing.isFeatured ? "Extend feature" : "Feature"}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(listing.id)}
                        aria-label="Delete listing"
                      >
                        <Trash2 className="h-4 w-4 text-celis-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) =>
                navigate({ search: (prev) => ({ ...prev, page: p }) })
              }
            />
          </CardContent>
        </Card>
      </main>

      <PaymentModal
        open={featureModal.open}
        onOpenChange={(open) => setFeatureModal((m) => ({ ...m, open }))}
        userId={user?.id ?? ""}
        listingId={featureModal.listingId}
        amountCents={featuredFeeCents}
        featureListing
        onSuccess={() => {
          router.invalidate();
        }}
      />

      <SiteFooter />
    </div>
  );
}
