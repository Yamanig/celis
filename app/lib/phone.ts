/**
 * Phone-number helpers for the WhatsApp-OTP auth flow.
 *
 * Supabase Auth requires strict E.164 (`+2526XXXXXXXX` — a leading `+`, then
 * digits only, no spaces or punctuation). The auth screens collect a dial code
 * and a national number separately; `toE164` joins and normalises them.
 *
 * Kept deliberately in sync with `celis mobile/lib/phone.ts` so both apps treat
 * the same number identically.
 */

export const SYNTHETIC_EMAIL_DOMAIN = "celis.so";

/** Join a dial code (`+252` / `252`) and a national number into strict E.164. */
export function toE164(dialCode: string, national: string): string {
  const cc = dialCode.replace(/\D/g, "");
  // People write "061 234 5678" for "+252 61 234 5678" — drop the trunk zero(s).
  const nn = national.replace(/\D/g, "").replace(/^0+/, "");
  return `+${cc}${nn}`;
}

/** True when `value` is already strict E.164 (8–15 digits after the `+`). */
export function isE164(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

/**
 * Normalise any user-entered phone string to E.164, or return null if it cannot
 * be. Accepts `+252...`, `00252...`, and bare digit strings.
 */
export function normalizeE164(value: string): string | null {
  const trimmed = value.trim();
  let digits = trimmed.replace(/[\s()-]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  digits = digits.replace(/\D/g, "");
  const candidate = `+${digits}`;
  return isE164(candidate) ? candidate : null;
}

/** The synthetic address attached to phone-only accounts (`252612345678@celis.so`). */
export function phoneToSyntheticEmail(e164: string): string {
  return `${e164.replace(/\D/g, "")}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/** True when an email is the synthetic placeholder, not a real inbox. */
export function isSyntheticEmail(email: string | null | undefined): boolean {
  return (
    typeof email === "string" &&
    email.toLowerCase().endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`)
  );
}

/** `+252612345678` -> `+252 61 234 5678` for display. Falls back to the input. */
export function formatE164ForDisplay(e164: string): string {
  const match = /^\+(\d{1,3})(\d{2})(\d{3})(\d+)$/.exec(e164.trim());
  if (!match) return e164;
  return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
}
