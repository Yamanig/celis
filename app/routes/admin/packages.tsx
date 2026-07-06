import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PageHeader } from "~/components/admin/page-header";
import { AdminTable } from "~/components/admin/admin-table";
import {
  fetchAdminListingPackages,
  createAdminListingPackage,
  updateAdminListingPackage,
  assignAdminSellerPackage,
} from "~/server/admin.functions";

export const Route = createFileRoute("/admin/packages")({
  component: AdminPackagesPage,
  loader: async () => fetchAdminListingPackages(),
});

interface PackageForm {
  name: string;
  description: string;
  listingAllowance: number;
  durationDays: number;
  price: number;
  currency: string;
}

const emptyForm: PackageForm = {
  name: "",
  description: "",
  listingAllowance: 10,
  durationDays: 30,
  price: 0,
  currency: "USD",
};

function AdminPackagesPage() {
  const packages = Route.useLoaderData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<typeof packages[number] | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignPackageId, setAssignPackageId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

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
      name: pkg.name,
      description: pkg.description ?? "",
      listingAllowance: pkg.listingAllowance,
      durationDays: pkg.durationDays,
      price: pkg.price,
      currency: pkg.currency,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await updateAdminListingPackage({
          data: { id: editing.id, ...form },
        });
      } else {
        await createAdminListingPackage({ data: form });
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
    setAssignLoading(true);
    try {
      await assignAdminSellerPackage({
        data: { sellerEmail: assignEmail, packageId: assignPackageId },
      });
      await router.invalidate();
      setAssignOpen(false);
      setAssignEmail("");
      setAssignPackageId("");
    } finally {
      setAssignLoading(false);
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
                  <span className="tabular-nums">{p.listingAllowance}</span>
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
                    {p.price / 100} {p.currency}
                  </span>
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
        <DialogContent className="sm:max-w-md">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allowance">Listing allowance</Label>
                <Input
                  id="allowance"
                  type="number"
                  min={1}
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
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            {editing && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing.isActive}
                  onCheckedChange={async (checked) => {
                    await updateAdminListingPackage({
                      data: { id: editing.id, isActive: checked },
                    });
                    await router.invalidate();
                  }}
                />
                <Label>Active</Label>
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

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign package to seller</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sellerEmail">Seller email</Label>
              <Input
                id="sellerEmail"
                type="email"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Package</Label>
              <Select
                value={assignPackageId}
                onValueChange={setAssignPackageId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.listingAllowance} listings / {p.durationDays}{" "}
                      days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={assignLoading || !assignPackageId}>
                {assignLoading ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
