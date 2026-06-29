import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { AdminTable } from "~/components/admin/admin-table";
import { PageHeader } from "~/components/admin/page-header";
import { fetchAdminLedger } from "~/server/admin.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";
import { exportToCsv } from "~/lib/csv";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReportsPage,
  loader: async () => fetchAdminLedger(),
});

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "payment", label: "Payments" },
  { value: "payout", label: "Payouts" },
  { value: "refund", label: "Refunds" },
];

function AdminReportsPage() {
  const ledger = Route.useLoaderData();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<string>("all");

  const filtered = useMemo(() => {
    return ledger.filter((row) => {
      const date = new Date(row.date);
      const afterFrom = !from || date >= new Date(from);
      const beforeTo = !to || date <= new Date(`${to}T23:59:59`);
      const matchesType = type === "all" || row.type === type;
      return afterFrom && beforeTo && matchesType;
    });
  }, [ledger, from, to, type]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, row) => {
        if (row.type === "payment") acc.payments += row.amount;
        if (row.type === "payout") acc.payouts += row.amount;
        return acc;
      },
      { payments: 0, payouts: 0 }
    );
  }, [filtered]);

  const handleExport = () => {
    exportToCsv(
      filtered.map((r) => ({
        date: new Date(r.date).toISOString(),
        type: r.type,
        party: r.party,
        amount: formatPrice(r.amount),
        currency: r.currency,
        status: r.status,
        reference: r.reference ?? "",
      })),
      [
        { key: "date", label: "Date" },
        { key: "type", label: "Type" },
        { key: "party", label: "Party" },
        { key: "amount", label: "Amount" },
        { key: "currency", label: "Currency" },
        { key: "status", label: "Status" },
        { key: "reference", label: "Reference" },
      ],
      `celis-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Financial ledger and CSV export"
        action={
          <Button onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-celis-border bg-celis-surface-base">
          <CardContent className="p-4">
            <p className="text-sm text-celis-ink-secondary">Payments in view</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-celis-primary">
              {formatPrice(totals.payments)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-celis-border bg-celis-surface-base">
          <CardContent className="p-4">
            <p className="text-sm text-celis-ink-secondary">Payouts in view</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-celis-success">
              {formatPrice(totals.payouts)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-celis-border bg-celis-surface-base">
          <CardContent className="p-4">
            <p className="text-sm text-celis-ink-secondary">Net in view</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-celis-ink">
              {formatPrice(totals.payments - totals.payouts)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-celis-border bg-celis-surface-base">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type" className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <AdminTable
        rows={filtered}
        keyExtractor={(r) => `${r.type}-${r.id}`}
        columns={[
          {
            key: "date",
            header: "Date",
            cell: (r) => (
              <span className="text-xs text-celis-ink-secondary">
                {formatRelativeDate(r.date)}
              </span>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (r) => (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize bg-celis-primary-subtle text-celis-primary">
                {r.type}
              </span>
            ),
          },
          {
            key: "party",
            header: "Party",
            cell: (r) => <span className="text-sm">{r.party}</span>,
          },
          {
            key: "amount",
            header: "Amount",
            cell: (r) => (
              <span className="font-mono tabular-nums">
                {formatPrice(r.amount)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => <span className="text-xs capitalize">{r.status}</span>,
          },
          {
            key: "reference",
            header: "Reference",
            cell: (r) => (
              <span className="font-mono text-xs text-celis-ink-secondary">
                {r.reference ?? "—"}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
