import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Combobox } from "~/components/ui/combobox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { PageHeader } from "~/components/admin/page-header";
import { AdminTable } from "~/components/admin/admin-table";
import { ConfirmDialog } from "~/components/admin/confirm-dialog";
import {
  fetchAdminListingPackages,
  createAdminListingPackage,
  updateAdminListingPackage,
  archiveAdminListingPackage,
  deleteAdminListingPackage,
  assignAdminSellerPackage,
  fetchSellerByNumber,
} from "~/server/admin.functions";
import { fetchCurrentUserPermissions } from "~/server/auth.functions";
import { formatPrice } from "~/lib/format";

export const Route = createFileRoute("/admin/packages")({
  component: AdminPackagesPage,
  head: () => ({
    meta: [
      { title: "Listing packages | Admin | Celis" },
      { name: "description", content: "Manage seller listing packages in Celis admin." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),

  loader: async () => {
    const [packages, permissions] = await Promise.all([
      fetchAdminListingPackages(),
      fetchCurrentUserPermissions(),
    ]);
    return { packages, permissions };
  },
});

interface PackageForm {
  code: string;
  name: string;
  description: string;
  sellerTypeEligibility: "individual" | "shop" | "";
  listingAllowance: number;
  isUnlimited: boolean;
  featuredAllowance: number;
  durationDays: number;
  price: number;
  currency: string;
  autoRenew: boolean;
  gracePeriodDays: number;
}

const emptyForm: PackageForm = {
  code: "",
  name: "",
  description: "",
  sellerTypeEligibility: "",
  listingAllowance: 10,
  isUnlimited: false,
  featuredAllowance: 0,
  durationDays: 30,
  price: 0,
  currency: "USD",
  autoRenew: false,
  gracePeriodDays: 0,
};

function AdminPackagesPage() {
  const { packages, permissions } = Route.useLoaderData();
  const canManage = permissions.includes("settings:manage");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<typeof packages[number] | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    kind: "status" | "archive" | "delete";
    pkg: typeof packages[number] | null;
    nextActive: boolean;
  }>({ open: false, kind: "status", pkg: null, nextActive: false });
  const [actionLoading, setActionLoading] = useState(false);

  // The edit dialog keeps a snapshot in `editing`; read live values from the
  // freshly loaded list so the Active switch reflects the persisted state.
  const editingLive = editing
    ? packages.find((p) => p.id === editing.id) ?? editing
    : null;
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSellerNumber, setAssignSellerNumber] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assignPackageId, setAssignPackageId] = useState("");
  const [assignSource, setAssignSource] = useState("admin");
  const [assignPaymentRef, setAssignPaymentRef] = useState("");
  const [assignPricePaid, setAssignPricePaid] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [verifiedSeller, setVerifiedSeller] = useState<{
    id: string;
    email: string;
    displayName: string | null;
    sellerType: "individual" | "shop" | null;
    verificationStatus: string;
    isVerified: boolean;
  } | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const packageOptions = packages
    .filter((p) => p.isActive)
    .map((p) => ({
      value: p.id,
      label: `${p.name} (${p.listingAllowance} listings / ${p.durationDays} days)`,
    }));

  const reset = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const openCreate = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (pkg: typeof packages[number]) => {
    setEditing(pkg);
    setForm({
      code: pkg.code ?? "",
      name: pkg.name,
      description: pkg.description ?? "",
      sellerTypeEligibility:
        pkg.sellerTypeEligibility === "individual" || pkg.sellerTypeEligibility === "shop"
          ? pkg.sellerTypeEligibility
          : "",
      listingAllowance: pkg.listingAllowance,
      isUnlimited: pkg.isUnlimited,
      featuredAllowance: pkg.featuredAllowance ?? 0,
      durationDays: pkg.durationDays,
      price: pkg.price,
      currency: pkg.currency,
      autoRenew: pkg.autoRenew,
      gracePeriodDays: pkg.gracePeriodDays ?? 0,
    });
    setOpen(true);
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.code.trim()) return "Code is required.";
    if (!form.isUnlimited && (!Number.isFinite(form.listingAllowance) || form.listingAllowance < 1))
      return "Listing allowance must be at least 1 (or enable Unlimited).";
    if (!Number.isFinite(form.durationDays) || form.durationDays < 1)
      return "Duration must be at least 1 day.";
    if (!Number.isFinite(form.price) || form.price < 0)
      return "Price cannot be negative.";
    if (form.currency.trim().length !== 3)
      return "Currency must be a 3-letter code (e.g. USD).";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        sellerTypeEligibility:
          form.sellerTypeEligibility === ""
            ? undefined
            : form.sellerTypeEligibility,
      };
      if (editing) {
        await updateAdminListingPackage({
          data: { id: editing.id, ...payload },
        });
      } else {
        await createAdminListingPackage({ data: payload });
      }
      await router.invalidate();
      setFeedback({
        kind: "success",
        text: editing
          ? `Saved changes to ${form.name}.`
          : `Created package ${form.name}.`,
      });
      setOpen(false);
      reset();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save package"
      );
    } finally {
      setLoading(false);
    }
  };

  const applyStatus = async (
    pkg: typeof packages[number],
    nextActive: boolean
  ) => {
    if (!canManage) return;
    setActionLoading(true);
    try {
      await updateAdminListingPackage({
        data: { id: pkg.id, isActive: nextActive },
      });
      await router.invalidate();
      setActionDialog((prev) => ({ ...prev, open: false }));
      setFeedback({
        kind: "success",
        text: `${pkg.name} is now ${nextActive ? "active" : "inactive"}.`,
      });
    } catch (err) {
      setFeedback({
        kind: "error",
        text: err instanceof Error ? err.message : "Failed to update status",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = (
    pkg: typeof packages[number],
    nextActive: boolean
  ) => {
    if (!canManage) return;
    if (!nextActive) {
      // Deactivating cancels any live subscription on this package.
      setActionDialog({
        open: true,
        kind: "status",
        pkg,
        nextActive,
      });
      return;
    }
    void applyStatus(pkg, nextActive);
  };

  const handleArchive = async (pkg: typeof packages[number]) => {
    if (!canManage) return;
    setActionLoading(true);
    try {
      await archiveAdminListingPackage({ data: { id: pkg.id } });
      await router.invalidate();
      setActionDialog((prev) => ({ ...prev, open: false }));
      setFeedback({ kind: "success", text: `Archived ${pkg.name}.` });
    } catch (err) {
      setFeedback({
        kind: "error",
        text: err instanceof Error ? err.message : "Failed to archive package",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (pkg: typeof packages[number]) => {
    if (!canManage) return;
    setActionLoading(true);
    try {
      await deleteAdminListingPackage({ data: { id: pkg.id } });
      await router.invalidate();
      setActionDialog((prev) => ({ ...prev, open: false }));
      setFeedback({ kind: "success", text: `Deleted ${pkg.name}.` });
    } catch (err) {
      // Referenced packages are blocked server-side — surface the reason and
      // keep the dialog closed so the admin can archive instead.
      setActionDialog((prev) => ({ ...prev, open: false }));
      setFeedback({
        kind: "error",
        text: err instanceof Error ? err.message : "Failed to delete package",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignPackageId) return;
    if (!assignSellerNumber && !assignEmail) return;
    setAssignLoading(true);
    try {
      await assignAdminSellerPackage({
        data: {
          sellerNumber: assignSellerNumber || undefined,
          sellerEmail: assignEmail || undefined,
          packageId: assignPackageId,
          assignmentSource: assignSource,
          paymentReference: assignPaymentRef || undefined,
          pricePaidCents: assignPricePaid ? Number(assignPricePaid) : undefined,
        },
      });
      await router.invalidate();
      setAssignOpen(false);
      setAssignSellerNumber("");
      setAssignEmail("");
      setAssignPackageId("");
      setAssignSource("admin");
      setAssignPaymentRef("");
      setAssignPricePaid("");
      setVerifiedSeller(null);
      setVerifyError(null);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleVerifySeller = async () => {
    setVerifyError(null);
    setVerifiedSeller(null);
    if (!assignSellerNumber.trim()) return;
    setVerifyLoading(true);
    try {
      const seller = await fetchSellerByNumber({
        data: { sellerNumber: assignSellerNumber.trim() },
      });
      setVerifiedSeller(seller);
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listing packages"
        description="Manage packages for shop sellers"
        action={
          canManage ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                Assign to seller
              </Button>
              <Button onClick={openCreate}>Add package</Button>
            </div>
          ) : undefined
        }
      />

      {!canManage && (
        <p className="rounded-md border border-celis-caution bg-celis-caution-subtle p-3 text-sm text-celis-ink">
          Read-only: you need the “Manage settings” permission to create, edit,
          archive, or delete packages.
        </p>
      )}

      {feedback && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-md border p-3 text-sm ${
            feedback.kind === "success"
              ? "border-celis-success bg-celis-success-subtle text-celis-ink"
              : "border-celis-destructive bg-celis-destructive-subtle text-celis-ink"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            className="shrink-0 text-celis-ink-secondary hover:text-celis-ink"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <Card className="border-celis-border bg-celis-surface-base">
        <CardContent className="p-0">
          <AdminTable
            rows={packages}
            keyExtractor={(p) => p.id}
            columns={[
              {
                key: "name",
                header: "Package",
                cell: (p) => (
                  <div>
                    <p className="font-medium text-celis-ink">{p.name}</p>
                    <p className="text-xs text-celis-ink-secondary">
                      {p.description}
                    </p>
                  </div>
                ),
              },
              {
                key: "allowance",
                header: "Listings",
                cell: (p) => (
                  <span className="tabular-nums">
                    {p.isUnlimited ? "Unlimited" : p.listingAllowance}
                  </span>
                ),
              },
              {
                key: "featured",
                header: "Featured",
                cell: (p) => (
                  <span className="tabular-nums">
                    {p.featuredAllowance ?? "—"}
                  </span>
                ),
              },
              {
                key: "duration",
                header: "Duration",
                cell: (p) => (
                  <span className="tabular-nums">{p.durationDays} days</span>
                ),
              },
              {
                key: "price",
                header: "Price",
                cell: (p) => (
                  <span className="tabular-nums">
                    {formatPrice(p.price, p.currency)}
                  </span>
                ),
              },
              {
                key: "renewal",
                header: "Renewal",
                cell: (p) => (
                  <span className="text-xs">
                    {p.autoRenew ? "Auto" : "Manual"}
                    {p.gracePeriodDays ? ` · ${p.gracePeriodDays}d grace` : ""}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (p) => (
                  <Badge variant={p.isActive ? "success" : "outline"}>
                    {p.isActive ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "",
                cell: (p) => (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canManage}
                      onClick={() => openEdit(p)}
                    >
                      Edit
                    </Button>
                    {p.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canManage}
                        onClick={() =>
                          setActionDialog({
                            open: true,
                            kind: "archive",
                            pkg: p,
                            nextActive: false,
                          })
                        }
                      >
                        Archive
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!canManage}
                      onClick={() =>
                        setActionDialog({
                          open: true,
                          kind: "delete",
                          pkg: p,
                          nextActive: false,
                        })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-[calc(100vw-2rem)] overflow-y-auto p-4 sm:max-w-lg md:p-6">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit package" : "Add package"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellerType">Seller type</Label>
                <Select
                  value={form.sellerTypeEligibility}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      sellerTypeEligibility: v as PackageForm["sellerTypeEligibility"],
                    }))
                  }
                >
                  <SelectTrigger id="sellerType" className="w-full">
                    <SelectValue placeholder="All seller types" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[50vh]">
                    <SelectItem value="">All seller types</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="shop">Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="allowance">Listing allowance</Label>
                <Input
                  id="allowance"
                  type="number"
                  min={1}
                  disabled={form.isUnlimited}
                  value={form.listingAllowance}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      listingAllowance: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="featured">Featured allowance</Label>
                <Input
                  id="featured"
                  type="number"
                  min={0}
                  value={form.featuredAllowance}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      featuredAllowance: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="unlimited"
                checked={form.isUnlimited}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isUnlimited: checked }))
                }
              />
              <Label htmlFor="unlimited" className="cursor-pointer">
                Unlimited listings
              </Label>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  value={form.durationDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grace">Grace period (days)</Label>
                <Input
                  id="grace"
                  type="number"
                  min={0}
                  value={form.gracePeriodDays}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      gracePeriodDays: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (cents)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currency: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="autoRenew"
                checked={form.autoRenew}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, autoRenew: checked }))
                }
              />
              <Label htmlFor="autoRenew" className="cursor-pointer">
                Auto-renew
              </Label>
            </div>
            {editing && editingLive && (
              <div className="flex items-center gap-2">
                <Switch
                  id="package-active-toggle"
                  checked={editingLive.isActive}
                  disabled={!canManage || actionLoading}
                  onCheckedChange={(checked) =>
                    handleToggleActive(editingLive, checked)
                  }
                />
                <Label htmlFor="package-active-toggle">
                  {editingLive.isActive ? "Active" : "Inactive"}
                </Label>
              </div>
            )}
            {formError && (
              <p className="rounded-md border border-celis-destructive bg-celis-destructive-subtle p-2 text-sm text-celis-ink">
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !canManage}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          setActionDialog((prev) => ({ ...prev, open }))
        }
        title={
          actionDialog.kind === "delete"
            ? `Delete ${actionDialog.pkg?.name ?? "package"}?`
            : actionDialog.kind === "archive"
            ? `Archive ${actionDialog.pkg?.name ?? "package"}?`
            : `Deactivate ${actionDialog.pkg?.name ?? "package"}?`
        }
        description={
          actionDialog.kind === "delete"
            ? `Permanently deletes "${actionDialog.pkg?.name}" (${
                actionDialog.pkg?.code ?? "no code"
              }). This is only allowed when no seller subscription has ever referenced it — otherwise archive it instead. This cannot be undone.`
            : actionDialog.kind === "archive"
            ? `Archives "${actionDialog.pkg?.name}". It stays in reports and history, disappears from new purchases and seller assignments, and any live subscription on it is cancelled.`
            : `"${actionDialog.pkg?.name}" will be hidden from new purchases and seller assignments, and any seller currently on it loses access. Existing subscription history is kept.`
        }
        confirmLabel={
          actionLoading
            ? "Working..."
            : actionDialog.kind === "delete"
            ? "Delete"
            : actionDialog.kind === "archive"
            ? "Archive"
            : "Deactivate"
        }
        destructive={actionDialog.kind !== "status"}
        loading={actionLoading}
        onConfirm={() => {
          if (!actionDialog.pkg) return;
          if (actionDialog.kind === "delete") {
            void handleDelete(actionDialog.pkg);
          } else if (actionDialog.kind === "archive") {
            void handleArchive(actionDialog.pkg);
          } else {
            void applyStatus(actionDialog.pkg, actionDialog.nextActive);
          }
        }}
      />

      <Dialog
        open={assignOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAssignSellerNumber("");
            setAssignEmail("");
            setAssignPackageId("");
            setAssignSource("admin");
            setAssignPaymentRef("");
            setAssignPricePaid("");
            setVerifiedSeller(null);
            setVerifyError(null);
          }
          setAssignOpen(open);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-[calc(100vw-2rem)] overflow-y-auto p-4 sm:max-w-md md:p-6">
          <DialogHeader>
            <DialogTitle>Assign package to seller</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sellerNumber">Seller number</Label>
              <div className="flex gap-2">
                <Input
                  id="sellerNumber"
                  value={assignSellerNumber}
                  onChange={(e) => {
                    setAssignSellerNumber(e.target.value);
                    setVerifiedSeller(null);
                    setVerifyError(null);
                  }}
                  placeholder="e.g. 12345678"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVerifySeller}
                  disabled={verifyLoading || !assignSellerNumber.trim()}
                >
                  {verifyLoading ? "..." : "Verify"}
                </Button>
              </div>
              {verifyError && (
                <p className="text-sm text-celis-destructive">{verifyError}</p>
              )}
              {verifiedSeller && (
                <div className="rounded-md border border-celis-border bg-celis-surface-inset p-3 text-sm">
                  <p>
                    <span className="text-celis-ink-secondary">Name:</span>{" "}
                    {verifiedSeller.displayName ?? "—"}
                  </p>
                  <p>
                    <span className="text-celis-ink-secondary">Email:</span>{" "}
                    {verifiedSeller.email}
                  </p>
                  <p>
                    <span className="text-celis-ink-secondary">Type:</span>{" "}
                    {verifiedSeller.sellerType ?? "—"}
                  </p>
                  <p>
                    <span className="text-celis-ink-secondary">Verification:</span>{" "}
                    {verifiedSeller.isVerified ? "Verified" : verifiedSeller.verificationStatus}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellerEmail">Or seller email</Label>
              <Input
                id="sellerEmail"
                type="email"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                placeholder="Optional if seller number is provided"
              />
            </div>
            <div className="space-y-2">
              <Label>Package</Label>
              <Combobox
                value={assignPackageId}
                onValueChange={setAssignPackageId}
                placeholder="Select package"
                searchPlaceholder="Search packages..."
                options={packageOptions}
              />

            </div>
            <div className="space-y-2">
              <Label htmlFor="assignSource">Assignment source</Label>
              <Select
                value={assignSource}
                onValueChange={setAssignSource}
              >
                <SelectTrigger id="assignSource">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin assignment</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="migration">Migration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentRef">Payment reference</Label>
              <Input
                id="paymentRef"
                value={assignPaymentRef}
                onChange={(e) => setAssignPaymentRef(e.target.value)}
                placeholder="Optional transaction ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePaid">Price paid (cents)</Label>
              <Input
                id="pricePaid"
                type="number"
                min={0}
                value={assignPricePaid}
                onChange={(e) => setAssignPricePaid(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  assignLoading ||
                  !assignPackageId ||
                  (!assignSellerNumber && !assignEmail) ||
                  (!!assignSellerNumber && !verifiedSeller)
                }
              >
                {assignLoading ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
