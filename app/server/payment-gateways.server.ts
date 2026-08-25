import { eq } from "drizzle-orm";
import { db } from "~/db";
import { auditLogs, paymentGateways } from "~/db/schema";
import { requirePermission } from "./auth.server";
import {
  decryptPaymentCredential,
  encryptPaymentCredential,
  maskPaymentCredential,
} from "./payment-credentials.server";
import { WAAFI_SANDBOX_URL } from "~/lib/waafi";

export const WAAFI_PROVIDER = "waafi";

export interface WaafiGatewayInput {
  enabled: boolean;
  environment: "sandbox" | "production";
  baseUrl: string;
  merchantUid?: string;
  apiUserId?: string;
  apiKey?: string;
  timeoutSeconds: number;
}

export interface WaafiGatewayCredentials {
  baseUrl: string;
  merchantUid: string;
  apiUserId: string;
  apiKey: string;
  timeoutSeconds: number;
  environment: "sandbox" | "production";
}

export async function getAdminWaafiGateway() {
  await requirePermission("settings:manage");
  const [row] = await db
    .select()
    .from(paymentGateways)
    .where(eq(paymentGateways.provider, WAAFI_PROVIDER))
    .limit(1);

  if (!row) {
    return {
      configured: false,
      enabled: false,
      environment: "sandbox" as const,
      baseUrl: WAAFI_SANDBOX_URL,
      merchantUidMasked: null,
      apiUserIdMasked: null,
      apiKeyMasked: null,
      timeoutSeconds: 30,
      updatedAt: null,
    };
  }

  return {
    configured: true,
    enabled: row.enabled,
    environment: row.environment === "production" ? ("production" as const) : ("sandbox" as const),
    baseUrl: row.baseUrl,
    merchantUidMasked: maskPaymentCredential(decryptPaymentCredential(row.merchantUidEncrypted)),
    apiUserIdMasked: maskPaymentCredential(decryptPaymentCredential(row.apiUserIdEncrypted)),
    apiKeyMasked: maskPaymentCredential(decryptPaymentCredential(row.apiKeyEncrypted)),
    timeoutSeconds: row.timeoutSeconds,
    updatedAt: row.updatedAt,
  };
}

export async function saveAdminWaafiGateway(input: WaafiGatewayInput) {
  const admin = await requirePermission("settings:manage");
  const [existing] = await db
    .select()
    .from(paymentGateways)
    .where(eq(paymentGateways.provider, WAAFI_PROVIDER))
    .limit(1);

  if (!existing && (!input.merchantUid || !input.apiUserId || !input.apiKey)) {
    throw new Error("Merchant UID, API User ID, and API Key are required for first-time setup.");
  }

  const merchantUidEncrypted = input.merchantUid
    ? encryptPaymentCredential(input.merchantUid.trim())
    : existing!.merchantUidEncrypted;
  const apiUserIdEncrypted = input.apiUserId
    ? encryptPaymentCredential(input.apiUserId.trim())
    : existing!.apiUserIdEncrypted;
  const apiKeyEncrypted = input.apiKey
    ? encryptPaymentCredential(input.apiKey.trim())
    : existing!.apiKeyEncrypted;

  return db.transaction(async (tx) => {
    const [saved] = await tx
      .insert(paymentGateways)
      .values({
        provider: WAAFI_PROVIDER,
        enabled: input.enabled,
        environment: input.environment,
        baseUrl: input.baseUrl,
        merchantUidEncrypted,
        apiUserIdEncrypted,
        apiKeyEncrypted,
        timeoutSeconds: input.timeoutSeconds,
        updatedBy: admin.id,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: paymentGateways.provider,
        set: {
          enabled: input.enabled,
          environment: input.environment,
          baseUrl: input.baseUrl,
          merchantUidEncrypted,
          apiUserIdEncrypted,
          apiKeyEncrypted,
          timeoutSeconds: input.timeoutSeconds,
          updatedBy: admin.id,
          updatedAt: new Date(),
        },
      })
      .returning({ id: paymentGateways.id, updatedAt: paymentGateways.updatedAt });

    await tx.insert(auditLogs).values({
      actorId: admin.id,
      action: existing ? "payment_gateway_updated" : "payment_gateway_created",
      resourceType: "payment_gateway",
      resourceId: saved.id,
      metadata: {
        provider: WAAFI_PROVIDER,
        enabled: input.enabled,
        environment: input.environment,
        credentialsChanged: Boolean(input.merchantUid || input.apiUserId || input.apiKey),
      },
    });

    return { configured: true, id: saved.id, updatedAt: saved.updatedAt };
  });
}

export async function getEnabledWaafiCredentials(): Promise<WaafiGatewayCredentials> {
  const [row] = await db
    .select()
    .from(paymentGateways)
    .where(eq(paymentGateways.provider, WAAFI_PROVIDER))
    .limit(1);
  if (!row?.enabled) throw new Error("WaafiPay is not configured or enabled.");

  return {
    baseUrl: row.baseUrl,
    merchantUid: decryptPaymentCredential(row.merchantUidEncrypted),
    apiUserId: decryptPaymentCredential(row.apiUserIdEncrypted),
    apiKey: decryptPaymentCredential(row.apiKeyEncrypted),
    timeoutSeconds: row.timeoutSeconds,
    environment: row.environment === "production" ? "production" : "sandbox",
  };
}
