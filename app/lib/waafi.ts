export const WAAFI_SANDBOX_URL = "https://sandbox.waafipay.net/asm";
export const WAAFI_PRODUCTION_URL = "https://api.waafipay.net/asm";

export interface WaafiPurchaseResult {
  approved: boolean;
  responseCode: string | null;
  responseMessage: string | null;
  state: string | null;
  transactionId: string | null;
  issuerTransactionId: string | null;
  amountCents: number | null;
  merchantChargesCents: number | null;
}

function moneyToCents(value: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

export function normalizeWaafiAccountNo(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith("252")) digits = `252${digits}`;
  if (!/^252\d{8,10}$/.test(digits)) {
    throw new Error("Enter a valid Somali wallet number.");
  }
  return digits;
}

export function parseWaafiPurchaseResponse(payload: unknown): WaafiPurchaseResult {
  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const params = body.params && typeof body.params === "object"
    ? (body.params as Record<string, unknown>)
    : {};
  const responseCode = typeof body.responseCode === "string" ? body.responseCode : null;
  const state = typeof params.state === "string" ? params.state.toUpperCase() : null;
  const transactionId = typeof params.transactionId === "string" ? params.transactionId : null;

  return {
    approved: responseCode === "2001" && state === "APPROVED" && Boolean(transactionId),
    responseCode,
    responseMessage: typeof body.responseMsg === "string" ? body.responseMsg : null,
    state,
    transactionId,
    issuerTransactionId:
      typeof params.issuerTransactionId === "string" ? params.issuerTransactionId : null,
    amountCents: moneyToCents(params.txAmount),
    merchantChargesCents: moneyToCents(params.merchantCharges),
  };
}
