import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
  deleteAdminCategory,
} from "~/server/admin.functions";
import {
  fetchCurrentUserPermissions,
} from "~/server/auth.functions";
import {
  fetchCategoryConditions,
  saveCategoryConditions,
  fetchCategoryMetadataSchema,
  saveCategoryMetadataSchema,
} from "~/server/categories.functions";

import { formatRelativeDate } from "~/lib/format";
import type {
  MetadataField,
  CategoryMetadataSchema,
} from "~/lib/category-metadata";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / No" },
  { value: "select", label: "Select" },
] as const;

const categoriesSearchSchema = z.object({
  categoryId: z.string().uuid().optional(),
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
      fetchAdminCategories({ data: { parentId: null, page: search.page, limit: 10 } }),
      fetchCurrentUserPermissions(),
    ]);
    const subcategories = search.categoryId
      ? await fetchAdminCategories({
          data: { parentId: search.categoryId, page: 1, limit: 100 },
        })
      : null;
    return { categories, subcategories, permissions };
  },
});

interface CategoryForm {
  name: string;
  slug: string;
  sortOrder: number;
  parentId?: string;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function AdminCategoriesPage() {
  const { categories, subcategories, permissions } = Route.useLoaderData();
  const { items, page, totalPages } = categories;
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate({ from: "/admin/categories" });
  const canManage = permissions.includes("categories:manage");
  const selectedCategory = items.find((category) => category.id === search.categoryId) ?? null;
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
  const [creatingSubcategoryOf, setCreatingSubcategoryOf] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [conditionsCategory, setConditionsCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [conditions, setConditions] = useState<
    Array<{
      code: string;
      label: string;
      description: string;
      sortOrder: number;
      isActive: boolean;
    }>
  >([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [fieldsCategory, setFieldsCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [fields, setFields] = useState<MetadataField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    category: (typeof items)[number] | null;
  }>({ open: false, category: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    setCreatingSubcategoryOf(null);
    setForm({ name: "", slug: "", sortOrder: 0 });
  };

  const openCreate = () => {
    reset();
    setOpen(true);
  };

  const openCreateSubcategory = (parent: (typeof items)[number]) => {
    reset();
    setCreatingSubcategoryOf({ id: parent.id, name: parent.name });
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
            parentId: creatingSubcategoryOf?.id,
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

  const handleDelete = async () => {
    if (!canManage || !deleteDialog.category) return;
    setDeleteLoading(true);
    try {
      await deleteAdminCategory({ data: { id: deleteDialog.category.id } });
      await router.invalidate();
      setDeleteDialog({ open: false, category: null });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openConditions = async (cat: (typeof items)[number]) => {
    setConditionsCategory({ id: cat.id, name: cat.name });
    setConditionsLoading(true);
    try {
      const rows = await fetchCategoryConditions({ data: { categoryId: cat.id } });
      setConditions(
        rows.map((r) => ({
          code: r.code,
          label: r.label,
          description: r.description ?? "",
          sortOrder: r.sortOrder,
          isActive: true,
        }))
      );
      setConditionsOpen(true);
    } finally {
      setConditionsLoading(false);
    }
  };

  const handleSaveConditions = async () => {
    if (!conditionsCategory || !canManage) return;
    setConditionsLoading(true);
    try {
      await saveCategoryConditions({
        data: {
          categoryId: conditionsCategory.id,
          conditions: conditions.map((c) => ({
            ...c,
            description: c.description || undefined,
          })),
        },
      });
      await router.invalidate();
      setConditionsOpen(false);
    } finally {
      setConditionsLoading(false);
    }
  };

  const openFields = async (cat: (typeof items)[number]) => {
    setFieldsCategory({ id: cat.id, name: cat.name });
    setFieldsLoading(true);
    try {
      const schema = await fetchCategoryMetadataSchema({ data: { categoryId: cat.id } });
      setFields(schema?.fields ?? []);
      setFieldsOpen(true);
    } finally {
      setFieldsLoading(false);
    }
  };

  const handleSaveFields = async () => {
    if (!fieldsCategory || !canManage) return;
    const invalid = fields.some((f) => !f.key.trim() || !f.label.trim());
    if (invalid) {
      alert("Each field needs a key and a label.");
      return;
    }
    const selectWithoutOptions = fields.some(
      (f) => f.type === "select" && (!f.options || f.options.length === 0)
    );
    if (selectWithoutOptions) {
      alert("Select fields need at least one option.");
      return;
    }
    setFieldsLoading(true);
    try {
      const schema: CategoryMetadataSchema = {
        fields: fields.map((f) => ({
          ...f,
          options: f.type === "select" ? f.options : undefined,
        })),
      };
      await saveCategoryMetadataSchema({
        data: { categoryId: fieldsCategory.id, schema },
      });
      await router.invalidate();
      setFieldsOpen(false);
    } finally {
      setFieldsLoading(false);
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

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
        <Card className="h-fit border-celis-border bg-celis-surface-base">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Main categories</CardTitle>
            <p className="text-sm text-celis-ink-secondary">
              Select a category to manage its subcategories.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((category) => {
              const selected = category.id === search.categoryId;
              return (
                <div key={category.id} className="relative">
                  <button
                    type="button"
                    aria-expanded={selected}
                    className={`flex w-full items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-celis-border bg-celis-surface-inset hover:border-primary/50"
                    }`}
                    onClick={() =>
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          categoryId: selected ? undefined : category.id,
                        }),
                      })
                    }
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-sm text-celis-ink-secondary">
                      {category.childCount > 0 ? (selected ? "▾" : "›") : "·"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-celis-ink">{category.name}</span>
                      <span className="block truncate text-xs text-celis-ink-secondary">/{category.slug}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-celis-surface-base px-2 py-1 text-xs tabular-nums text-celis-ink-secondary">
                      {category.childCount}
                    </span>
                  </button>

                  {selected && (
                    <div className="relative ml-5 border-l border-celis-border pl-4 pt-2">
                      {(subcategories?.items ?? []).map((child) => (
                        <div key={child.id} className="relative flex items-center gap-2 py-1.5 before:absolute before:-left-4 before:top-1/2 before:h-px before:w-3 before:bg-celis-border">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-celis-ink">{child.name}</p>
                            <p className="truncate text-xs text-celis-ink-tertiary">{child.listingCount} listings</p>
                          </div>
                        </div>
                      ))}
                      {(subcategories?.items.length ?? 0) === 0 && (
                        <p className="relative py-2 text-xs text-celis-ink-tertiary before:absolute before:-left-4 before:top-1/2 before:h-px before:w-3 before:bg-celis-border">
                          No subcategories
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="min-w-0 border-celis-border bg-celis-surface-base">
          {selectedCategory ? (
            <>
              <CardHeader className="gap-3 border-b border-celis-border">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <CardTitle>{selectedCategory.name}</CardTitle>
                    <p className="mt-1 text-sm text-celis-ink-secondary">
                      {subcategories?.total ?? 0} subcategories · {selectedCategory.listingCount} direct listings
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" disabled={!canManage} onClick={() => openEdit(selectedCategory)}>
                      Edit category
                    </Button>
                    <Button size="sm" disabled={!canManage} onClick={() => openCreateSubcategory(selectedCategory)}>
                      Add subcategory
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!canManage || selectedCategory.listingCount > 0 || selectedCategory.childCount > 0}
                      title={
                        selectedCategory.listingCount > 0 || selectedCategory.childCount > 0
                          ? "Remove listings and subcategories first"
                          : "Delete category"
                      }
                      onClick={() => setDeleteDialog({ open: true, category: selectedCategory })}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <AdminTable
                  rows={subcategories?.items ?? []}
                  keyExtractor={(c) => c.id}
                  columns={[
                    {
                      key: "name",
                      header: "Subcategory",
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
                      key: "configuration",
                      header: "Listing form",
                      cell: (c) => (
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" disabled={!canManage || conditionsLoading} onClick={() => openConditions(c)}>
                            Conditions
                          </Button>
                          <Button variant="outline" size="sm" disabled={!canManage || fieldsLoading} onClick={() => openFields(c)}>
                            Fields
                          </Button>
                        </div>
                      ),
                    },
                    {
                      key: "updated",
                      header: "Created",
                      cell: (c) => (
                        <span className="text-xs text-celis-ink-secondary">{formatRelativeDate(c.createdAt)}</span>
                      ),
                    },
                    {
                      key: "actions",
                      header: "",
                      cell: (c) => (
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" disabled={!canManage} onClick={() => openEdit(c)}>Edit</Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={!canManage || c.listingCount > 0 || c.childCount > 0}
                            title={c.listingCount > 0 || c.childCount > 0 ? "Remove listings and nested subcategories first" : "Delete subcategory"}
                            onClick={() => setDeleteDialog({ open: true, category: c })}
                          >
                            Remove
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
                {(subcategories?.items.length ?? 0) === 0 && (
                  <div className="p-8 text-center">
                    <p className="font-medium text-celis-ink">No subcategories yet</p>
                    <p className="mt-1 text-sm text-celis-ink-secondary">
                      Add a subcategory before configuring listing conditions and fields.
                    </p>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex min-h-72 items-center justify-center p-8 text-center">
              <div>
                <p className="font-medium text-celis-ink">Choose a main category</p>
                <p className="mt-1 max-w-sm text-sm text-celis-ink-secondary">
                  Its subcategories and listing-form configuration will load here only when selected.
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

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
              {editing
                ? "Edit category"
                : creatingSubcategoryOf
                ? `Add subcategory under ${creatingSubcategoryOf.name}`
                : "Add category"}
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

      <Dialog open={conditionsOpen} onOpenChange={setConditionsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Conditions for {conditionsCategory?.name}
            </DialogTitle>
          </DialogHeader>
          {conditionsLoading && conditions.length === 0 ? (
            <p className="text-sm text-celis-ink-secondary">Loading...</p>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto py-2">
              {conditions.length === 0 && (
                <p className="text-sm text-celis-ink-secondary">
                  No conditions configured. The listing form will hide the
                  condition field for this category.
                </p>
              )}
              {conditions.map((c, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 rounded-md border border-celis-border p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <div>
                    <Label className="text-xs">Code</Label>
                    <Input
                      value={c.code}
                      disabled={!canManage}
                      placeholder="e.g. healthy"
                      onChange={(e) =>
                        setConditions((prev) =>
                          prev.map((cond, i) =>
                            i === idx
                              ? {
                                  ...cond,
                                  code: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_]/g, "_"),
                                }
                              : cond
                          )
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={c.label}
                      disabled={!canManage}
                      onChange={(e) =>
                        setConditions((prev) =>
                          prev.map((cond, i) =>
                            i === idx ? { ...cond, label: e.target.value } : cond
                          )
                        )
                      }
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Input
                      type="number"
                      className="w-20"
                      value={c.sortOrder}
                      disabled={!canManage}
                      onChange={(e) =>
                        setConditions((prev) =>
                          prev.map((cond, i) =>
                            i === idx
                              ? { ...cond, sortOrder: Number(e.target.value) || 0 }
                              : cond
                          )
                        )
                      }
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={!canManage}
                      onClick={() =>
                        setConditions((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      ×
                    </Button>
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={c.description}
                      disabled={!canManage}
                      onChange={(e) =>
                        setConditions((prev) =>
                          prev.map((cond, i) =>
                            i === idx
                              ? { ...cond, description: e.target.value }
                              : cond
                          )
                        )
                      }
                    />
                  </div>
                </div>
              ))}
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setConditions((prev) => [
                      ...prev,
                      {
                        code: "",
                        label: "",
                        description: "",
                        sortOrder: prev.length + 1,
                        isActive: true,
                      },
                    ])
                  }
                >
                  Add condition
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConditionsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canManage || conditionsLoading}
              onClick={handleSaveConditions}
            >
              {conditionsLoading ? "Saving..." : "Save conditions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fieldsOpen} onOpenChange={setFieldsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Fields for {fieldsCategory?.name}</DialogTitle>
          </DialogHeader>
          {fieldsLoading && fields.length === 0 ? (
            <p className="text-sm text-celis-ink-secondary">Loading...</p>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto py-2">
              {fields.length === 0 && (
                <p className="text-sm text-celis-ink-secondary">
                  No custom fields configured. Sellers will only see the standard
                  title, description, price, and condition for this category.
                </p>
              )}
              {fields.map((f, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 rounded-md border border-celis-border p-3"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={f.label}
                        disabled={!canManage}
                        onChange={(e) =>
                          setFields((prev) =>
                            prev.map((field, i) =>
                              i === idx ? { ...field, label: e.target.value } : field
                            )
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Key</Label>
                      <Input
                        value={f.key}
                        disabled={!canManage}
                        onChange={(e) =>
                          setFields((prev) =>
                            prev.map((field, i) =>
                              i === idx
                                ? {
                                    ...field,
                                    key: e.target.value
                                      .toLowerCase()
                                      .replace(/[^a-z0-9_]/g, "_"),
                                  }
                                : field
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <select
                        className="h-10 w-full rounded-md border border-celis-border bg-celis-surface-inset px-2 text-sm"
                        value={f.type}
                        disabled={!canManage}
                        onChange={(e) =>
                          setFields((prev) =>
                            prev.map((field, i) =>
                              i === idx
                                ? {
                                    ...field,
                                    type: e.target.value as MetadataField["type"],
                                    options:
                                      e.target.value === "select" ? field.options ?? [""] : undefined,
                                  }
                                : field
                            )
                          )
                        }
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={f.required ?? false}
                          disabled={!canManage}
                          onChange={(e) =>
                            setFields((prev) =>
                              prev.map((field, i) =>
                                i === idx ? { ...field, required: e.target.checked } : field
                              )
                            )
                          }
                        />
                        Required
                      </label>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!canManage}
                        onClick={() =>
                          setFields((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                  {f.type === "select" && (
                    <div>
                      <Label className="text-xs">Options (one per line)</Label>
                      <textarea
                        className="h-20 w-full rounded-md border border-celis-border bg-celis-surface-inset px-2 py-1 text-sm"
                        value={(f.options ?? []).join("\n")}
                        disabled={!canManage}
                        onChange={(e) =>
                          setFields((prev) =>
                            prev.map((field, i) =>
                              i === idx
                                ? {
                                    ...field,
                                    options: e.target.value
                                      .split("\n")
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  }
                                : field
                            )
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFields((prev) => [
                      ...prev,
                      { key: "", type: "text", label: "", required: false },
                    ])
                  }
                >
                  Add field
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFieldsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canManage || fieldsLoading}
              onClick={handleSaveFields}
            >
              {fieldsLoading ? "Saving..." : "Save fields"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-celis-ink-secondary">
            Are you sure you want to delete{" "}
            <strong>{deleteDialog.category?.name}</strong>? This cannot be undone.
            Subcategories must be removed first.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDeleteDialog({ open: false, category: null })
              }
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!canManage || deleteLoading}
              onClick={handleDelete}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
