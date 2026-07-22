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
import {
  fetchAdminListingPackages,
  createAdminListingPackage,
  updateAdminListingPackage,
  assignAdminSellerPackage,
  fetchSellerByNumber,
} from "~/server/admin.functions";
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

  loader: async () => fetchAdminListingPackages(),
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
  const packages = Route.useLoaderData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<typeof packages[number] | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setOpen(false);
      reset();
    } finally {
      setLoading(false);
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              Assign to seller
            </Button>
            <Button onClick={openCreate}>Add package</Button>
          </div>
        }
      />

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
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
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
            {editing && (
              <div className="flex items-center gap-2">
                <Switch
                  id="package-active-toggle"
                  checked={editing.isActive}
                  onCheckedChange={async (checked) => {
                    await updateAdminListingPackage({
                      data: { id: editing.id, isActive: checked },
                    });
                    await router.invalidate();
                  }}
                />
                <Label htmlFor="package-active-toggle">Active</Label>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
