import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Combobox } from "~/components/ui/combobox";
import { Pagination } from "~/components/ui/pagination";
import { AdminTable } from "~/components/admin/admin-table";
import { ConfirmDialog } from "~/components/admin/confirm-dialog";
import { PageHeader } from "~/components/admin/page-header";
import { ListingStatusBadge } from "~/components/admin/status-badge";
import {
  fetchAdminListings,
  updateAdminListingStatus,
  reviewAdminListing,
  extendAdminListingExpiry,
  fetchAdminListingPackages,
  runAdminExpirySweep,
} from "~/server/admin.functions";
import { listCategories } from "~/server/categories.functions";
import { formatPrice, formatRelativeDate } from "~/lib/format";

const listingsSearchSchema = z.object({
  status: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  packageId: z.string().uuid().optional(),
  expiryWindow: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/listings")({
  component: AdminListingsPage,
  head: () => ({
    meta: [
      { title: "Listings | Admin | Celis" },
      { name: "description", content: "Review and manage marketplace listings in Celis admin." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),

  validateSearch: listingsSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const [listings, categories, _packages] = await Promise.all([
      fetchAdminListings({
        data: {
          status:
            search.status ??
            (search.expiryWindow !== undefined ? "active" : undefined),
          categoryId: search.categoryId,
          packageId: search.packageId,
          expiryWindow: search.expiryWindow,
          page: search.page,
          limit: 10,
        },
      }),
      listCategories(),
      fetchAdminListingPackages(),
    ]);
    return { listings, categories, packages: _packages };
  },
});

const STATUSES = [
  "active",
  "pending_review",
  "draft",
  "sold",
  "expired",
  "rejected",
  "suspended",
];

const EXPIRY_WINDOWS = [
  { value: 0, label: "Expired" },
  { value: 1, label: "≤ 1 day" },
  { value: 3, label: "≤ 3 days" },
  { value: 7, label: "≤ 7 days" },
  { value: 14, label: "≤ 14 days" },
];

function AdminListingsPage() {
  const { listings, categories, packages: _packages } = Route.useLoaderData();
  const { items, page, totalPages } = listings;
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate({ from: "/admin/listings" });
  const [status, setStatus] = useState<string>(search.status ?? "");
  const [categoryId, setCategoryId] = useState<string>(search.categoryId ?? "");
  const [_packageId, _setPackageId] = useState<string>(search.packageId ?? "");
  const [expiryWindow, setExpiryWindow] = useState<number | null>(
    search.expiryWindow ?? null
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sweepLoading, setSweepLoading] = useState(false);
  const [extendDialog, setExtendDialog] = useState<{
    open: boolean;
    id: string;
    days: number;
    reason: string;
  }>({ open: false, id: "", days: 7, reason: "" });
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    id: string;
    reason: string;
  }>({ open: false, id: "", reason: "" });
  const [approveId, setApproveId] = useState<string | null>(null);
  const statusOptions = [
    { value: "", label: "All statuses" },
    ...STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
  ];
  const rowStatusOptions = statusOptions.filter((option) => option.value);
  const categoryOptions = [
    { value: "", label: "All categories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

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

  const updateSearch = (patch: Partial<z.infer<typeof listingsSearchSchema>>) => {
    navigate({
      search: (prev) => ({ ...prev, ...patch, page: undefined }),
    });
  };

  const handleExtend = async () => {
    if (!extendDialog.reason.trim()) return;
    setLoadingId(extendDialog.id);
    try {
      await extendAdminListingExpiry({
        data: {
          id: extendDialog.id,
          days: extendDialog.days,
          reason: extendDialog.reason.trim(),
        },
      });
      setExtendDialog({ open: false, id: "", days: 7, reason: "" });
      await router.invalidate();
    } finally {
      setLoadingId(null);
    }
  };

  const handleStatusChange = async (id: string, next: string) => {
    setLoadingId(id);
    await updateAdminListingStatus({ data: { id, status: next as never } });
    await router.invalidate();
    setLoadingId(null);
  };

  const handleApprove = async () => {
    if (!approveId) return;
    setLoadingId(approveId);
    await reviewAdminListing({ data: { id: approveId, action: "approve" } });
    setApproveId(null);
    await router.invalidate();
    setLoadingId(null);
  };

  const handleRunSweep = async () => {
    setSweepLoading(true);
    try {
      await runAdminExpirySweep();
      await router.invalidate();
    } finally {
      setSweepLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectDialog.reason.trim()) return;
    setLoadingId(rejectDialog.id);
    await reviewAdminListing({
      data: {
        id: rejectDialog.id,
        action: "reject",
        reason: rejectDialog.reason.trim(),
      },
    });
    setRejectDialog({ open: false, id: "", reason: "" });
    await router.invalidate();
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listings"
        description="Moderate marketplace listings"
        action={
          <Button
            variant="outline"
            onClick={handleRunSweep}
            disabled={sweepLoading}
          >
            {sweepLoading ? "Running..." : "Run expiry sweep"}
          </Button>
        }
      />

      <Card className="border-celis-border bg-celis-surface-base">
        <CardContent className="flex flex-col gap-2 p-4">
          <p className="text-sm font-medium text-celis-ink">Expiry window</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={expiryWindow === null ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setExpiryWindow(null);
                updateSearch({ expiryWindow: undefined });
              }}
            >
              Any
            </Button>
            {EXPIRY_WINDOWS.map((w) => (
              <Button
                key={w.value}
                variant={expiryWindow === w.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setExpiryWindow(w.value);
                  updateSearch({ expiryWindow: w.value });
                }}
              >
                {w.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-celis-border bg-celis-surface-base">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <Combobox
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              updateSearch({ status: value || undefined });
            }}
            className="w-full sm:w-44"
            placeholder="All statuses"
            options={statusOptions}
          />
          <Combobox
            value={categoryId}
            onValueChange={(value) => {
              setCategoryId(value);
              updateSearch({ categoryId: value || undefined });
            }}
            className="w-full sm:w-52"
            placeholder="All categories"
            searchPlaceholder="Search categories..."
            options={categoryOptions}
          />
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
                <Link
                  to="/admin/listings/$id"
                  params={{ id: l.id }}
                  search={{}}
                  className="font-medium text-celis-ink hover:text-primary"
                >
                  {l.title}
                </Link>
                <p className="text-xs text-celis-ink-secondary">
                  {l.sellerName} · {l.categoryName}
                </p>
              </div>
            ),
          },
          {
            key: "package",
            header: "Package",
            cell: (l) => (
              <span className="text-xs text-celis-ink-secondary">
                {l.packageName ?? "—"}
              </span>
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
              <Badge variant="secondary" className="capitalize">
                {l.tierLabel}
              </Badge>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (l) => <ListingStatusBadge status={l.status} />,
          },
          {
            key: "reviewed",
            header: "Reviewed",
            cell: (l) =>
              l.reviewedAt ? (
                <span className="text-xs text-celis-ink-secondary">
                  {formatRelativeDate(l.reviewedAt)}
                </span>
              ) : (
                <span className="text-xs text-celis-ink-tertiary">—</span>
              ),
          },
          {
            key: "expires",
            header: "Expires",
            cell: (l) => {
              if (!l.expiresAt) return <span className="text-xs text-celis-ink-tertiary">—</span>;
              const days = Math.ceil(
                (new Date(l.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div>
                  <span className="text-xs text-celis-ink-secondary">
                    {new Date(l.expiresAt).toLocaleDateString()}
                  </span>
                  <p
                    className={`text-xs font-medium ${
                      days <= 3 ? "text-celis-destructive" : "text-celis-ink-secondary"
                    }`}
                  >
                    {days < 0 ? `${Math.abs(days)} days ago` : `${days} days left`}
                  </p>
                </div>
              );
            },
          },
          {
            key: "payment",
            header: "Payment",
            cell: (l) => (
              <Badge variant="outline" className="capitalize">
                {l.monetizationStatus.replace(/_/g, " ")}
              </Badge>
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
            cell: (l) =>
              l.status === "pending_review" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    disabled={loadingId === l.id}
                    onClick={() => setApproveId(l.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === l.id}
                    onClick={() =>
                      setRejectDialog({ open: true, id: l.id, reason: "" })
                    }
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <Combobox
                  value={l.status}
                  disabled={loadingId === l.id}
                  onValueChange={(v) => handleStatusChange(l.id, v)}
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

      <ConfirmDialog
        open={!!approveId}
        onOpenChange={(open) => !open && setApproveId(null)}
        title="Approve listing?"
        description="This will make the listing visible on the public marketplace."
        confirmLabel="Approve listing"
        onConfirm={handleApprove}
        loading={!!loadingId}
      />

      <Dialog
        open={extendDialog.open}
        onOpenChange={(open) =>
          !open && setExtendDialog({ open: false, id: "", days: 7, reason: "" })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend listing expiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="extend-days">Additional days</Label>
              <Input
                id="extend-days"
                type="number"
                min={1}
                value={extendDialog.days}
                onChange={(e) =>
                  setExtendDialog((prev) => ({
                    ...prev,
                    days: Number(e.target.value) || 1,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extend-reason">Reason</Label>
              <Textarea
                id="extend-reason"
                value={extendDialog.reason}
                onChange={(e) =>
                  setExtendDialog((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Why is the expiry being extended?"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setExtendDialog({ open: false, id: "", days: 7, reason: "" })
                }
              >
                Cancel
              </Button>
              <Button
                disabled={!extendDialog.reason.trim() || !!loadingId}
                onClick={handleExtend}
              >
                Extend expiry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          !open && setRejectDialog({ open: false, id: "", reason: "" })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={rejectDialog.reason}
                onChange={(e) =>
                  setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Why is this listing being rejected?"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setRejectDialog({ open: false, id: "", reason: "" })
                }
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!rejectDialog.reason.trim() || !!loadingId}
                onClick={handleReject}
              >
                Reject listing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
