import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useOptimistic, useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  fetchUnverifiedSellers,
  reviewAdminSellerVerification,
} from "~/server/admin.functions";
import { fetchCurrentUserPermissions } from "~/server/auth.functions";
import { formatRelativeDate } from "~/lib/format";
import { Search } from "lucide-react";

const verificationsSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["pending", "rejected", "suspended"]).optional().default("pending"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/verifications")({
  component: AdminVerificationsPage,
  head: () => ({
    meta: [
      { title: "Seller verifications | Admin | Celis" },
      { name: "description", content: "Review and approve seller verification requests in Celis admin." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),

  validateSearch: verificationsSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const [result, permissions] = await Promise.all([
      fetchUnverifiedSellers({
        data: {
          search: search.search,
          status: search.status,
          page: search.page,
          limit: 10,
        },
      }),
      fetchCurrentUserPermissions(),
    ]);
    return { result, permissions };
  },
});

function AdminVerificationsPage() {
  const { result, permissions } = Route.useLoaderData();
  const { items, page, totalPages } = result;
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate({ from: "/admin/verifications" });
  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    id: string;
    action: "approve" | "reject" | "suspend";
    reason: string;
  }>({ open: false, id: "", action: "approve", reason: "" });

  const canVerify = permissions.includes("seller:verify");

  useEffect(() => {
    setSearchInput(search.search ?? "");
  }, [search.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          search: searchInput || undefined,
          page: 1,
        }),
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, navigate]);

  const [optimisticSellers, updateOptimisticSeller] = useOptimistic(
    items,
    (
      state,
      update: { id: string; patch: Partial<(typeof items)[number]> }
    ) => state.map((s) => (s.id === update.id ? { ...s, ...update.patch } : s))
  );

  const openDialog = (id: string, action: "approve" | "reject" | "suspend") => {
    setDialog({ open: true, id, action, reason: "" });
  };

  const handleReview = async () => {
    if (!canVerify) return;
    setLoadingId(dialog.id);
    updateOptimisticSeller({
      id: dialog.id,
      patch: {
        verificationStatus:
          dialog.action === "approve"
            ? "approved"
            : dialog.action === "reject"
            ? "rejected"
            : "suspended",
        verificationRejectionReason: dialog.reason || null,
      },
    });
    try {
      await reviewAdminSellerVerification({
        data: {
          id: dialog.id,
          action: dialog.action,
          reason: dialog.reason,
        },
      });
      await router.invalidate();
    } finally {
      setLoadingId(null);
      setDialog((d) => ({ ...d, open: false }));
    }
  };

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    rejected: "Rejected",
    suspended: "Suspended",
  };

  const dialogTitle =
    dialog.action === "approve"
      ? "Approve seller verification"
      : dialog.action === "reject"
      ? "Reject seller verification"
      : "Suspend seller verification";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller verifications"
        description="Review pending, rejected and suspended seller accounts"
      />

      <Card className="border-celis-border bg-celis-surface-base">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-celis-ink-tertiary" />
            <Input
              placeholder="Search by email, name or phone"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={search.status ?? "pending"}
            onValueChange={(value) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  status: value as z.infer<typeof verificationsSearchSchema>["status"],
                  page: 1,
                }),
              })
            }
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <AdminTable
        rows={optimisticSellers}
        keyExtractor={(s) => s.id}
        columns={[
          {
            key: "seller",
            header: "Seller",
            cell: (s) => (
              <div>
                <p className="font-medium text-celis-ink">
                  {s.displayName ?? s.email}
                </p>
                <p className="text-xs text-celis-ink-secondary">{s.email}</p>
                {s.phone && (
                  <p className="text-xs text-celis-ink-tertiary">{s.phone}</p>
                )}
              </div>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (s) => (
              <div className="text-sm">
                <span className="capitalize text-celis-ink-secondary">
                  {s.sellerType.replace(/_/g, " ")}
                </span>
                {s.businessName && (
                  <p className="text-xs text-celis-ink-secondary">
                    {s.businessName}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (s) => (
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.verificationStatus === "pending"
                    ? "bg-celis-caution/10 text-celis-caution"
                    : s.verificationStatus === "rejected"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-celis-ink-secondary/10 text-celis-ink-secondary"
                }`}
              >
                {statusLabel[s.verificationStatus] ?? s.verificationStatus}
              </span>
            ),
          },
          {
            key: "reason",
            header: "Reason",
            cell: (s) => (
              <span className="text-xs text-celis-ink-secondary">
                {s.verificationRejectionReason ?? "—"}
              </span>
            ),
          },
          {
            key: "joined",
            header: "Joined",
            cell: (s) => (
              <span className="text-xs text-celis-ink-secondary">
                {formatRelativeDate(s.createdAt)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            cell: (s) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={!canVerify || loadingId === s.id}
                  onClick={() => openDialog(s.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canVerify || loadingId === s.id}
                  onClick={() => openDialog(s.id, "reject")}
                >
                  Reject
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!canVerify || loadingId === s.id}
                  onClick={() => openDialog(s.id, "suspend")}
                >
                  Suspend
                </Button>
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

      <Dialog open={dialog.open} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialog.action === "approve"
                ? "This seller will be marked as verified and can publish listings."
                : "Add a reason below. The reason will be recorded in the audit log."}
            </DialogDescription>
          </DialogHeader>
          {dialog.action !== "approve" && (
            <div className="py-2">
              <Input
                placeholder="Reason (required for audit log)"
                value={dialog.reason}
                onChange={(e) => setDialog((d) => ({ ...d, reason: e.target.value }))}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog((d) => ({ ...d, open: false }))}
              disabled={loadingId === dialog.id}
            >
              Cancel
            </Button>
            <Button
              variant={dialog.action === "approve" ? "default" : "destructive"}
              onClick={handleReview}
              disabled={loadingId === dialog.id}
            >
              {dialog.action === "approve" ? "Approve" : dialog.action === "reject" ? "Reject" : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
