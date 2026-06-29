import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { AdminTable } from "~/components/admin/admin-table";
import { PageHeader } from "~/components/admin/page-header";
import { ListingStatusBadge } from "~/components/admin/status-badge";
import {
  fetchAdminListings,
  updateAdminListingStatus,
} from "~/server/admin.functions";
import { listCategories } from "~/server/categories.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";

export const Route = createFileRoute("/admin/listings")({
  component: AdminListingsPage,
  loader: async () => {
    const [listings, categories] = await Promise.all([
      fetchAdminListings(),
      listCategories(),
    ]);
    return { listings, categories };
  },
});

const STATUSES = ["active", "draft", "sold", "expired", "suspended"];

function AdminListingsPage() {
  const { listings, categories } = Route.useLoaderData();
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchesStatus = !status || l.status === status;
      const matchesCategory = !categoryId || l.categoryName === categoryId;
      return matchesStatus && matchesCategory;
    });
  }, [listings, status, categoryId]);

  const handleStatusChange = async (id: string, next: string) => {
    setLoadingId(id);
    await updateAdminListingStatus({ data: { id, status: next as never } });
    await router.invalidate();
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Listings" description="Moderate marketplace listings" />

      <Card className="border-celis-border bg-celis-surface-base">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <AdminTable
        rows={filtered}
        keyExtractor={(l) => l.id}
        columns={[
          {
            key: "listing",
            header: "Listing",
            cell: (l) => (
              <div>
                <p className="font-medium text-celis-ink">{l.title}</p>
                <p className="text-xs text-celis-ink-secondary">
                  {l.sellerName} · {l.categoryName}
                </p>
              </div>
            ),
          },
          {
            key: "price",
            header: "Price",
            cell: (l) => (
              <span className="font-mono tabular-nums">
                {formatPrice(l.price)}
              </span>
            ),
          },
          {
            key: "tier",
            header: "Tier",
            cell: (l) => (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-celis-primary-subtle text-celis-primary">
                {l.tierLabel}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (l) => <ListingStatusBadge status={l.status} />,
          },
          {
            key: "expires",
            header: "Expires",
            cell: (l) => (
              <span className="text-xs text-celis-ink-secondary">
                {l.expiresAt
                  ? formatRelativeDate(l.expiresAt)
                  : "—"}
              </span>
            ),
          },
          {
            key: "posted",
            header: "Posted",
            cell: (l) => (
              <span className="text-xs text-celis-ink-secondary">
                {formatRelativeDate(l.createdAt)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "Action",
            cell: (l) => (
              <Select
                value={l.status}
                disabled={loadingId === l.id}
                onValueChange={(v) => handleStatusChange(l.id, v)}
              >
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
      />
    </div>
  );
}
