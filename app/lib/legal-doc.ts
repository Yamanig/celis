export interface ParsedLegalDoc {
  /** Bilingual document title, e.g. "Privacy Policy / Siyaasadda Asturnaanta". */
  title: string;
  /** Inner HTML of the English `<article>`. */
  en: string;
  /** Inner HTML of the Somali `<article>`. */
  so: string;
}

/**
 * Pull the title and the two language bodies out of a legal document
 * (`public/privacy/index.html`, `public/terms/index.html`). Those files keep a
 * fixed shape: one `<h1>`, an `<article id="english">`, and an
 * `<article id="somali">`. Parsing here lets the `/privacy` and `/terms` routes
 * render that content inside the Celis site chrome without duplicating it, so the
 * generated privacy policy stays the single source of truth.
 */
export function parseLegalDoc(html: string): ParsedLegalDoc {
  const title = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.trim() ?? "";
  const en =
    html.match(/<article[^>]*id="english"[^>]*>([\s\S]*?)<\/article>/i)?.[1]?.trim() ?? "";
  const so =
    html.match(/<article[^>]*id="somali"[^>]*>([\s\S]*?)<\/article>/i)?.[1]?.trim() ?? "";
  return { title, en, so };
}
