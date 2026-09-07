/**
 * Serialize an object for embedding in an inline `<script type="application/ld+json">`
 * tag via `dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` does not escape `<`, `>`, `&`, or the Unicode line separators
 * (U+2028 / U+2029), so a string value containing `</script><img src=x
 * onerror=...>` breaks out of the script element (stored XSS — SEC-6). Any
 * consumer of user-controlled content (listing titles, descriptions, seller
 * names) must render JSON-LD through this helper.
 */

// Characters that are legal in a JSON string but unsafe inside an inline
// <script> element, mapped to their \uXXXX escape.
const UNSAFE = new RegExp("[<>&\\u2028\\u2029]", "g");

export function renderJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(UNSAFE, (char) => {
    const code = char.charCodeAt(0).toString(16).padStart(4, "0");
    return "\\u" + code;
  });
}
