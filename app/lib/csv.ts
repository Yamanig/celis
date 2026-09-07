/**
 * Escape a single CSV cell.
 *
 * - Formula injection (SEC-8): a value Excel / Google Sheets would evaluate as a
 *   formula (`=`, `+`, `-`, `@`, or a leading tab / CR) is prefixed with a single
 *   apostrophe so it is imported as literal text.
 * - RFC-4180 quoting for values containing a comma, quote, or newline.
 */
export function escapeCsvCell(value: unknown): string {
  let str = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(
  rows: Record<string, string | number | boolean | null | undefined>[],
  columns: { key: string; label: string }[]
): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCsvCell(row[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export function exportToCsv(
  rows: Record<string, string | number | boolean | null | undefined>[],
  columns: { key: string; label: string }[],
  filename: string
) {
  if (rows.length === 0) return;

  const csv = toCsv(rows, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
