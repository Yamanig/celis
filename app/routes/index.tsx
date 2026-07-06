import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { ListingGrid } from "~/components/listings/listing-grid";
import { FadeIn } from "~/components/motion/fade-in";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Slider } from "~/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Card, CardContent } from "~/components/ui/card";
import { fetchFeaturedListings } from "~/server/listings.functions";
import {
  listCategories,
  fetchCategoryCounts,
  fetchPriceRange,
} from "~/server/categories.functions";
import { formatPrice } from "~/lib/format";
import {
  Smartphone,
  Truck,
  Search,
  Tag,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Wallet,
  MessageCircle,
  Users,
  Star,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Celis — Buy & sell anything in Somalia" },
      { name: "description", content: "Somalia's fastest growing P2P marketplace. Discover local deals on electronics, vehicles, property, fashion, livestock, and more." },
    ],
  }),

  loader: async () => {
    const [featured, categories, counts, priceRange] = await Promise.all([
      fetchFeaturedListings(),
      listCategories(),
      fetchCategoryCounts(),
      fetchPriceRange(),
    ]);
    return { featured, categories, counts, priceRange };
  },
});

function LandingPage() {
  const { featured, categories, counts, priceRange } = Route.useLoaderData();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState([priceRange.min, priceRange.max]);

  const countByCategory = new Map(
    counts.map((c) => [c.categoryId, c.listingCount])
  );

  const handleSearch = () => {
    const search: Record<string, string | number> = {};
    if (query) search.query = query;
    if (categoryId) search.categoryId = categoryId;
    if (price[0] > priceRange.min) search.minPrice = price[0];
    if (price[1] < priceRange.max) search.maxPrice = price[1];
    navigate({ to: "/search", search });
  };

  return (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader showSearch={false} />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-celis-gradient-hero relative overflow-hidden border-b border-celis-border px-4 py-24 sm:py-32">
          {/* Ambient glows */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.04, 0.07, 0.04] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-celis-primary blur-3xl sm:h-96 sm:w-96 lg:h-[28rem] lg:w-[28rem]"
          />
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.03, 0.06, 0.03] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-celis-secondary blur-3xl sm:h-96 sm:w-96 lg:h-[28rem] lg:w-[28rem]"
          />

          <div className="relative mx-auto max-w-5xl text-center">
            <FadeIn>
              <Badge
                variant="secondary"
                className="mb-6 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Somalia&apos;s fastest growing marketplace
              </Badge>
            </FadeIn>

            <FadeIn delay={0.05}>
              <h1 className="text-4xl font-bold tracking-tight text-celis-ink sm:text-6xl sm:leading-[1.1]">
                Buy & sell anything in Somalia
              </h1>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-celis-ink-secondary">
                From electronics to vehicles, property to livestock — discover
                local deals with simple, transparent mobile money payments.
              </p>
            </FadeIn>

            {/* Search card */}
            <FadeIn delay={0.15}>
              <Card className="mx-auto mt-10 max-w-3xl border-celis-border text-left shadow-lg transition-shadow hover:shadow-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-celis-ink-secondary">
                        What are you looking for?
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-celis-ink-tertiary" />
                        <Input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          placeholder="iPhone, car, apartment..."
                          className="h-12 rounded-lg border-celis-border bg-celis-surface-inset pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-celis-ink-secondary">
                        Category
                      </label>
                      <Select
                        value={categoryId}
                        onValueChange={setCategoryId}
                      >
                        <SelectTrigger className="h-12 w-full sm:w-44">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      size="lg"
                      className="h-12 px-8"
                      onClick={handleSearch}
                    >
                      Search
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>

                  <Separator className="my-5" />

                  <div>
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="font-medium text-celis-ink-secondary">
                        Price range
                      </span>
                      <span className="font-semibold text-celis-ink">
                        {formatPrice(price[0])} - {formatPrice(price[1])}
                      </span>
                    </div>
                    <Slider
                      value={price}
                      min={priceRange.min}
                      max={priceRange.max}
                      step={Math.max(
                        1,
                        Math.round((priceRange.max - priceRange.min) / 100)
                      )}
                      onValueChange={setPrice}
                    />
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm text-celis-ink-secondary">
                <span>Trending:</span>
                {["iPhone", "Toyota", "Apartment", "Goats"].map((term) => (
                  <Link
                    key={term}
                    to="/search"
                    search={{ query: term }}
                    className="rounded-full bg-celis-surface-inset px-3 py-1 text-celis-ink transition hover:scale-105 hover:bg-celis-primary-subtle hover:text-celis-primary"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-celis-gradient-soft mx-auto max-w-7xl px-4 py-16">
          <FadeIn>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-celis-ink">
                  Browse categories
                </h2>
                <p className="mt-1 text-celis-ink-secondary">
                  Explore listings across {categories.length} categories
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/browse">View all</Link>
              </Button>
            </div>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat, idx) => {
              const listingCount = countByCategory.get(cat.id) ?? 0;
              return (
                <FadeIn key={cat.id} delay={idx * 0.04}>
                  <Link to="/search" search={{ categoryId: cat.id }} className="group">
                    <Card className="h-full transition duration-200 hover:-translate-y-1 hover:border-celis-primary hover:shadow-md">
                      <CardContent className="flex items-center justify-between p-5">
                        <div>
                          <h3 className="font-medium text-celis-ink group-hover:text-celis-primary">
                            {cat.name}
                          </h3>
                          <p className="mt-0.5 text-sm text-celis-ink-secondary">
                            {listingCount} listing
                            {listingCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-celis-border transition group-hover:translate-x-1 group-hover:text-celis-primary" />
                      </CardContent>
                    </Card>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </section>

        {/* Featured / Trending */}
        <section className="border-y border-celis-border bg-celis-surface-base px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <FadeIn>
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <Badge variant="default" className="mb-3">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Trending now
                  </Badge>
                  <h2 className="text-2xl font-semibold text-celis-ink">
                    Fresh listings
                  </h2>
                  <p className="mt-1 text-celis-ink-secondary">
                    The newest items posted by sellers near you
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/browse">Browse all</Link>
                </Button>
              </div>
            </FadeIn>
            <ListingGrid listings={featured} />
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-4 py-20">
          <FadeIn>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-semibold text-celis-ink">
                How Celis works
              </h2>
              <p className="mt-3 text-celis-ink-secondary">
                Post, pay, and pickup in minutes
              </p>
            </div>
          </FadeIn>

          <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-3">
            <FadeIn className="md:col-span-2">
              <Card className="group relative h-full overflow-hidden border-celis-border bg-gradient-to-br from-celis-primary/10 to-celis-secondary/5 transition hover:-translate-y-1 hover:shadow-md">
                <CardContent className="flex h-full flex-col justify-between p-6">
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-celis-bg p-3 shadow-sm">
                      <Search className="h-7 w-7 text-celis-primary" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-celis-ink-tertiary transition group-hover:translate-x-1 group-hover:text-celis-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-celis-ink">
                      Find or list anything
                    </h3>
                    <p className="mt-2 max-w-md text-celis-ink-secondary">
                      Browse thousands of local listings or snap a photo and post
                      your item in under a minute.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.05} className="md:row-span-2">
              <Card className="group relative flex h-full flex-col justify-between overflow-hidden border-celis-border bg-gradient-to-b from-celis-secondary/10 to-celis-primary/5 transition hover:-translate-y-1 hover:shadow-md">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="rounded-lg bg-celis-bg p-3 shadow-sm">
                    <Smartphone className="h-7 w-7 text-celis-secondary" />
                  </div>
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-celis-ink">
                      Pay with mobile money
                    </h3>
                    <p className="mt-2 text-celis-ink-secondary">
                      Use EVC, Premier, or edahab. Fixed-rate pricing means no
                      surprises at checkout.
                    </p>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["EVC", "Premier", "edahab"].map((w) => (
                      <Badge
                        key={w}
                        variant="secondary"
                        className="bg-celis-bg text-celis-ink-secondary"
                      >
                        {w}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.1}>
              <Card className="group h-full border-celis-border bg-celis-bg transition hover:-translate-y-1 hover:shadow-sm">
                <CardContent className="flex h-full flex-col justify-between p-6">
                  <div className="rounded-lg bg-celis-primary-subtle p-3">
                    <CheckCircle2 className="h-7 w-7 text-celis-primary" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-celis-ink">
                      Review before you buy
                    </h3>
                    <p className="mt-2 text-sm text-celis-ink-secondary">
                      Message the seller, inspect photos, and confirm details
                      before paying.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.15} className="md:col-span-2">
              <Card className="group relative h-full overflow-hidden border-celis-border bg-gradient-to-br from-celis-primary/10 via-celis-bg to-celis-secondary/5 transition hover:-translate-y-1 hover:shadow-md">
                <CardContent className="flex h-full flex-col justify-between p-6 sm:flex-row sm:items-center sm:gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-celis-ink">
                      Seller gets paid directly
                    </h3>
                    <p className="mt-2 max-w-sm text-celis-ink-secondary">
                      Once the buyer reviews and approves, payment is pushed
                      straight to the seller&apos;s wallet.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-3 sm:mt-0">
                    <div className="rounded-full bg-celis-primary-subtle p-3">
                      <Wallet className="h-6 w-6 text-celis-primary" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-celis-ink-tertiary transition group-hover:translate-x-1 group-hover:text-celis-primary" />
                    <div className="rounded-full bg-celis-secondary-subtle p-3">
                      <Smartphone className="h-6 w-6 text-celis-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-celis-border bg-celis-surface-base px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <FadeIn>
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-semibold text-celis-ink">
                  Built for trust
                </h2>
                <p className="mt-3 text-celis-ink-secondary">
                  Tools that make every trade feel safe and simple
                </p>
              </div>
            </FadeIn>

            <div className="grid auto-rows-[minmax(140px,auto)] grid-cols-1 gap-4 md:grid-cols-4">
              <FadeIn className="md:col-span-2 md:row-span-2">
                <Card className="group relative h-full overflow-hidden border-celis-border bg-gradient-to-br from-celis-primary/10 to-celis-secondary/5 transition hover:-translate-y-1 hover:shadow-md">
                  <CardContent className="flex h-full flex-col justify-between p-6">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-celis-bg p-3 shadow-sm">
                        <Users className="h-7 w-7 text-celis-primary" />
                      </div>
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-8 w-8 rounded-full border-2 border-celis-bg bg-celis-surface-inset"
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-celis-ink">
                        Verified seller profiles
                      </h3>
                      <p className="mt-2 max-w-sm text-celis-ink-secondary">
                        Every seller has a public profile with ratings and reviews,
                        so you know exactly who you&apos;re trading with.
                      </p>
                      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-celis-primary">
                        <Star className="h-4 w-4 fill-current" />
                        <span>Ratings & reviews</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.05} className="md:col-span-2">
                <Card className="group h-full border-celis-border bg-celis-bg transition hover:-translate-y-1 hover:shadow-sm">
                  <CardContent className="flex h-full items-center gap-5 p-6">
                    <div className="rounded-lg bg-celis-secondary-subtle p-3">
                      <Smartphone className="h-7 w-7 text-celis-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-celis-ink">
                        Mobile money ready
                      </h3>
                      <p className="mt-1 text-sm text-celis-ink-secondary">
                        No cards or bank accounts needed — pay with the wallets
                        you already use.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.1}>
                <Card className="group h-full border-celis-border bg-celis-bg transition hover:-translate-y-1 hover:shadow-sm">
                  <CardContent className="flex h-full flex-col justify-between p-5">
                    <div className="rounded-lg bg-celis-primary-subtle p-2.5">
                      <Truck className="h-6 w-6 text-celis-primary" />
                    </div>
                    <div className="mt-3">
                      <h3 className="font-semibold text-celis-ink">
                        Flexible delivery
                      </h3>
                      <p className="mt-1 text-xs text-celis-ink-secondary">
                        Pickup or delivery.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.15}>
                <Card className="group h-full border-celis-border bg-celis-bg transition hover:-translate-y-1 hover:shadow-sm">
                  <CardContent className="flex h-full flex-col justify-between p-5">
                    <div className="rounded-lg bg-celis-secondary-subtle p-2.5">
                      <Tag className="h-6 w-6 text-celis-secondary" />
                    </div>
                    <div className="mt-3">
                      <h3 className="font-semibold text-celis-ink">
                        Simple fees
                      </h3>
                      <p className="mt-1 text-xs text-celis-ink-secondary">
                        One clear listing fee.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.2} className="md:col-span-2">
                <Card className="group h-full border-celis-border bg-celis-bg transition hover:-translate-y-1 hover:shadow-sm">
                  <CardContent className="flex h-full items-center gap-5 p-6">
                    <div className="rounded-lg bg-celis-primary-subtle p-3">
                      <Search className="h-7 w-7 text-celis-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-celis-ink">
                        Smart filtering
                      </h3>
                      <p className="mt-1 text-sm text-celis-ink-secondary">
                        Filter by price, category, and location to find exactly
                        what you need.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.25} className="md:col-span-2">
                <Card className="group h-full border-celis-border bg-celis-bg transition hover:-translate-y-1 hover:shadow-sm">
                  <CardContent className="flex h-full items-center gap-5 p-6">
                    <div className="rounded-lg bg-celis-secondary-subtle p-3">
                      <MessageCircle className="h-7 w-7 text-celis-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-celis-ink">
                        Direct chat
                      </h3>
                      <p className="mt-1 text-sm text-celis-ink-secondary">
                        Ask questions and negotiate details before you meet.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-24">
          <FadeIn>
            <div className="relative overflow-hidden rounded-2xl bg-celis-primary px-6 py-16 text-center text-celis-ink-on-primary">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border-[40px] border-celis-ink-on-primary/10"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full border-[40px] border-celis-ink-on-primary/10"
              />

              <div className="relative z-10">
                <h2 className="text-3xl font-bold">Ready to start selling?</h2>
                <p className="mx-auto mt-4 max-w-xl text-celis-ink-on-primary/90">
                  Join thousands of Somali sellers reaching buyers across the
                  country.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/auth/sign-up" search={{ role: "seller" }}>
                      Create seller account
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-celis-ink-on-primary/30 text-celis-ink-on-primary hover:bg-celis-ink-on-primary/10"
                    asChild
                  >
                    <Link to="/browse">Browse listings</Link>
                  </Button>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
