import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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

export const Route = createFileRoute("/admin/payouts")({
  component: AdminPayoutsPage,
  loader: async () => fetchAdminPayouts(),
});

const STATUSES = ["pending", "processing", "completed", "failed"];

function AdminPayoutsPage() {
  const payouts = Route.useLoaderData();
  const router = useRouter();
  const [status, setStatus] = useState<string>("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return status ? payouts.filter((p) => p.status === status) : payouts;
  }, [payouts, status]);

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
        </CardContent>
      </Card>

      <AdminTable
        rows={filtered}
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
