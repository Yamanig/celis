import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
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
import { Pagination } from "~/components/ui/pagination";
import { AdminTable } from "~/components/admin/admin-table";
import { PageHeader } from "~/components/admin/page-header";
import {
  fetchAdminLedger,
  exportAdminLedgerCsv,
} from "~/server/admin.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";
import { exportToCsv } from "~/lib/csv";
import { Download } from "lucide-react";

const reportsSearchSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  type: z.enum(["all", "payment", "payout", "refund"]).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/reports")({
  component: AdminReportsPage,
  validateSearch: reportsSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    return fetchAdminLedger({
      data: {
        from: search.from,
        to: search.to,
        type: search.type,
        page: search.page,
        limit: 10,
      },
    });
  },
});

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "payment", label: "Payments" },
  { value: "payout", label: "Payouts" },
  { value: "refund", label: "Refunds" },
];

function AdminReportsPage() {
  const { items, totals, page, totalPages } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/reports" });
  const [from, setFrom] = useState(search.from ?? "");
  const [to, setTo] = useState(search.to ?? "");
  const [type, setType] = useState<string>(search.type ?? "all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setFrom(search.from ?? "");
  }, [search.from]);

  useEffect(() => {
    setTo(search.to ?? "");
  }, [search.to]);

  useEffect(() => {
    setType(search.type ?? "all");
  }, [search.type]);

  const updateSearch = (
    patch: Partial<z.infer<typeof reportsSearchSchema>>
  ) => {
    navigate({
      search: (prev) => ({ ...prev, ...patch, page: 1 }),
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { rows } = await exportAdminLedgerCsv({
        data: {
          from: search.from,
          to: search.to,
          type: search.type,
        },
      });
      exportToCsv(
        rows.map((r) => ({
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
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Financial ledger and CSV export"
        action={
          <Button onClick={handleExport} disabled={exporting || items.length === 0}>
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
              onChange={(e) => {
                setFrom(e.target.value);
                updateSearch({ from: e.target.value || undefined });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                updateSearch({ to: e.target.value || undefined });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value);
                updateSearch({ type: value as z.infer<typeof reportsSearchSchema>["type"] });
              }}
            >
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
        rows={items}
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

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
      />
    </div>
  );
}
