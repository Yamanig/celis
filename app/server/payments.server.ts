import { eq } from "drizzle-orm";
import { db } from "~/db";
import { listings, walletPayments } from "~/db/schema";
import type { WalletProvider } from "~/db/schema";
import { CelisError } from "~/lib/errors";
import { normalizeWaafiAccountNo } from "~/lib/waafi";
import { purchaseWithWaafi } from "./waafi.server";

export type PaymentPurpose = "listing_fee" | "feature_listing" | "order";
export type PaymentFlowStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "pending_reconciliation";

export interface PaymentInitResult {
  merchantRef: string;
  status: PaymentFlowStatus;
  providerRef?: string;
  message?: string;
}

function resultFromRow(row: typeof walletPayments.$inferSelect): PaymentInitResult {
  return {
    merchantRef: row.merchantRef,
    status: row.status as PaymentFlowStatus,
    providerRef: row.walletRef ?? undefined,
    message: row.providerError ?? undefined,
  };
}

export async function initiateWalletPayment(
  userId: string,
  listingId: string | null,
  orderId: string | null,
  provider: WalletProvider,
  phone: string,
  amountCents: number,
  purpose: PaymentPurpose = "listing_fee",
  idempotencyKey?: string
): Promise<PaymentInitResult> {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new CelisError("Payment amount is invalid", "PAYMENT_AMOUNT_INVALID", 422);
  }
  if (provider === "premier") {
    throw new CelisError("Premier Wallet is not connected yet", "PAYMENT_PROVIDER_UNAVAILABLE", 422);
  }

  if (idempotencyKey) {
    const [existing] = await db
      .select()
      .from(walletPayments)
      .where(eq(walletPayments.idempotencyKey, idempotencyKey))
      .limit(1);
    if (existing) {
      if (existing.userId !== userId || existing.listingId !== listingId || existing.amount !== amountCents) {
        throw new CelisError("Payment key conflicts with another request", "PAYMENT_IDEMPOTENCY_CONFLICT", 409);
      }
      return resultFromRow(existing);
    }
  }

  const merchantRef = `celis-${crypto.randomUUID()}`;
  const invoiceId = listingId ? `listing-${listingId}` : orderId ? `order-${orderId}` : merchantRef;
  const normalizedPhone = normalizeWaafiAccountNo(phone);

  await db.insert(walletPayments).values({
    userId,
    listingId,
    orderId,
    walletProvider: provider,
    amount: amountCents,
    merchantRef,
    idempotencyKey: idempotencyKey ?? null,
    invoiceId,
    customerPhone: normalizedPhone,
    status: "processing",
    purpose,
  });

  try {
    const response = await purchaseWithWaafi({
      accountNo: normalizedPhone,
      referenceId: merchantRef,
      invoiceId,
      amountCents,
      currency: "USD",
      description:
        purpose === "feature_listing"
          ? "Celis featured listing fee"
          : purpose === "listing_fee"
            ? "Celis listing fee"
            : "Celis order payment",
    });

    const amountMatches = response.amountCents === amountCents;
    const status: PaymentFlowStatus = response.approved && amountMatches
      ? "completed"
      : response.approved
        ? "pending_reconciliation"
        : "failed";
    const message = response.approved && !amountMatches
      ? "Provider approved a different amount; payment requires reconciliation."
      : response.approved
        ? null
        : response.responseMessage ?? "WaafiPay did not approve the payment.";

    await db.transaction(async (tx) => {
      await tx.update(walletPayments).set({
        status,
        walletRef: response.transactionId,
        providerResponseCode: response.responseCode,
        providerState: response.state,
        providerError: message,
        callbackPayload: {
          transactionId: response.transactionId,
          issuerTransactionId: response.issuerTransactionId,
          amountCents: response.amountCents,
          merchantChargesCents: response.merchantChargesCents,
        },
        callbackReceivedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(walletPayments.merchantRef, merchantRef));

      if (status === "completed" && purpose === "listing_fee" && listingId) {
        await tx.update(listings).set({
          status: "pending_review",
          monetizationStatus: "active",
          updatedAt: new Date(),
        }).where(eq(listings.id, listingId));
      }
    });

    return {
      merchantRef,
      status,
      providerRef: response.transactionId ?? undefined,
      message: message ?? undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "WaafiPay request failed.";
    const ambiguous = /timed out|reconciliation/i.test(message);
    const status: PaymentFlowStatus = ambiguous ? "pending_reconciliation" : "failed";
    await db
      .update(walletPayments)
      .set({ status, providerError: message, updatedAt: new Date() })
      .where(eq(walletPayments.merchantRef, merchantRef));
    return { merchantRef, status, message };
  }
}

export async function getWalletPaymentByMerchantRef(merchantRef: string) {
  const [payment] = await db
    .select()
    .from(walletPayments)
    .where(eq(walletPayments.merchantRef, merchantRef))
    .limit(1);
  return payment;
}
