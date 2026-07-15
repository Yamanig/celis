import { db } from "~/db";
import { orders, listings } from "~/db/schema";
import { eq } from "drizzle-orm";
import { CelisError } from "~/lib/errors";

export async function createOrder(input: {
  listingId: string;
  buyerId: string;
  sellerId: string;
  salePrice: number;
  shippingFee?: number;
}) {
  const [listing] = await db
    .select({
      commissionBps: listings.commissionBps,
      feeAmountCents: listings.feeAmountCents,
    })
    .from(listings)
    .where(eq(listings.id, input.listingId))
    .limit(1);

  if (!listing) {
    throw new CelisError("Listing not found", "LISTING_NOT_FOUND", 404);
  }

  // Snapshot commission at order creation using the listing's stored rate.
  const commissionBps = listing.commissionBps ?? 0;
  const commissionAmount = Math.round((input.salePrice * commissionBps) / 10_000);
  const shippingFee = input.shippingFee ?? 0;
  const platformFee = commissionAmount + (listing.feeAmountCents ?? 0);
  const netPayout = input.salePrice - platformFee - shippingFee;

  const [order] = await db
    .insert(orders)
    .values({
      listingId: input.listingId,
      buyerId: input.buyerId,
      sellerId: input.sellerId,
      status: "pending",
      salePrice: input.salePrice,
      shippingFee,
      commissionAmount,
      platformFee,
      netPayout,
    })
    .returning();

  return order;
}

export async function completeOrder(id: string) {
  const [order] = await db
    .update(orders)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(orders.id, id))
    .returning();

  if (!order) {
    throw new CelisError("Order not found", "ORDER_NOT_FOUND", 404);
  }

  // TODO: trigger seller payout and charge any unpaid commission here.
  return order;
}
