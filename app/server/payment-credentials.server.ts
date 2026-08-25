import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";

function encryptionKey(): Buffer {
  const secret = process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error(
      "PAYMENT_CREDENTIALS_ENCRYPTION_KEY must be configured with at least 32 characters."
    );
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptPaymentCredential(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptPaymentCredential(payload: string): string {
  const [version, ivValue, tagValue, ciphertextValue] = payload.split(".");
  if (version !== VERSION || !ivValue || !tagValue || !ciphertextValue) {
    throw new Error("Stored payment credential has an invalid format.");
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    encryptionKey(),
    Buffer.from(ivValue, "base64url")
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskPaymentCredential(value: string): string {
  if (value.length <= 4) return "••••";
  return `••••${value.slice(-4)}`;
}
