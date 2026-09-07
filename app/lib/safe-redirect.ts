/**
 * Validate a post-auth `redirect` value taken from a query string before it is
 * handed to `navigate()` / `redirect()`.
 *
 * Without this an attacker can craft `/auth/sign-in?redirect=https://evil.example`
 * (or `//evil.example`, or `/\evil.example`) and bounce a freshly authenticated
 * user off-site (open redirect — SEC-9). Only same-origin absolute paths are
 * allowed; anything else falls back to a safe default.
 */
export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  // Must start with a single "/" and not "//" or "/\" (protocol-relative URLs),
  // and contain only characters valid in a path/query fragment.
  if (!/^\/(?![/\\])[A-Za-z0-9\-._~!$&'()*+,;=:@/?%#[\]]*$/.test(value)) {
    return fallback;
  }
  return value;
}
