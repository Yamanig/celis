import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { ImageGallery } from "~/components/listings/image-gallery";
import { SafetyTips } from "~/components/listings/safety-tips";
import { ListingGrid } from "~/components/listings/listing-grid";
import { useAuth } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "~/components/ui/dialog";
import { recordListingInteraction } from "~/server/listing-interactions.functions";
import {
  fetchListingById,
  fetchListingReviews,
  createListingReview,
  fetchSimilarListings,
} from "~/server/listings.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";
import {
  MapPin,
  Package,
  User,
  Store,
  CheckCircle2,
  Phone,
  PhoneCall,
  MessageCircle,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/listings/$id")({
  component: ListingDetailPage,
  loader: async ({ params }) => {
    const listing = await fetchListingById({ data: { id: params.id } });
    if (!listing || listing.status !== "active") {
      throw new Error("Listing not found");
    }
    const [reviews, similar] = await Promise.all([
      fetchListingReviews({ data: { id: params.id } }),
      fetchSimilarListings({
        data: { listingId: listing.id, categoryId: listing.categoryId },
      }),
    ]);
    return { listing, reviews, similar };
  },
  head: ({ loaderData }) => {
    const listing = loaderData?.listing;
    const description = listing
      ? `${listing.title} - ${formatPrice(listing.price)} on Celis`
      : "View this listing on Celis";
    const image = listing?.images?.[0];
    return {
      meta: [
        { title: `${listing?.title ?? "Listing"} | Celis` },
        { name: "description", content: description },
        { property: "og:title", content: listing?.title ?? "Listing" },
        { property: "og:description", content: description },
        ...(image ? [{ property: "og:image", content: image }] : []),
        { property: "og:type", content: "product" },
      ],
    };
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? "fill-celis-caution text-celis-caution"
              : "text-celis-border"
          }`}
        />
      ))}
    </div>
  );
}

function ListingDetailPage() {
  const { listing, reviews, similar } = Route.useLoaderData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [callbackPhone, setCallbackPhone] = useState(user?.phone ?? "");
  const [callbackDescription, setCallbackDescription] = useState("");
  const [callbackLoading, setCallbackLoading] = useState(false);
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [callbackSuccess, setCallbackSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [localReviews, setLocalReviews] = useState(reviews);

  const dialNumber = listing.sellerPhone ?? "";
  const whatsappNumber = dialNumber.replace(/\D/g, "");

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      await createListingReview({
        data: { listingId: listing.id, rating, comment },
      });
      const updated = await fetchListingReviews({ data: { id: listing.id } });
      setLocalReviews(updated);
      setRating(0);
      setComment("");
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setReviewLoading(false);
    }
  };

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

                {localReviews.count > 0 && (
                  <div className="flex items-center gap-2 text-sm text-celis-ink-secondary">
                    <StarRating rating={localReviews.average} />
                    <span>
                      {localReviews.average} ({localReviews.count} review
                      {localReviews.count === 1 ? "" : "s"})
                    </span>
                  </div>
                )}

                <div className="grid gap-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={async () => {
                      if (!user) {
                        navigate({
                          to: "/auth/sign-in",
                          search: { redirect: `/listings/${listing.id}` },
                        });
                        return;
                      }
                      setShowContact(true);
                      try {
                        await recordListingInteraction({
                          data: {
                            listingId: listing.id,
                            type: "show_contact",
                          },
                        });
                      } catch {
                        // ignore tracking errors
                      }
                    }}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    {showContact ? dialNumber || "No phone" : "Show contact"}
                  </Button>

                  {showContact && dialNumber && (
                    <>
                      <Button className="w-full" size="lg" asChild>
                        <a href={`tel:${dialNumber}`}>
                          <PhoneCall className="mr-2 h-4 w-4" />
                          Call {dialNumber}
                        </a>
                      </Button>
                      {whatsappNumber && (
                        <Button
                          className="w-full bg-celis-success text-celis-ink-inverse hover:bg-celis-success-hover"
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
                    </>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      if (!user) {
                        navigate({
                          to: "/auth/sign-in",
                          search: { redirect: `/listings/${listing.id}` },
                        });
                        return;
                      }
                      setCallbackOpen(true);
                    }}
                  >
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Request call back
                  </Button>
                </div>
              </CardContent>
            </Card>

            {listing.sellerType === "shop" && (
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-celis-primary-subtle">
                      {listing.businessLogoUrl ? (
                        <img
                          src={listing.businessLogoUrl}
                          alt={listing.businessName || "Shop"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Store className="h-6 w-6 text-celis-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {listing.businessName || "Shop"}
                      </p>
                      <p className="text-xs text-celis-ink-secondary">
                        Verified shop
                      </p>
                    </div>
                  </div>

                  {listing.businessAddress && (
                    <p className="flex items-start gap-2 text-sm text-celis-ink-secondary">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      {listing.businessAddress}
                    </p>
                  )}

                  {listing.shopSlug && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link
                        to="/shops/$shopSlug"
                        params={{ shopSlug: listing.shopSlug }}
                      >
                        Visit shop
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

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

            <SafetyTips />
          </section>
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">
            Reviews ({localReviews.count})
          </h2>

          {user ? (
            <Card className="mb-6">
              <CardContent className="space-y-4 p-6">
                <h3 className="font-medium">Rate this listing</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= (hoverRating || rating)
                              ? "fill-celis-caution text-celis-caution"
                              : "text-celis-border"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Share your experience (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                  />
                  {reviewError && (
                    <p className="text-sm text-celis-destructive">{reviewError}</p>
                  )}
                  <Button type="submit" disabled={rating < 1 || reviewLoading}>
                    {reviewLoading ? "Submitting..." : "Submit review"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-sm text-celis-ink-secondary">
                  <Button variant="ghost" asChild className="h-auto px-0 py-0">
                    <Link
                      to="/auth/sign-in"
                      search={{ redirect: `/listings/${listing.id}` }}
                    >
                      Sign in
                    </Link>
                  </Button>{" "}
                  to rate or review this listing.
                </p>
              </CardContent>
            </Card>
          )}

          {localReviews.count === 0 ? (
            <p className="text-celis-ink-secondary">No reviews yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {localReviews.reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-center justify-between">
                      <StarRating rating={review.rating} />
                      <span className="text-xs text-celis-ink-secondary">
                        {formatRelativeDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{review.reviewerName}</p>
                    {review.comment && (
                      <p className="text-sm text-celis-ink-secondary">
                        {review.comment}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Dialog open={callbackOpen} onOpenChange={setCallbackOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Request call back</DialogTitle>
            {callbackSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <p className="text-celis-ink-secondary">
                  Your request has been sent. The seller will call you back
                  soon.
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    setCallbackOpen(false);
                    setCallbackSuccess(false);
                    setCallbackDescription("");
                  }}
                >
                  Close
                </Button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCallbackLoading(true);
                  setCallbackError(null);
                  try {
                    await recordListingInteraction({
                      data: {
                        listingId: listing.id,
                        type: "request_callback",
                        phone: callbackPhone,
                        description: callbackDescription,
                      },
                    });
                    setCallbackSuccess(true);
                  } catch (err) {
                    setCallbackError(
                      err instanceof Error ? err.message : "Request failed"
                    );
                  } finally {
                    setCallbackLoading(false);
                  }
                }}
                className="space-y-4 py-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="callbackPhone">Your phone number</Label>
                  <Input
                    id="callbackPhone"
                    type="tel"
                    value={callbackPhone}
                    onChange={(e) => setCallbackPhone(e.target.value)}
                    placeholder="+252 61 234 5678"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callbackDescription">
                    Message (optional)
                  </Label>
                  <Textarea
                    id="callbackDescription"
                    value={callbackDescription}
                    onChange={(e) => setCallbackDescription(e.target.value)}
                    placeholder="When is the best time to call?"
                    rows={3}
                  />
                </div>
                {callbackError && (
                  <p className="text-sm text-celis-destructive">
                    {callbackError}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={callbackLoading}
                >
                  {callbackLoading ? "Sending..." : "Send request"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-semibold">Similar products</h2>
            <ListingGrid listings={similar} emptyMessage="No similar products found." />
          </section>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: listing.title,
              image: listing.images,
              description: listing.description,
              offers: {
                "@type": "Offer",
                priceCurrency: "USD",
                price: (listing.price / 100).toFixed(2),
                availability: "https://schema.org/InStock",
                url: typeof window !== "undefined" ? window.location.href : undefined,
              },
            }),
          }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
