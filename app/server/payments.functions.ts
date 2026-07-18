import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  initiateWalletPayment,
  getWalletPaymentByMerchantRef,
  confirmWalletPayment,
  failWalletPayment,
} from "./payments.server";
import {
  getListingFeeCents,
  getListingPricing,
  getFeaturedListingFeeCents,
} from "./config.server";
import { submitListingForReview, featureListing } from "./listings.server";
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
    customerPhone: payment.customerPhone,
    status: payment.status,
    callbackReceivedAt: payment.callbackReceivedAt,
    retryCount: payment.retryCount,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

const initiateSchema = z.object({
  userId: z.string().uuid(),
  listingId: z.string().uuid().nullable(),
  orderId: z.string().uuid().nullable(),
  provider: z.enum(WALLET_PROVIDERS),
  phone: z.string().min(1),
  featureListing: z.boolean().optional().default(false),
});

export const initiatePayment = createServerFn({ method: "POST" })
  .validator(initiateSchema)
  .handler(async ({ data }) => {
    let amountCents = await getListingFeeCents();

    if (data.listingId) {
      const [listing] = await db
        .select({
          price: listings.price,
          categoryId: listings.categoryId,
        })
        .from(listings)
        .where(eq(listings.id, data.listingId))
        .limit(1);
      if (listing) {
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

    return initiateWalletPayment(
      data.userId,
      data.listingId,
      data.orderId,
      data.provider,
      data.phone,
      amountCents,
      data.featureListing ? "feature_listing" : data.orderId ? "order" : "listing_fee"
    );
  });

const statusSchema = z.object({ merchantRef: z.string().min(1) });

export const getPaymentStatus = createServerFn({ method: "GET" })
  .validator(statusSchema)
  .handler(async ({ data }) => {
    const payment = await getWalletPaymentByMerchantRef(data.merchantRef);
    return payment ? serializeWalletPayment(payment) : null;
  });

const confirmSchema = z.object({
  merchantRef: z.string().min(1),
  listingId: z.string().uuid().optional(),
});

export const simulateConfirmPayment = createServerFn({ method: "POST" })
  .validator(confirmSchema)
  .handler(async ({ data }) => {
    const payment = await confirmWalletPayment(data.merchantRef);
    if (data.listingId && payment.listingId === data.listingId) {
      if (payment.purpose === "feature_listing") {
        const { getCurrentUser } = await import("./auth.server");
        const user = await getCurrentUser();
        if (!user) throw new Error("Unauthorized");
        await featureListing(data.listingId, user.id, payment.amount);
      } else {
        await submitListingForReview(data.listingId);
      }
    }
    return { success: true, payment: serializeWalletPayment(payment) };
  });

const failSchema = z.object({
  merchantRef: z.string().min(1),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});

export const simulateFailPayment = createServerFn({ method: "POST" })
  .validator(failSchema)
  .handler(async ({ data }) => {
    const payment = await failWalletPayment(data.merchantRef, {
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
    });
    if (!payment) {
      throw new Error("Payment not found");
    }
    return { success: true, payment: serializeWalletPayment(payment) };
  });
