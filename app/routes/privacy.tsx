import { createFileRoute } from "@tanstack/react-router";
// Canonical bilingual policy, generated from the mobile app's typed `privacy.*`
// registry (see docs/backend/mobile-account-privacy.md). Its body is rendered
// inside the Celis site chrome below; the untouched source file is still served
// verbatim at /privacy/index.html. Do not hand-edit the source file.
import policyHtml from "../../public/privacy/index.html?raw";
import { LegalDocument } from "~/components/layout/legal-document";
import { parseLegalDoc } from "~/lib/legal-doc";

const policy = parseLegalDoc(policyHtml);

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy | Celis" },
      {
        name: "description",
        content:
          "How Celis Somalia handles information in the buyer and seller marketplace.",
      },
    ],
  }),
});

function PrivacyPage() {
  return <LegalDocument {...policy} />;
}
