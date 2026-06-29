import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  initiateWalletPayment,
  getWalletPaymentByMerchantRef,
  confirmWalletPayment,
} from "./payments.server";
import { getListingFeeCents, getListingPricing } from "./config.server";
import { activateListing } from "./listings.server";
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
        .select({ price: listings.price, condition: listings.condition })
        .from(listings)
        .where(eq(listings.id, data.listingId))
        .limit(1);
      if (listing) {
        const pricing = await getListingPricing(
          listing.price,
          listing.condition
        );
        amountCents = pricing.feeCents;
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
      await activateListing(data.listingId);
    }
    return { success: true, payment: serializeWalletPayment(payment) };
  });
