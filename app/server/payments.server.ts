import { db } from "~/db";
import { walletPayments } from "~/db/schema";
import { eq } from "drizzle-orm";
import { CelisError } from "~/lib/errors";
import type { WalletProvider } from "~/db/schema";

export interface PaymentRequest {
  provider: WalletProvider;
  phone: string;
  amount: number; // cents
  merchantRef: string;
  description: string;
}

export interface PaymentInitResult {
  merchantRef: string;
  status: "pending" | "initiated" | "failed";
  prompt?: string;
  providerRef?: string;
}

async function stubInitiate(req: PaymentRequest): Promise<PaymentInitResult> {
  // Stub provider: in production this calls EVC/Premier/edahab API.
  return {
    merchantRef: req.merchantRef,
    status: "pending",
    prompt: `Approve ${req.amount / 100} USD payment on ${req.provider} for ${req.phone}`,
    providerRef: `stub-${req.merchantRef}`,
  };
}

export async function initiateWalletPayment(
  userId: string,
  listingId: string | null,
  orderId: string | null,
  provider: WalletProvider,
  phone: string,
  amountCents: number
): Promise<PaymentInitResult> {
  const merchantRef = `celis-${crypto.randomUUID()}`;

  await db.insert(walletPayments).values({
    userId,
    listingId,
    orderId,
    walletProvider: provider,
    amount: amountCents,
    merchantRef,
    customerPhone: phone,
    status: "pending",
  });

  return stubInitiate({
    provider,
    phone,
    amount: amountCents,
    merchantRef,
    description: listingId ? "Celis listing fee" : "Celis order payment",
  });
}

export async function getWalletPaymentByMerchantRef(merchantRef: string) {
  const [payment] = await db
    .select()
    .from(walletPayments)
    .where(eq(walletPayments.merchantRef, merchantRef))
    .limit(1);
  return payment;
}

export async function confirmWalletPayment(merchantRef: string) {
  const [payment] = await db
    .update(walletPayments)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(walletPayments.merchantRef, merchantRef))
    .returning();
  if (!payment) {
    throw new CelisError("Payment not found", "PAYMENT_NOT_FOUND", 404);
  }
  return payment;
}
