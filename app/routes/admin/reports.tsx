import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
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
  fetchFailedPaymentsReport,
  fetchNewUsersReport,
  fetchNewListingsReport,
} from "~/server/admin.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";
import { exportToCsv } from "~/lib/csv";
import { Download } from "lucide-react";

const reportsSearchSchema = z.object({
  tab: z.enum(["ledger", "failed-payments", "new-users", "new-listings"]).optional().default("ledger"),
  from: z.string().optional(),
  to: z.string().optional(),
  date: z.string().optional(),
  type: z.enum(["all", "payment", "payout", "refund"]).optional().default("all"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/reports")({
  component: AdminReportsPage,
  head: () => ({
    meta: [
      { title: "Reports | Admin | Celis" },
      { name: "description", content: "View payments, payouts, and operational reports in Celis admin." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),

  validateSearch: reportsSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const common = { page: search.page, limit: 10 };
    const today = new Date().toISOString().slice(0, 10);

    const [ledger, failedPayments, newUsers, newListings] = await Promise.all([
      fetchAdminLedger({
        data: {
          from: search.from,
          to: search.to,
          type: search.type,
          ...common,
        },
      }),
      fetchFailedPaymentsReport({
        data: {
          from: search.from,
          to: search.to,
          ...common,
        },
      }),
      fetchNewUsersReport({
        data: { date: search.date ?? today, ...common },
      }),
      fetchNewListingsReport({
        data: { date: search.date ?? today, ...common },
      }),
    ]);

    return { ledger, failedPayments, newUsers, newListings };
  },
});

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "payment", label: "Payments" },
  { value: "payout", label: "Payouts" },
  { value: "refund", label: "Refunds" },
];

function AdminReportsPage() {
  const { ledger, failedPayments, newUsers, newListings } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/admin/reports" });
  const [from, setFrom] = useState(search.from ?? "");
  const [to, setTo] = useState(search.to ?? "");
  const [type, setType] = useState<string>(search.type ?? "all");
  const [date, setDate] = useState(search.date ?? new Date().toISOString().slice(0, 10));
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState(search.tab ?? "ledger");

  useEffect(() => {
    setFrom(search.from ?? "");
  }, [search.from]);

  useEffect(() => {
    setTo(search.to ?? "");
  }, [search.to]);

  useEffect(() => {
    setType(search.type ?? "all");
  }, [search.type]);

  useEffect(() => {
    setDate(search.date ?? new Date().toISOString().slice(0, 10));
  }, [search.date]);

  useEffect(() => {
    setActiveTab(search.tab ?? "ledger");
  }, [search.tab]);

  const updateSearch = (
    patch: Partial<z.infer<typeof reportsSearchSchema>>
  ) => {
    navigate({
      search: (prev) => ({ ...prev, ...patch, page: 1 }),
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as z.infer<typeof reportsSearchSchema>["tab"]);
    navigate({
      search: (prev) => ({ ...prev, tab: tab as z.infer<typeof reportsSearchSchema>["tab"], page: 1 }),
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
        description="Financial ledger and operational reports"
        action={
          activeTab === "ledger" && (
            <Button onClick={handleExport} disabled={exporting || ledger.items.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-celis-surface-inset">
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="failed-payments">Failed payments</TabsTrigger>
          <TabsTrigger value="new-users">New users</TabsTrigger>
          <TabsTrigger value="new-listings">New listings</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-celis-border bg-celis-surface-base">
              <CardContent className="p-4">
                <p className="text-sm text-celis-ink-secondary">Payments in view</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-celis-primary">
                  {formatPrice(ledger.totals.payments)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-celis-border bg-celis-surface-base">
              <CardContent className="p-4">
                <p className="text-sm text-celis-ink-secondary">Payouts in view</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-celis-success">
                  {formatPrice(ledger.totals.payouts)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-celis-border bg-celis-surface-base">
              <CardContent className="p-4">
                <p className="text-sm text-celis-ink-secondary">Net in view</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-celis-ink">
                  {formatPrice(ledger.totals.payments - ledger.totals.payouts)}
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
            rows={ledger.items}
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
                  <Badge variant="secondary" className="capitalize">
                    {r.type}
                  </Badge>
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
            page={ledger.page}
            totalPages={ledger.totalPages}
            onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
          />
        </TabsContent>

        <TabsContent value="failed-payments" className="space-y-6">
          <Card className="border-celis-border bg-celis-surface-base">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="fp-from">From</Label>
                <Input
                  id="fp-from"
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    updateSearch({ from: e.target.value || undefined });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fp-to">To</Label>
                <Input
                  id="fp-to"
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    updateSearch({ to: e.target.value || undefined });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <AdminTable
            rows={failedPayments.items}
            keyExtractor={(r) => r.id}
            emptyMessage="No failed or pending payments in the selected range."
            columns={[
              {
                key: "reference",
                header: "Reference",
                cell: (r) => (
                  <div>
                    <p className="font-mono text-xs text-celis-ink">{r.merchantRef}</p>
                    <p className="text-xs text-celis-ink-secondary">{r.provider}</p>
                  </div>
                ),
              },
              {
                key: "user",
                header: "User",
                cell: (r) => (
                  <div>
                    <p className="text-sm">{r.userName ?? r.userEmail}</p>
                    <p className="text-xs text-celis-ink-secondary">{r.userEmail}</p>
                  </div>
                ),
              },
              {
                key: "amount",
                header: "Amount",
                cell: (r) => (
                  <span className="font-mono tabular-nums">
                    {formatPrice(r.amount, r.currency)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (r) => (
                  <Badge variant={r.status === "failed" ? "destructive" : "secondary"}>
                    {r.status}
                  </Badge>
                ),
              },
              {
                key: "retries",
                header: "Retries",
                cell: (r) => <span className="tabular-nums">{r.retryCount}</span>,
              },
              {
                key: "error",
                header: "Error / Note",
                cell: (r) => (
                  <span className="text-xs text-celis-ink-secondary">
                    {r.errorMessage ?? "—"}
                  </span>
                ),
              },
              {
                key: "time",
                header: "Attempted",
                cell: (r) => (
                  <span className="text-xs text-celis-ink-secondary">
                    {formatRelativeDate(r.createdAt)}
                  </span>
                ),
              },
            ]}
          />

          <Pagination
            page={failedPayments.page}
            totalPages={failedPayments.totalPages}
            onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
          />
        </TabsContent>

        <TabsContent value="new-users" className="space-y-6">
          <Card className="border-celis-border bg-celis-surface-base">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="nu-date">Date</Label>
                <Input
                  id="nu-date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    updateSearch({ date: e.target.value || undefined });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <AdminTable
            rows={newUsers.items}
            keyExtractor={(r) => r.id}
            emptyMessage="No new users on the selected date."
            columns={[
              {
                key: "user",
                header: "User",
                cell: (r) => (
                  <div>
                    <p className="font-medium text-celis-ink">{r.displayName ?? r.email}</p>
                    <p className="text-xs text-celis-ink-secondary">{r.email}</p>
                    {r.phone && <p className="text-xs text-celis-ink-tertiary">{r.phone}</p>}
                  </div>
                ),
              },
              {
                key: "role",
                header: "Role / Type",
                cell: (r) => (
                  <div className="text-sm">
                    <span className="capitalize">{r.role}</span>
                    {r.role === "seller" && (
                      <p className="text-xs text-celis-ink-secondary capitalize">
                        {r.sellerType.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: "verified",
                header: "Verified",
                cell: (r) => (
                  <Badge variant={r.isVerified ? "success" : "secondary"}>
                    {r.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                ),
              },
              {
                key: "joined",
                header: "Registered",
                cell: (r) => (
                  <span className="text-xs text-celis-ink-secondary">
                    {formatRelativeDate(r.createdAt)}
                  </span>
                ),
              },
            ]}
          />

          <Pagination
            page={newUsers.page}
            totalPages={newUsers.totalPages}
            onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
          />
        </TabsContent>

        <TabsContent value="new-listings" className="space-y-6">
          <Card className="border-celis-border bg-celis-surface-base">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="nl-date">Date</Label>
                <Input
                  id="nl-date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    updateSearch({ date: e.target.value || undefined });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <AdminTable
            rows={newListings.items}
            keyExtractor={(r) => r.id}
            emptyMessage="No new listings on the selected date."
            columns={[
              {
                key: "listing",
                header: "Listing",
                cell: (r) => (
                  <div>
                    <p className="font-medium text-celis-ink">{r.title}</p>
                    <p className="text-xs text-celis-ink-secondary">
                      {r.categoryName} · {r.sellerName}
                    </p>
                  </div>
                ),
              },
              {
                key: "price",
                header: "Price",
                cell: (r) => (
                  <span className="font-mono tabular-nums">
                    {formatPrice(r.price)}
                  </span>
                ),
              },
              {
                key: "condition",
                header: "Condition",
                cell: (r) => (
                  <span className="text-xs capitalize">
                    {r.condition?.replace(/_/g, " ") ?? "—"}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (r) => (
                  <div className="text-sm">
                    <span className="capitalize">{r.status.replace(/_/g, " ")}</span>
                    {r.rejectionReason && (
                      <p className="text-xs text-destructive">{r.rejectionReason}</p>
                    )}
                  </div>
                ),
              },
              {
                key: "monetization",
                header: "Monetization",
                cell: (r) => (
                  <div className="text-xs">
                    <span className="capitalize">{r.monetizationType.replace(/_/g, " ")}</span>
                    <p className="text-celis-ink-secondary capitalize">{r.monetizationStatus.replace(/_/g, " ")}</p>
                  </div>
                ),
              },
              {
                key: "reviewer",
                header: "Reviewer",
                cell: (r) => (
                  <span className="text-xs text-celis-ink-secondary">
                    {r.reviewerName ?? "—"}
                  </span>
                ),
              },
              {
                key: "created",
                header: "Created",
                cell: (r) => (
                  <span className="text-xs text-celis-ink-secondary">
                    {formatRelativeDate(r.createdAt)}
                  </span>
                ),
              },
            ]}
          />

          <Pagination
            page={newListings.page}
            totalPages={newListings.totalPages}
            onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
