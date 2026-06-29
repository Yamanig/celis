import { createFileRoute, redirect } from "@tanstack/react-router";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { ListingWizard } from "~/components/listings/listing-wizard";
import { listCategories } from "~/server/categories.functions";
import { getListingTiers } from "~/server/config.functions";

export const Route = createFileRoute("/sell")({
  component: SellPage,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/auth/sign-in", search: { redirect: "/sell" } });
    }
  },
  loader: async () => {
    const [categories, tiersConfig] = await Promise.all([
      listCategories(),
      getListingTiers(),
    ]);
    return { categories, tiersConfig };
  },
});

function SellPage() {
  const { categories, tiersConfig } = Route.useLoaderData();
  const { user } = Route.useRouteContext();

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader showSearch={false} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Sell an item</h1>
          <span className="text-sm text-celis-ink-secondary">
            Tiered listing fee applies on publish
          </span>
        </div>
        <ListingWizard
          sellerId={user.id}
          categories={categories}
          tiersConfig={tiersConfig}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
