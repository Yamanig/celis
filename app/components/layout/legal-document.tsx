import { useState } from "react";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { cn } from "~/lib/utils";
import type { ParsedLegalDoc } from "~/lib/legal-doc";

type Lang = "en" | "so";

const LANG_LABEL: Record<Lang, string> = { en: "English", so: "Soomaali" };

/**
 * Renders a bilingual legal document (privacy policy, terms of service) inside
 * the standard Celis page shell with an English / Somali toggle. Body markup
 * comes straight from the source file via {@link parseLegalDoc}; it is trusted,
 * build-time content, never user input.
 */
export function LegalDocument({ title, en, so }: ParsedLegalDoc) {
  const available = ([
    ["en", en],
    ["so", so],
  ] as const).filter(([, body]) => body.length > 0);

  const [lang, setLang] = useState<Lang>(available[0]?.[0] ?? "en");
  const body = lang === "so" ? so : en;

  return (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader showSearch={false} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-celis-ink sm:text-3xl">
          {title}
        </h1>

        {available.length > 1 && (
          <div
            role="group"
            aria-label="Language"
            className="mt-4 inline-flex gap-0.5 rounded-md border border-celis-border p-0.5"
          >
            {available.map(([code]) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                  lang === code
                    ? "bg-celis-primary text-celis-ink-on-primary"
                    : "text-celis-ink-secondary hover:text-celis-ink",
                )}
              >
                {LANG_LABEL[code]}
              </button>
            ))}
          </div>
        )}

        <article
          lang={lang}
          className="legal-prose mt-6 rounded-lg border border-celis-border bg-celis-surface-base p-6 sm:p-8"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
