import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Combobox } from "~/components/ui/combobox";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
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
  createAdminOrder,
} from "~/server/admin.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";

const ordersSearchSchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
  head: () => ({
    meta: [
      { title: "Orders | Admin | Celis" },
      { name: "description", content: "Manage buyer and seller orders in Celis admin." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),

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
  const statusOptions = [
    { value: "", label: "All statuses" },
    ...STATUSES.map((s) => ({ value: s, label: s })),
  ];
  const rowStatusOptions = statusOptions.filter((option) => option.value);

  useEffect(() => {
    if (
      search.page === 1 &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("page") === "1"
    ) {
      navigate({
        replace: true,
        search: (prev) => ({ ...prev, page: undefined }),
      });
    }
  }, [navigate, search.page]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    listingId: "",
    buyerEmail: "",
    salePrice: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await createAdminOrder({
        data: {
          listingId: createForm.listingId,
          buyerEmail: createForm.buyerEmail,
          salePrice: Number(createForm.salePrice),
        },
      });
      setCreateForm({ listingId: "", buyerEmail: "", salePrice: "" });
      setCreateOpen(false);
      await router.invalidate();
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (id: string, next: string) => {
    setLoadingId(id);
    await updateAdminOrderStatus({ data: { id, status: next as never } });
    await router.invalidate();
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track and update order status"
        action={
          <Button onClick={() => setCreateOpen(true)}>Create order</Button>
        }
      />

      <Card className="border-celis-border bg-celis-surface-base">
        <CardContent className="p-4">
          <Combobox
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              navigate({
                search: (prev) => ({
                  ...prev,
                  status: value || undefined,
                  page: undefined,
                }),
              });
            }}
            className="w-full sm:w-44"
            placeholder="All statuses"
            options={statusOptions}
          />
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
              <Combobox
                value={o.status}
                disabled={loadingId === o.id}
                onValueChange={(v) => handleStatusChange(o.id, v)}
                className="w-full sm:w-40"
                options={rowStatusOptions}
              />
            ),
          },
        ]}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) =>
          navigate({ search: (prev) => ({ ...prev, page: p > 1 ? p : undefined }) })
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listingId">Listing ID</Label>
              <Input
                id="listingId"
                value={createForm.listingId}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, listingId: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerEmail">Buyer email</Label>
              <Input
                id="buyerEmail"
                type="email"
                value={createForm.buyerEmail}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, buyerEmail: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale price (cents)</Label>
              <Input
                id="salePrice"
                type="number"
                min={0}
                value={createForm.salePrice}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, salePrice: e.target.value }))
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? "Creating..." : "Create order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
