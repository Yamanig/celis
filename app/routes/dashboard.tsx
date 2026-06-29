import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { useAuth } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { fetchSellerListings, removeListing } from "~/server/listings.functions";
import { formatPrice } from "~/lib/format";
import { Trash2, Package, Store } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/auth/sign-in", search: { redirect: "/dashboard" } });
    }
    if (context.user.role === "admin") {
      throw redirect({ to: "/admin" });
    }
  },
  loader: async () => {
    return fetchSellerListings();
  },
});

function DashboardPage() {
  const { user } = useAuth();
  const initialListings = Route.useLoaderData();
  const [listings, setListings] = useState(initialListings);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    await removeListing({ data: { id } });
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  const activeCount = listings.filter((l) => l.status === "active").length;

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
                {listings.length}
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
                    className="flex items-center justify-between py-4"
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
                        <Badge
                          variant={
                            listing.status === "active" ? "default" : "secondary"
                          }
                          className="mt-1 text-xs"
                        >
                          {listing.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(listing.id)}
                      aria-label="Delete listing"
                    >
                      <Trash2 className="h-4 w-4 text-celis-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
