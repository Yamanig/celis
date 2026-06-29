import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { AdminTable } from "~/components/admin/admin-table";
import { PageHeader } from "~/components/admin/page-header";
import {
  fetchAdminCategories,
  createAdminCategory,
  updateAdminCategory,
} from "~/server/admin.functions";
import { formatRelativeDate } from "~/lib/format";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPage,
  loader: async () => fetchAdminCategories(),
});

interface CategoryForm {
  name: string;
  slug: string;
  sortOrder: number;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function AdminCategoriesPage() {
  const categories = Route.useLoaderData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
  } | null>(null);
  const [form, setForm] = useState<CategoryForm>({
    name: "",
    slug: "",
    sortOrder: 0,
  });
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEditing(null);
    setForm({ name: "", slug: "", sortOrder: 0 });
  };

  const openCreate = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (cat: (typeof categories)[number]) => {
    setEditing({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      sortOrder: cat.sortOrder ?? 0,
    });
    setForm({
      name: cat.name,
      slug: cat.slug,
      sortOrder: cat.sortOrder ?? 0,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await updateAdminCategory({
          data: {
            id: editing.id,
            name: form.name,
            slug: form.slug,
            sortOrder: form.sortOrder,
          },
        });
      } else {
        await createAdminCategory({
          data: {
            name: form.name,
            slug: form.slug,
            sortOrder: form.sortOrder,
          },
        });
      }
      await router.invalidate();
      setOpen(false);
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage marketplace categories"
        action={<Button onClick={openCreate}>Add category</Button>}
      />

      <AdminTable
        rows={categories}
        keyExtractor={(c) => c.id}
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (c) => (
              <div>
                <p className="font-medium text-celis-ink">{c.name}</p>
                <p className="text-xs text-celis-ink-secondary">/{c.slug}</p>
              </div>
            ),
          },
          {
            key: "listings",
            header: "Listings",
            cell: (c) => <span className="tabular-nums">{c.listingCount}</span>,
          },
          {
            key: "sort",
            header: "Sort order",
            cell: (c) => <span className="tabular-nums">{c.sortOrder ?? 0}</span>,
          },
          {
            key: "created",
            header: "Created",
            cell: (c) => (
              <span className="text-xs text-celis-ink-secondary">
                {formatRelativeDate(c.createdAt)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            cell: (c) => (
              <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                Edit
              </Button>
            ),
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit category" : "Add category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: editing ? f.slug : slugify(e.target.value),
                  }))
                }
                placeholder="Electronics"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
                }
                placeholder="electronics"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort">Sort order</Label>
              <Input
                id="sort"
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sortOrder: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {editing ? "Save changes" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
