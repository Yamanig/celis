import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { PageHeader } from "~/components/admin/page-header";
import { ListingStatusBadge } from "~/components/admin/status-badge";
import { fetchListingById } from "~/server/listings.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";
import { getOptimizedImageUrl } from "~/lib/images";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/listings_/$id")({
  component: AdminListingDetailPage,
  head: () => ({
    meta: [
      { title: "Listing details | Admin | Celis" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ params }) => {
    const listing = await fetchListingById({ data: { id: params.id } });
    if (!listing) throw new Error("Listing not found");
    return { listing };
  },
});

function AdminListingDetailPage() {
  const { listing } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <PageHeader
        title={listing.title}
        description={`${listing.sellerName ?? "Seller"} - ${listing.categoryName}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/listings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {listing.status === "active" && (
              <Button asChild>
                <Link to="/listings/$id" params={{ id: listing.id }}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Public page
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="border-celis-border bg-celis-surface-base">
          <CardHeader>
            <CardTitle className="text-lg">Listing media</CardTitle>
          </CardHeader>
          <CardContent>
            {listing.images.length === 0 ? (
              <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-celis-border text-sm text-celis-ink-secondary">
                No images uploaded
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {listing.images.map((src, index) => (
                  <img
                    key={`${src}-${index}`}
                    src={getOptimizedImageUrl(src, {
                      width: 720,
                      height: 540,
                      quality: 80,
                    })}
                    alt={`${listing.title} image ${index + 1}`}
                    className="aspect-[4/3] w-full rounded-md border border-celis-border object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-celis-border bg-celis-surface-base">
            <CardHeader>
              <CardTitle className="text-lg">Moderation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-celis-ink-secondary">Status</span>
                <ListingStatusBadge status={listing.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-celis-ink-secondary">Posted</span>
                <span>{formatRelativeDate(listing.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-celis-ink-secondary">Reviewed</span>
                <span>
                  {listing.reviewedAt
                    ? formatRelativeDate(listing.reviewedAt)
                    : "Not reviewed"}
                </span>
              </div>
              {listing.rejectionReason && (
                <div className="rounded-md border border-celis-destructive/30 bg-celis-destructive-subtle p-3 text-celis-destructive">
                  {listing.rejectionReason}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-celis-border bg-celis-surface-base">
            <CardHeader>
              <CardTitle className="text-lg">Price and delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-celis-ink-secondary">Price</span>
                <span className="font-semibold">{formatPrice(listing.price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-celis-ink-secondary">Condition</span>
                <Badge variant="secondary">
                  {listing.condition.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-celis-ink-secondary">Delivery</span>
                <span>{listing.deliveryMethod.replace(/_/g, " ")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-celis-ink-secondary">Monetization</span>
                <span>{listing.monetizationType.replace(/_/g, " ")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-celis-border bg-celis-surface-base">
        <CardHeader>
          <CardTitle className="text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-celis-ink-secondary">
            {listing.description}
          </p>
        </CardContent>
      </Card>

      <Card className="border-celis-border bg-celis-surface-base">
        <CardHeader>
          <CardTitle className="text-lg">Seller</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-celis-ink-secondary">Name</p>
            <p className="font-medium">{listing.sellerName ?? "Unknown"}</p>
          </div>
          <div>
            <p className="text-celis-ink-secondary">Phone</p>
            <p className="font-medium">{listing.sellerPhone ?? "Not set"}</p>
          </div>
          <div>
            <p className="text-celis-ink-secondary">Type</p>
            <p className="font-medium">{listing.sellerType}</p>
          </div>
          <div>
            <p className="text-celis-ink-secondary">Verified</p>
            <p className="font-medium">{listing.sellerVerified ? "Yes" : "No"}</p>
          </div>
          {listing.businessName && (
            <div className="sm:col-span-2">
              <p className="text-celis-ink-secondary">Business</p>
              <p className="font-medium">{listing.businessName}</p>
            </div>
          )}
          {listing.businessAddress && (
            <div className="sm:col-span-2">
              <p className="text-celis-ink-secondary">Business address</p>
              <p className="font-medium">{listing.businessAddress}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
