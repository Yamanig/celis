import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { ImageGallery } from "~/components/listings/image-gallery";
import { useAuth } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import {
  fetchListingById,
  fetchListingReviews,
  createListingReview,
} from "~/server/listings.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";
import {
  MapPin,
  Package,
  User,
  CheckCircle2,
  Phone,
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
    const reviews = await fetchListingReviews({ data: { id: params.id } });
    return { listing, reviews };
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
  const { listing, reviews } = Route.useLoaderData();
  const { user } = useAuth();
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
      </main>

      <SiteFooter />
    </div>
  );
}
