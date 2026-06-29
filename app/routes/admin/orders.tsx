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
import { OrderStatusBadge } from "~/components/admin/status-badge";
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
} from "~/server/admin.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";

const ordersSearchSchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
  validateSearch: ordersSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    return fetchAdminOrders({
      data: {
        status: search.status,
        page: search.page,
        limit: 10,
      },
    });
  },
});

const STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
];

function AdminOrdersPage() {
  const { items, page, totalPages } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate({ from: "/admin/orders" });
  const [status, setStatus] = useState<string>(search.status ?? "");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, next: string) => {
    setLoadingId(id);
    await updateAdminOrderStatus({ data: { id, status: next as never } });
    await router.invalidate();
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Track and update order status" />

      <Card className="border-celis-border bg-celis-surface-base">
        <CardContent className="p-4">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              navigate({
                search: (prev) => ({
                  ...prev,
                  status: value || undefined,
                  page: 1,
                }),
              });
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
        </CardContent>
      </Card>

      <AdminTable
        rows={items}
        keyExtractor={(o) => o.id}
        columns={[
          {
            key: "order",
            header: "Order",
            cell: (o) => (
              <div>
                <p className="font-medium text-celis-ink">{o.listingTitle}</p>
                <p className="text-xs text-celis-ink-secondary">
                  {o.buyerName} → {o.sellerName}
                </p>
              </div>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            cell: (o) => (
              <span className="font-mono tabular-nums">
                {formatPrice(o.salePrice)}
              </span>
            ),
          },
          {
            key: "fees",
            header: "Fees / Payout",
            cell: (o) => (
              <div className="text-xs">
                <p className="text-celis-ink-secondary">
                  Fee {formatPrice(o.platformFee)}
                </p>
                <p className="text-celis-success">
                  Payout {formatPrice(o.netPayout)}
                </p>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (o) => <OrderStatusBadge status={o.status} />,
          },
          {
            key: "created",
            header: "Created",
            cell: (o) => (
              <span className="text-xs text-celis-ink-secondary">
                {formatRelativeDate(o.createdAt)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "Update",
            cell: (o) => (
              <Select
                value={o.status}
                disabled={loadingId === o.id}
                onValueChange={(v) => handleStatusChange(o.id, v)}
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
