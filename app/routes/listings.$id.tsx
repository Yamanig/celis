import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { ImageGallery } from "~/components/listings/image-gallery";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { fetchListingById } from "~/server/listings.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";
import {
  MapPin,
  Package,
  User,
  CheckCircle2,
  Phone,
  MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/listings/$id")({
  component: ListingDetailPage,
  loader: async ({ params }) => {
    const listing = await fetchListingById({ data: { id: params.id } });
    if (!listing) throw new Error("Listing not found");
    return { listing };
  },
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-celis-ink-secondary">
        <h1 className="text-2xl font-semibold text-celis-ink">Listing not found</h1>
        <p>{error.message}</p>
        <Button asChild>
          <Link to="/search">Browse listings</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  ),
});

function ListingDetailPage() {
  const { listing } = Route.useLoaderData();

  const dialNumber = listing.sellerPhone ?? "";
  const whatsappNumber = dialNumber.replace(/\D/g, "");

  return (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <section>
            <ImageGallery images={listing.images} title={listing.title} />
          </section>

          <section className="space-y-6">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{listing.categoryName}</Badge>
                <Badge variant="outline">
                  {listing.condition.replace(/_/g, " ")}
                </Badge>
              </div>
              <h1 className="text-2xl font-semibold leading-tight text-celis-ink sm:text-3xl">
                {listing.title}
              </h1>
              <p className="mt-2 text-3xl font-bold text-celis-primary">
                {formatPrice(listing.price)}
              </p>
              <p className="mt-1 text-sm text-celis-ink-secondary">
                Posted {formatRelativeDate(listing.createdAt)}
              </p>
            </div>

            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-celis-primary-subtle">
                    <User className="h-5 w-5 text-celis-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {listing.sellerName ?? "Seller"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-celis-ink-secondary">
                      {listing.sellerVerified && (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-celis-success" />
                          <span>Verified</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {dialNumber ? (
                  <div className="grid gap-2">
                    <Button className="w-full" size="lg" asChild>
                      <a href={`tel:${dialNumber}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call {dialNumber}
                      </a>
                    </Button>
                    {whatsappNumber && (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                        asChild
                      >
                        <a
                          href={`https://wa.me/${whatsappNumber}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp seller
                        </a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-celis-ink-secondary">
                    Seller has not added a phone number.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-6">
                <h2 className="font-semibold">Details</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-celis-ink-secondary">
                    <Package className="h-4 w-4" />
                    <span>
                      Delivery: {listing.deliveryMethod.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-celis-ink-secondary">
                    <MapPin className="h-4 w-4" />
                    <span>Location: seller&apos;s area</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-6">
                <h2 className="font-semibold">Description</h2>
                <p className="whitespace-pre-wrap text-celis-ink-secondary">
                  {listing.description}
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
