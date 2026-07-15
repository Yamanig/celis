import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { ListingWizard } from "~/components/listings/listing-wizard";
import { listCategories } from "~/server/categories.functions";
import { getListingTiers, getMonetizationModel } from "~/server/config.functions";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/sell")({
  component: SellPage,
  head: () => ({
    meta: [
      { title: "Sell an item | Celis" },
      { name: "description", content: "List your item for sale on Celis and reach buyers across Somalia." },
    ],
  }),

  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/auth/sign-in", search: { redirect: "/sell" } });
    }
  },
  loader: async () => {
    const [categories, tiersConfig, monetizationModel] = await Promise.all([
      listCategories(),
      getListingTiers(),
      getMonetizationModel(),
    ]);
    return { categories, tiersConfig, monetizationModel };
  },
});

function SellPage() {
  const { categories, tiersConfig, monetizationModel } = Route.useLoaderData();
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

        {!user.phone ? (
          <Card className="border-celis-caution bg-celis-caution-subtle">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <AlertTriangle className="h-10 w-10 text-celis-caution" />
              <div>
                <h2 className="text-lg font-semibold text-celis-ink">
                  Phone number required
                </h2>
                <p className="mt-1 max-w-sm text-sm text-celis-ink-secondary">
                  Buyers will use your phone number to contact you. Add it to
                  your account before listing an item.
                </p>
              </div>
              <Button asChild>
                <Link to="/account" search={{ redirect: "/sell" }}>
                  Add phone number
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ListingWizard
            sellerId={user.id}
            categories={categories}
            tiersConfig={tiersConfig}
            monetizationModel={monetizationModel}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
