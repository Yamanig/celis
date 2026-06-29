import { ListingCard } from "./listing-card";
import type { ListingPublic } from "~/server/listings.server";

interface ListingGridProps {
  listings: ListingPublic[];
  emptyMessage?: string;
}

export function ListingGrid({
  listings,
  emptyMessage = "No listings found.",
}: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-celis-border p-12 text-center text-celis-ink-secondary">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
