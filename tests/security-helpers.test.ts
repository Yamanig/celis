import assert from "node:assert/strict";
import test from "node:test";
import { safeInternalPath } from "../app/lib/safe-redirect";
import { renderJsonLd } from "../app/lib/json-ld";
import { escapeCsvCell } from "../app/lib/csv";

test("safeInternalPath keeps genuine internal paths", () => {
  assert.equal(safeInternalPath("/dashboard"), "/dashboard");
  assert.equal(safeInternalPath("/listings/abc?x=1"), "/listings/abc?x=1");
  assert.equal(safeInternalPath("/sell"), "/sell");
});

test("safeInternalPath rejects open-redirect payloads (SEC-9)", () => {
  assert.equal(safeInternalPath("//evil.example"), "/dashboard");
  assert.equal(safeInternalPath("https://evil.example"), "/dashboard");
  assert.equal(safeInternalPath("/\\evil.example"), "/dashboard");
  assert.equal(safeInternalPath("http:/evil"), "/dashboard");
  assert.equal(safeInternalPath("javascript:alert(1)"), "/dashboard");
  assert.equal(safeInternalPath("dashboard"), "/dashboard");
  assert.equal(safeInternalPath(undefined), "/dashboard");
  assert.equal(safeInternalPath("", "/home"), "/home");
});

test("renderJsonLd neutralises a script-breakout title (SEC-6)", () => {
  const out = renderJsonLd({
    name: "</script><img src=x onerror=alert(1)>",
    tag: "a & b",
  });
  assert.ok(!out.includes("</script>"));
  assert.ok(!out.includes("<img"));
  assert.ok(out.includes("\\u003c"));
  assert.ok(out.includes("\\u0026"));
  // Still valid JSON once the \u escapes are parsed back.
  const parsed = JSON.parse(out);
  assert.equal(parsed.name, "</script><img src=x onerror=alert(1)>");
});

test("escapeCsvCell defuses formula injection (SEC-8)", () => {
  assert.equal(escapeCsvCell("=cmd|'/c calc'!A1"), "'=cmd|'/c calc'!A1");
  assert.equal(escapeCsvCell("+1"), "'+1");
  assert.equal(escapeCsvCell("-1"), "'-1");
  assert.equal(escapeCsvCell("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(escapeCsvCell("\tx"), "'\tx");
});

test("escapeCsvCell leaves ordinary values alone", () => {
  assert.equal(escapeCsvCell("Ahmed"), "Ahmed");
  assert.equal(escapeCsvCell("1000"), "1000");
  assert.equal(escapeCsvCell("a, b"), '"a, b"');
  assert.equal(escapeCsvCell(null), "");
});
