import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  initiateWalletPayment,
  getWalletPaymentByMerchantRef,
  confirmWalletPayment,
} from "./payments.server";
import { getListingFeeCents, getListingPricing } from "./config.server";
import { submitListingForReview } from "./listings.server";
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
});

export const initiatePayment = createServerFn({ method: "POST" })
  .validator(initiateSchema)
  .handler(async ({ data }) => {
    let amountCents = await getListingFeeCents();

    if (data.listingId) {
      const [listing] = await db
        .select({
          price: listings.price,
          condition: listings.condition,
          categoryId: listings.categoryId,
        })
        .from(listings)
        .where(eq(listings.id, data.listingId))
        .limit(1);
      if (listing) {
        const pricing = await getListingPricing(
          listing.price,
          listing.condition,
          listing.categoryId
        );
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

    return initiateWalletPayment(
      data.userId,
      data.listingId,
      data.orderId,
      data.provider,
      data.phone,
      amountCents
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
      await submitListingForReview(data.listingId);
    }
    return { success: true, payment: serializeWalletPayment(payment) };
  });
