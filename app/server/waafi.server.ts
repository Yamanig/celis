import { randomUUID } from "node:crypto";
import { getEnabledWaafiCredentials } from "./payment-gateways.server";
import {
  normalizeWaafiAccountNo,
  parseWaafiPurchaseResponse,
  type WaafiPurchaseResult,
} from "~/lib/waafi";

export interface WaafiPurchaseInput {
  accountNo: string;
  referenceId: string;
  invoiceId: string;
  amountCents: number;
  currency?: "USD";
  description: string;
}

export async function purchaseWithWaafi(input: WaafiPurchaseInput): Promise<WaafiPurchaseResult> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error("Payment amount must be a positive number of cents.");
  }
  const credentials = await getEnabledWaafiCredentials();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), credentials.timeoutSeconds * 1000);

  try {
    const response = await fetch(credentials.baseUrl, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        schemaVersion: "1.0",
        requestId: randomUUID(),
        timestamp: new Date().toISOString().replace("T", " ").replace("Z", ""),
        // Waafi's direct API_PURCHASE contract expects the merchant API channel.
        // "APP" is a webhook transaction-channel value, not a valid purchase channel.
        channelName: "WEB",
        serviceName: "API_PURCHASE",
        serviceParams: {
          merchantUid: credentials.merchantUid,
          apiUserId: credentials.apiUserId,
          apiKey: credentials.apiKey,
          paymentMethod: "MWALLET_ACCOUNT",
          payerInfo: { accountNo: normalizeWaafiAccountNo(input.accountNo) },
          transactionInfo: {
            referenceId: input.referenceId,
            invoiceId: input.invoiceId,
            amount: (input.amountCents / 100).toFixed(2),
            currency: input.currency ?? "USD",
            description: input.description,
          },
        },
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`WaafiPay returned HTTP ${response.status}.`);
    return parseWaafiPurchaseResponse(payload);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("WaafiPay request timed out; payment requires reconciliation before retry.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
