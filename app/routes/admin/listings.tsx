import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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

const STATUSES = [
  "active",
  "pending_review",
  "draft",
  "sold",
  "expired",
  "rejected",
  "suspended",
];

function AdminListingsPage() {
  const { listings, categories } = Route.useLoaderData();
  const { items, page, totalPages } = listings;
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate({ from: "/admin/listings" });
  const [status, setStatus] = useState<string>(search.status ?? "");
  const [categoryId, setCategoryId] = useState<string>(search.categoryId ?? "");
  const [loadingId, setLoadingId] = useState<string | null>(null);
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
      <PageHeader title="Listings" description="Moderate marketplace listings" />

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
