import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Switch } from "~/components/ui/switch";
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
  exportFailedPaymentsReportCsv,
  fetchNewUsersReport,
  exportNewUsersReportCsv,
  fetchNewListingsReport,
  exportNewListingsReportCsv,
} from "~/server/admin.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";
import { exportToCsv } from "~/lib/csv";
import { Download } from "lucide-react";

type FailedPaymentExportRow = {
  id: string;
  merchantRef: string;
  walletRef: string | null;
  userEmail: string;
  userName: string | null;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  retryCount: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type NewUserExportRow = {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  role: string;
  sellerType: string;
  isVerified: boolean;
  createdAt: Date;
};

type NewListingExportRow = {
  id: string;
  title: string;
  price: number;
  condition: string | null;
  categoryName: string;
  sellerName: string;
  status: string;
  monetizationStatus: string;
  monetizationType: string;
  reviewerName: string | null;
  createdAt: Date;
};

const reportsSearchSchema = z.object({
  tab: z.enum(["ledger", "failed-payments", "new-users", "new-listings"]).optional().default("ledger"),
  from: z.string().optional(),
  to: z.string().optional(),
  includePending: z.coerce.boolean().optional().default(false),
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
          includePending: search.includePending,
          ...common,
        },
      }),
      fetchNewUsersReport({
        data: { from: search.from, to: search.to, ...common },
      }),
      fetchNewListingsReport({
        data: { from: search.from, to: search.to, ...common },
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
  const [includePending, setIncludePending] = useState(search.includePending ?? false);
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
    setIncludePending(search.includePending ?? false);
  }, [search.includePending]);

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
      if (activeTab === "ledger") {
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
      } else if (activeTab === "failed-payments") {
        const rows = (await exportFailedPaymentsReportCsv({
          data: {
            from: search.from,
            to: search.to,
            includePending: search.includePending,
          },
        })) as FailedPaymentExportRow[];
        exportToCsv(
          rows.map((r) => ({
            merchantRef: r.merchantRef,
            walletRef: r.walletRef ?? "",
            userEmail: r.userEmail,
            userName: r.userName ?? "",
            amount: formatPrice(r.amount, r.currency),
            currency: r.currency,
            provider: r.provider,
            status: r.status,
            retryCount: r.retryCount,
            errorCode: r.errorCode ?? "",
            errorMessage: r.errorMessage ?? "",
            attemptedAt: new Date(r.createdAt).toISOString(),
            updatedAt: new Date(r.updatedAt).toISOString(),
          })),
          [
            { key: "merchantRef", label: "Reference" },
            { key: "walletRef", label: "Wallet Ref" },
            { key: "userEmail", label: "Email" },
            { key: "userName", label: "Name" },
            { key: "amount", label: "Amount" },
            { key: "currency", label: "Currency" },
            { key: "provider", label: "Provider" },
            { key: "status", label: "Status" },
            { key: "retryCount", label: "Retries" },
            { key: "errorCode", label: "Error Code" },
            { key: "errorMessage", label: "Error Message" },
            { key: "attemptedAt", label: "Attempted" },
            { key: "updatedAt", label: "Updated" },
          ],
          `celis-failed-payments-${new Date().toISOString().slice(0, 10)}.csv`
        );
      } else if (activeTab === "new-users") {
        const rows = (await exportNewUsersReportCsv({
          data: { from: search.from, to: search.to },
        })) as NewUserExportRow[];
        exportToCsv(
          rows.map((r) => ({
            email: r.email,
            name: r.displayName ?? "",
            phone: r.phone ?? "",
            role: r.role,
            sellerType: r.sellerType.replace(/_/g, " "),
            verified: r.isVerified ? "Yes" : "No",
            registeredAt: new Date(r.createdAt).toISOString(),
          })),
          [
            { key: "email", label: "Email" },
            { key: "name", label: "Name" },
            { key: "phone", label: "Phone" },
            { key: "role", label: "Role" },
            { key: "sellerType", label: "Seller Type" },
            { key: "verified", label: "Verified" },
            { key: "registeredAt", label: "Registered" },
          ],
          `celis-new-users-${new Date().toISOString().slice(0, 10)}.csv`
        );
      } else if (activeTab === "new-listings") {
        const rows = (await exportNewListingsReportCsv({
          data: { from: search.from, to: search.to },
        })) as NewListingExportRow[];
        exportToCsv(
          rows.map((r) => ({
            title: r.title,
            category: r.categoryName,
            seller: r.sellerName,
            price: formatPrice(r.price),
            condition: r.condition?.replace(/_/g, " ") ?? "",
            status: r.status.replace(/_/g, " "),
            monetizationType: r.monetizationType.replace(/_/g, " "),
            monetizationStatus: r.monetizationStatus.replace(/_/g, " "),
            reviewer: r.reviewerName ?? "",
            createdAt: new Date(r.createdAt).toISOString(),
          })),
          [
            { key: "title", label: "Title" },
            { key: "category", label: "Category" },
            { key: "seller", label: "Seller" },
            { key: "price", label: "Price" },
            { key: "condition", label: "Condition" },
            { key: "status", label: "Status" },
            { key: "monetizationType", label: "Monetization Type" },
            { key: "monetizationStatus", label: "Monetization Status" },
            { key: "reviewer", label: "Reviewer" },
            { key: "createdAt", label: "Created" },
          ],
          `celis-new-listings-${new Date().toISOString().slice(0, 10)}.csv`
        );
      }
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
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
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
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="fp-include-pending"
                  checked={includePending}
                  onCheckedChange={(checked) => {
                    setIncludePending(checked);
                    updateSearch({ includePending: checked || undefined });
                  }}
                />
                <Label htmlFor="fp-include-pending" className="cursor-pointer">
                  Include pending
                </Label>
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
                key: "walletRef",
                header: "Wallet Ref",
                cell: (r) => (
                  <span className="font-mono text-xs text-celis-ink-secondary">
                    {r.walletRef ?? "—"}
                  </span>
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
                key: "errorCode",
                header: "Error Code",
                cell: (r) => (
                  <span className="font-mono text-xs text-celis-ink-secondary">
                    {r.errorCode ?? "—"}
                  </span>
                ),
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
              {
                key: "updatedAt",
                header: "Updated",
                cell: (r) => (
                  <span className="text-xs text-celis-ink-secondary">
                    {formatRelativeDate(r.updatedAt)}
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
                <Label htmlFor="nu-from">From</Label>
                <Input
                  id="nu-from"
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    updateSearch({ from: e.target.value || undefined });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nu-to">To</Label>
                <Input
                  id="nu-to"
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
            rows={newUsers.items}
            keyExtractor={(r) => r.id}
            emptyMessage="No new users in the selected range."
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
                <Label htmlFor="nl-from">From</Label>
                <Input
                  id="nl-from"
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    updateSearch({ from: e.target.value || undefined });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nl-to">To</Label>
                <Input
                  id="nl-to"
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
            rows={newListings.items}
            keyExtractor={(r) => r.id}
            emptyMessage="No new listings in the selected range."
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
