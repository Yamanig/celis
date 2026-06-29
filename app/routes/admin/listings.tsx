import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Pagination } from "~/components/ui/pagination";
import { AdminTable } from "~/components/admin/admin-table";
import { PageHeader } from "~/components/admin/page-header";
import { ListingStatusBadge } from "~/components/admin/status-badge";
import {
  fetchAdminListings,
  updateAdminListingStatus,
} from "~/server/admin.functions";
import { listCategories } from "~/server/categories.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";

const listingsSearchSchema = z.object({
  status: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/listings")({
  component: AdminListingsPage,
  validateSearch: listingsSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const [listings, categories] = await Promise.all([
      fetchAdminListings({
        data: {
          status: search.status,
          categoryId: search.categoryId,
          page: search.page,
          limit: 10,
        },
      }),
      listCategories(),
    ]);
    return { listings, categories };
  },
});

const STATUSES = ["active", "draft", "sold", "expired", "suspended"];

function AdminListingsPage() {
  const { listings, categories } = Route.useLoaderData();
  const { items, page, totalPages } = listings;
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate({ from: "/admin/listings" });
  const [status, setStatus] = useState<string>(search.status ?? "");
  const [categoryId, setCategoryId] = useState<string>(search.categoryId ?? "");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const updateSearch = (patch: Partial<z.infer<typeof listingsSearchSchema>>) => {
    navigate({
      search: (prev) => ({ ...prev, ...patch, page: 1 }),
    });
  };

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
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              updateSearch({ status: value || undefined });
            }}
          >
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
          <Select
            value={categoryId}
            onValueChange={(value) => {
              setCategoryId(value);
              updateSearch({ categoryId: value || undefined });
            }}
          >
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
        rows={items}
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
                {l.expiresAt ? formatRelativeDate(l.expiresAt) : "—"}
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

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
      />
    </div>
  );
}
