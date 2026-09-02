import { createFileRoute } from "@tanstack/react-router";
// Bilingual terms of service authored for celis.so (pending qualified legal
// review). Its body is rendered inside the Celis site chrome below; the source
// file is also served verbatim at /terms/index.html.
import termsHtml from "../../public/terms/index.html?raw";
import { LegalDocument } from "~/components/layout/legal-document";
import { parseLegalDoc } from "~/lib/legal-doc";

const terms = parseLegalDoc(termsHtml);

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service | Celis" },
      {
        name: "description",
        content:
          "The terms that govern buying and selling on the Celis marketplace.",
      },
    ],
  }),
});

function TermsPage() {
  return <LegalDocument {...terms} />;
}
