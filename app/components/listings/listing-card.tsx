import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { formatPrice, formatRelativeDate } from "~/lib/format";
import { getOptimizedImageUrl } from "~/lib/images";
import { Sparkles } from "lucide-react";
import type { ListingPublic } from "~/server/listings.server";

interface ListingCardProps {
  listing: ListingPublic;
}

export function ListingCard({ listing }: ListingCardProps) {
  const cover = listing.images[0] ?? "/placeholder.svg";
  const [loaded, setLoaded] = useState(false);

  return (
    <Link to="/listings/$id" params={{ id: listing.id }} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-[4/3] overflow-hidden bg-celis-surface-inset">
          {!loaded && <Skeleton className="h-full w-full rounded-none" />}
          <img
            src={getOptimizedImageUrl(cover, { width: 640, height: 480 })}
            alt={listing.title}
            className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
              loaded ? "opacity-100" : "hidden opacity-0"
            }`}
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            onLoad={() => setLoaded(true)}
          />
          {listing.isFeatured && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-celis-caution px-2 py-1 text-xs font-medium text-celis-ink">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-medium leading-snug text-celis-ink">
              {listing.title}
            </h3>
          </div>
          <p className="text-lg font-semibold text-celis-primary">
            {formatPrice(listing.price)}
          </p>
          <div className="flex items-center justify-between text-xs text-celis-ink-secondary">
            <Badge variant="secondary" className="font-normal">
              {listing.categoryName}
            </Badge>
            <span>{formatRelativeDate(listing.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
