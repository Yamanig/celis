import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { formatPrice, formatRelativeDate } from "~/lib/format";
import type { ListingPublic } from "~/server/listings.server";

interface ListingCardProps {
  listing: ListingPublic;
}

export function ListingCard({ listing }: ListingCardProps) {
  const cover = listing.images[0] ?? "/placeholder.svg";

  return (
    <Link to="/listings/$id" params={{ id: listing.id }} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="aspect-[4/3] overflow-hidden bg-celis-surface-inset">
          <img
            src={cover}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
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
