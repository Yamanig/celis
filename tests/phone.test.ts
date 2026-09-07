import assert from "node:assert/strict";
import test from "node:test";
import {
  toE164,
  isE164,
  normalizeE164,
  phoneToSyntheticEmail,
  isSyntheticEmail,
  formatE164ForDisplay,
} from "../app/lib/phone";
import { e164PhoneSchema, otpSchema } from "../app/lib/validation";

test("toE164 joins dial code + national number, dropping the trunk zero", () => {
  assert.equal(toE164("+252", "61 234 5678"), "+252612345678");
  assert.equal(toE164("252", "061 234 5678"), "+252612345678");
  assert.equal(toE164("+254", "0712345678"), "+254712345678");
});

test("isE164 accepts strict E.164 only", () => {
  assert.equal(isE164("+252612345678"), true);
  assert.equal(isE164("252612345678"), false);
  assert.equal(isE164("+252 61 234 5678"), false);
  assert.equal(isE164("+0612345678"), false);
});

test("normalizeE164 tolerates common input formats", () => {
  assert.equal(normalizeE164("+252612345678"), "+252612345678");
  assert.equal(normalizeE164("00252612345678"), "+252612345678");
  assert.equal(normalizeE164("252 612 345 678"), "+252612345678");
  assert.equal(normalizeE164("(252) 61-234-5678"), "+252612345678");
  assert.equal(normalizeE164("garbage"), null);
});

test("synthetic email helpers", () => {
  assert.equal(phoneToSyntheticEmail("+252612345678"), "252612345678@celis.so");
  assert.equal(isSyntheticEmail("252612345678@celis.so"), true);
  assert.equal(isSyntheticEmail("ahmed@gmail.com"), false);
  assert.equal(isSyntheticEmail(null), false);
});

test("formatE164ForDisplay groups the number", () => {
  assert.equal(formatE164ForDisplay("+252612345678"), "+252 61 234 5678");
  assert.equal(formatE164ForDisplay("not-a-number"), "not-a-number");
});

test("validation schemas", () => {
  assert.equal(e164PhoneSchema.safeParse("+252612345678").success, true);
  assert.equal(e164PhoneSchema.safeParse("252612345678").success, false);
  assert.equal(otpSchema.safeParse("123456").success, true);
  assert.equal(otpSchema.safeParse("12345").success, false);
  assert.equal(otpSchema.safeParse("abcdef").success, false);
});
