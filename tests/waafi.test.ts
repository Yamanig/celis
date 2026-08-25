import assert from "node:assert/strict";
import test from "node:test";
import { normalizeWaafiAccountNo, parseWaafiPurchaseResponse } from "../app/lib/waafi";
import { decryptPaymentCredential, encryptPaymentCredential } from "../app/server/payment-credentials.server";

test("normalizes common Somali wallet formats", () => {
  assert.equal(normalizeWaafiAccountNo("061 234 5678"), "252612345678");
  assert.equal(normalizeWaafiAccountNo("+252 61 234 5678"), "252612345678");
  assert.equal(normalizeWaafiAccountNo("00252 61 234 5678"), "252612345678");
});

test("rejects malformed wallet numbers", () => {
  assert.throws(() => normalizeWaafiAccountNo("123"), /valid Somali wallet number/);
});

test("requires response code, APPROVED state, and transaction id", () => {
  const approved = parseWaafiPurchaseResponse({
    responseCode: "2001",
    responseMsg: "Success",
    params: { state: "APPROVED", transactionId: "TX-1", txAmount: "1.00", merchantCharges: "0.02" },
  });
  assert.equal(approved.approved, true);
  assert.equal(approved.amountCents, 100);
  assert.equal(approved.merchantChargesCents, 2);
  assert.equal(parseWaafiPurchaseResponse({ responseCode: "2001", params: { state: "FAILED", transactionId: "TX-2" } }).approved, false);
  assert.equal(parseWaafiPurchaseResponse({ responseCode: "2001", params: { state: "APPROVED" } }).approved, false);
});

test("payment credential encryption round-trips and uses a random nonce", () => {
  process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY = "test-only-payment-key-that-is-long-enough";
  const first = encryptPaymentCredential("secret-value");
  const second = encryptPaymentCredential("secret-value");
  assert.notEqual(first, second);
  assert.equal(decryptPaymentCredential(first), "secret-value");
  assert.equal(decryptPaymentCredential(second), "secret-value");
});
