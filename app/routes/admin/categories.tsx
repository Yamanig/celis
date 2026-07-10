import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Pagination } from "~/components/ui/pagination";
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
import {
  fetchCurrentUserPermissions,
} from "~/server/auth.functions";
import { formatRelativeDate } from "~/lib/format";

const categoriesSearchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPage,
  head: () => ({
    meta: [
      { title: "Categories | Admin | Celis" },
      { name: "description", content: "Manage marketplace categories in Celis admin." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),

  validateSearch: categoriesSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const [categories, permissions] = await Promise.all([
      fetchAdminCategories({ data: { page: search.page, limit: 10 } }),
      fetchCurrentUserPermissions(),
    ]);
    return { categories, permissions };
  },
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
  const { categories, permissions } = Route.useLoaderData();
  const { items, page, totalPages } = categories;
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate({ from: "/admin/categories" });
  const canManage = permissions.includes("categories:manage");
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

  const reset = () => {
    setEditing(null);
    setForm({ name: "", slug: "", sortOrder: 0 });
  };

  const openCreate = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (cat: (typeof items)[number]) => {
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
    if (!canManage) return;
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
        action={
          canManage ? (
            <Button onClick={openCreate}>Add category</Button>
          ) : undefined
        }
      />

      {!canManage && (
        <p className="rounded-md border border-celis-caution bg-celis-caution-subtle p-3 text-sm text-celis-ink">
          Read-only: you cannot create or edit categories.
        </p>
      )}

      <AdminTable
        rows={items}
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
              <Button
                variant="outline"
                size="sm"
                disabled={!canManage}
                onClick={() => openEdit(c)}
              >
                Edit
              </Button>
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
                disabled={!canManage}
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
                disabled={!canManage}
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
                disabled={!canManage}
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
              <Button type="submit" disabled={!canManage || loading}>
                {editing ? "Save changes" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
