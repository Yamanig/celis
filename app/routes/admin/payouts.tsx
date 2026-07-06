import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
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
import { ConfirmDialog } from "~/components/admin/confirm-dialog";
import { PayoutStatusBadge } from "~/components/admin/status-badge";
import {
  fetchAdminPayouts,
  retryAdminPayout,
  completeAdminPayout,
} from "~/server/admin.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";

const payoutsSearchSchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/payouts")({
  component: AdminPayoutsPage,
  head: () => ({
    meta: [
      { title: "Payouts | Admin | Celis" },
      { name: "description", content: "Manage seller payouts in Celis admin." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),

  validateSearch: payoutsSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    return fetchAdminPayouts({
      data: {
        status: search.status,
        page: search.page,
        limit: 10,
      },
    });
  },
});

const STATUSES = ["pending", "processing", "completed", "failed"];

function AdminPayoutsPage() {
  const { items, page, totalPages } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate({ from: "/admin/payouts" });
  const [status, setStatus] = useState<string>(search.status ?? "");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleRetry = async (id: string) => {
    setLoadingId(id);
    await retryAdminPayout({ data: { id } });
    await router.invalidate();
    setLoadingId(null);
  };

  const handleComplete = async () => {
    if (!confirmId) return;
    setLoadingId(confirmId);
    await completeAdminPayout({ data: { id: confirmId } });
    setConfirmId(null);
    await router.invalidate();
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payouts" description="Monitor seller payouts" />

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
        keyExtractor={(p) => p.id}
        columns={[
          {
            key: "user",
            header: "Seller",
            cell: (p) => (
              <div>
                <p className="font-medium text-celis-ink">{p.userName}</p>
                <p className="text-xs text-celis-ink-secondary">
                  {p.transferMethod}
                  {p.destinationPhone && ` · ${p.destinationPhone}`}
                </p>
              </div>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            cell: (p) => (
              <span className="font-mono tabular-nums">
                {formatPrice(p.amount)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (p) => <PayoutStatusBadge status={p.status} />,
          },
          {
            key: "reference",
            header: "Reference",
            cell: (p) => (
              <span className="font-mono text-xs text-celis-ink-secondary">
                {p.bankTransferRef ?? "—"}
              </span>
            ),
          },
          {
            key: "created",
            header: "Created",
            cell: (p) => (
              <span className="text-xs text-celis-ink-secondary">
                {formatRelativeDate(p.createdAt)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            cell: (p) => (
              <div className="flex items-center gap-2">
                {p.status === "failed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loadingId === p.id}
                    onClick={() => handleRetry(p.id)}
                  >
                    Retry
                  </Button>
                )}
                {(p.status === "pending" || p.status === "processing") && (
                  <Button
                    variant="default"
                    size="sm"
                    disabled={loadingId === p.id}
                    onClick={() => setConfirmId(p.id)}
                  >
                    Complete
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
      />

      <ConfirmDialog
        open={!!confirmId}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title="Mark payout as completed?"
        description="This will mark the payout completed and the seller will see it as paid. Only confirm when funds have actually left the platform account."
        confirmLabel="Mark completed"
        onConfirm={handleComplete}
        loading={!!loadingId}
      />
    </div>
  );
}
