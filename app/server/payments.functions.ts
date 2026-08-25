import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  initiateWalletPayment,
  getWalletPaymentByMerchantRef,
} from "./payments.server";
import {
  getListingFeeCents,
  getListingPricing,
  getFeaturedListingFeeCents,
} from "./config.server";
import { featureListing } from "./listings.server";
import { db } from "~/db";
import { listings } from "~/db/schema";
import { eq } from "drizzle-orm";
import { WALLET_PROVIDERS } from "~/db/schema";
import type { walletPayments } from "~/db/schema";

type WalletPaymentRow = typeof walletPayments.$inferSelect;

function serializeWalletPayment(payment: WalletPaymentRow) {
  return {
    id: payment.id,
    userId: payment.userId,
    orderId: payment.orderId,
    listingId: payment.listingId,
    walletProvider: payment.walletProvider,
    amount: payment.amount,
    currency: payment.currency,
    walletRef: payment.walletRef,
    merchantRef: payment.merchantRef,
    idempotencyKey: payment.idempotencyKey,
    invoiceId: payment.invoiceId,
    customerPhone: payment.customerPhone,
    status: payment.status,
    providerResponseCode: payment.providerResponseCode,
    providerState: payment.providerState,
    providerError: payment.providerError,
    callbackReceivedAt: payment.callbackReceivedAt,
    retryCount: payment.retryCount,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

const initiateSchema = z.object({
  userId: z.string().uuid().optional(),
  listingId: z.string().uuid().nullable(),
  orderId: z.string().uuid().nullable(),
  provider: z.enum(WALLET_PROVIDERS),
  phone: z.string().min(1),
  featureListing: z.boolean().optional().default(false),
  idempotencyKey: z.string().min(16).max(160).optional(),
});

export const initiatePayment = createServerFn({ method: "POST" })
  .validator(initiateSchema)
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    let amountCents = await getListingFeeCents();

    if (data.listingId) {
      const [listing] = await db
        .select({
          price: listings.price,
          categoryId: listings.categoryId,
          sellerId: listings.sellerId,
        })
        .from(listings)
        .where(eq(listings.id, data.listingId))
        .limit(1);
      if (listing) {
        if (listing.sellerId !== user.id) throw new Error("Forbidden");
        if (data.featureListing) {
          amountCents = await getFeaturedListingFeeCents();
        } else {
          const pricing = await getListingPricing(listing.price, listing.categoryId);
          amountCents = pricing.feeCents;

          // Snapshot the pricing inputs/outputs on the listing so the fee
          // cannot change between payment and approval, and reconciliation
          // is possible.
          const monetizationType: "fixed_rate" | "commission" =
            pricing.monetizationModel === "fixed_only" ? "fixed_rate" : "commission";
          await db
            .update(listings)
            .set({
              feeAmountCents: pricing.feeCents,
              commissionBps: pricing.commissionBps,
              currency: pricing.currency,
              expiresAt: pricing.expiresAt,
              appliedFeeRuleId: pricing.appliedFeeRuleId,
              monetizationType,
              updatedAt: new Date(),
            })
            .where(eq(listings.id, data.listingId));
        }
      }
    }

    const result = await initiateWalletPayment(
      user.id,
      data.listingId,
      data.orderId,
      data.provider,
      data.phone,
      amountCents,
      data.featureListing ? "feature_listing" : data.orderId ? "order" : "listing_fee",
      data.idempotencyKey
    );

    if (result.status === "completed" && data.listingId) {
      if (data.featureListing) {
        await featureListing(data.listingId, user.id, amountCents);
      }
    }

    return result;
  });

const statusSchema = z.object({ merchantRef: z.string().min(1) });

export const getPaymentStatus = createServerFn({ method: "GET" })
  .validator(statusSchema)
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    const payment = await getWalletPaymentByMerchantRef(data.merchantRef);
    if (payment && payment.userId !== user.id) throw new Error("Forbidden");
    return payment ? serializeWalletPayment(payment) : null;
  });

