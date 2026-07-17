import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useOptimistic, useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Pagination } from "~/components/ui/pagination";
import { Combobox } from "~/components/ui/combobox";
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
import { AdminTable } from "~/components/admin/admin-table";
import { PageHeader } from "~/components/admin/page-header";
import { VerificationBadge } from "~/components/admin/status-badge";
import {
  fetchAdminUsers,
  createAdminInternalUser,
  updateAdminUserRole,
  toggleAdminUserVerification,
  toggleAdminUserSuperAdmin,
} from "~/server/admin.functions";
import {
  fetchCurrentUser,
  fetchCurrentUserPermissions,
  fetchRoles,
} from "~/server/auth.functions";
import { formatRelativeDate } from "~/lib/format";
import { Search, Copy, Check } from "lucide-react";

const usersSearchSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  domain: z.enum(["customer", "internal"]).optional().default("customer"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
  head: () => ({
    meta: [
      { title: "Users | Admin | Celis" },
      { name: "description", content: "Manage users, roles, and verification in Celis admin." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),

  validateSearch: usersSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const [result, currentUser, permissions, roles] = await Promise.all([
      fetchAdminUsers({
        data: {
          search: search.search,
          role: search.role,
          domain: search.domain,
          page: search.page,
          limit: 10,
        },
      }),
      fetchCurrentUser(),
      fetchCurrentUserPermissions(),
      fetchRoles(),
    ]);
    return { result, currentUser, permissions, roles };
  },
});

function AdminUsersPage() {
  const { result, currentUser, permissions, roles } = Route.useLoaderData();
  const { items, page, totalPages } = result;
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate({ from: "/admin/users" });
  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const [role, setRole] = useState<string | undefined>(search.role);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    role: "listing_review_and_verification_officer",
    department: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const canManageUsers = permissions.includes("users:manage");
  const isCurrentUserSuper = currentUser?.isSuperAdmin ?? false;
  const baseUserRoleOptions = [
    { value: "", label: "All roles" },
    { value: "buyer", label: "Buyer" },
    { value: "seller", label: "Seller" },
    { value: "admin", label: "Admin" },
  ];
  const userRoleOptions = baseUserRoleOptions.filter((option) => option.value);

  useEffect(() => {
    setSearchInput(search.search ?? "");
  }, [search.search]);

  useEffect(() => {
    setRole(search.role);
  }, [search.role]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          search: searchInput || undefined,
          page: undefined,
        }),
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, navigate]);

  const [optimisticUsers, updateOptimisticUser] = useOptimistic(
    items,
    (
      state,
      update: {
        id: string;
        patch: Partial<(typeof items)[number]>;
      }
    ) => state.map((u) => (u.id === update.id ? { ...u, ...update.patch } : u))
  );

  const handleRoleChange = async (id: string, next: string) => {
    if (!canManageUsers) return;
    setLoadingId(id);
    updateOptimisticUser({ id, patch: { role: next as never } });
    try {
      await updateAdminUserRole({ data: { id, role: next as never } });
      await router.invalidate();
    } finally {
      setLoadingId(null);
    }
  };

  const handleVerify = async (id: string) => {
    if (!canManageUsers) return;
    setLoadingId(id);
    const user = optimisticUsers.find((u) => u.id === id);
    const nextVerified = !user?.isVerified;
    updateOptimisticUser({
      id,
      patch: { isVerified: nextVerified },
    });
    try {
      await toggleAdminUserVerification({ data: { id } });
      await router.invalidate();
    } finally {
      setLoadingId(null);
    }
  };

  const handleSuperAdmin = async (id: string) => {
    if (!canManageUsers || !isCurrentUserSuper) return;
    setLoadingId(id);
    const user = optimisticUsers.find((u) => u.id === id);
    updateOptimisticUser({
      id,
      patch: { isSuperAdmin: !user?.isSuperAdmin },
    });
    try {
      await toggleAdminUserSuperAdmin({ data: { id } });
      await router.invalidate();
    } finally {
      setLoadingId(null);
    }
  };

  const handleCopySellerNumber = async (id: string, sellerNumber: string) => {
    await navigator.clipboard.writeText(sellerNumber);
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
  };

  const domain = search.domain ?? "customer";
  const customerRoleOptions = roles
    .filter((r) => r.domain === "customer")
    .map((r) => ({ value: r.key, label: r.label }));
  const internalRoleOptions = roles
    .filter((r) => r.domain === "internal")
    .map((r) => ({ value: r.key, label: r.label }));
  const roleOptions = domain === "customer" ? customerRoleOptions : internalRoleOptions;

  const handleDomainChange = (next: "customer" | "internal") => {
    navigate({
      search: (prev) => ({
        ...prev,
        domain: next,
        role: undefined,
        page: 1,
      }),
    });
    setRole(undefined);
  };

  const handleCreateInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createAdminInternalUser({
        data: {
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          department: createForm.department || undefined,
        },
      });
      await router.invalidate();
      setCreateOpen(false);
      setCreateForm({
        email: "",
        password: "",
        role: "listing_review_and_verification_officer",
        department: "",
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage customer accounts and internal staff separately"
        action={
          domain === "internal" && canManageUsers ? (
            <Button onClick={() => setCreateOpen(true)}>Create internal user</Button>
          ) : undefined
        }
      />

      <Tabs value={domain} onValueChange={(v) => handleDomainChange(v as "customer" | "internal")}>
        <TabsList className="bg-celis-surface-inset">
          <TabsTrigger value="customer">Customers</TabsTrigger>
          <TabsTrigger value="internal">Internal Users</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-celis-border bg-celis-surface-base">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-celis-ink-tertiary" />
            <Input
              placeholder="Search by email, name, phone or seller number"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Combobox
            value={role}

            onValueChange={(value) => {
              const next = value as z.infer<typeof usersSearchSchema>["role"] | undefined;
              setRole(next);
              navigate({
                search: (prev) => ({
                  ...prev,
                  role: next || undefined,
                  page: undefined,
                }),
              });
            }}
            className="w-full sm:w-44"
            placeholder="All roles"
            options={roleOptions}
          />
          {!canManageUsers && (
            <p className="text-xs text-celis-ink-tertiary sm:self-center">
              Read-only: you cannot modify users.
            </p>
          )}
        </CardContent>
      </Card>

      <AdminTable
        rows={optimisticUsers}
        keyExtractor={(u) => u.id}
        columns={[
          {
            key: "user",
            header: "User",
            cell: (u) => (
              <div>
                <p className="font-medium text-celis-ink">
                  {u.displayName ?? u.email}
                </p>
                <p className="text-xs text-celis-ink-secondary">{u.email}</p>
                {u.phone && (
                  <p className="text-xs text-celis-ink-tertiary">{u.phone}</p>
                )}
                {u.sellerNumber && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="rounded bg-celis-surface-inset px-1.5 py-0.5 text-xs font-mono text-celis-ink-secondary">
                      {u.sellerNumber}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      aria-label="Copy seller number"
                      onClick={() => handleCopySellerNumber(u.id, u.sellerNumber!)}
                    >
                      {copiedId === u.id ? (
                        <Check className="h-3 w-3 text-celis-success" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ),
          },
          ...(domain === "customer"
            ? [
                {
                  key: "type" as const,
                  header: "Type",
                  cell: (u: (typeof optimisticUsers)[number]) => (
                    <div className="text-sm">
                      {u.role === "seller" && u.sellerType === "shop" ? (
                        <>
                          <span className="font-medium text-celis-primary">Shop</span>
                          {u.businessName && (
                            <p className="text-xs text-celis-ink-secondary">
                              {u.businessName}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-celis-ink-secondary">
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      )}
                    </div>
                  ),
                },
              ]
            : []),
          {
            key: "role",
            header: "Role",
            cell: (u) => (
              <Combobox
                value={u.role}
                disabled={!canManageUsers || loadingId === u.id}
                onValueChange={(v) => handleRoleChange(u.id, v)}
                className="w-32"
                options={userRoleOptions}
              />
            ),
          },
          {
            key: "verified",
            header: "Verified",
            cell: (u) => <VerificationBadge verified={u.isVerified} />,
          },
          ...(domain === "internal"
            ? [
                {
                  key: "superadmin" as const,
                  header: "Super admin",
                  cell: (u: (typeof optimisticUsers)[number]) => (
                    <Switch
                      checked={u.isSuperAdmin}
                      disabled={!canManageUsers || !isCurrentUserSuper || loadingId === u.id}
                      onCheckedChange={() => handleSuperAdmin(u.id)}
                    />
                  ),
                },
              ]
            : []),
          {
            key: "joined",
            header: "Joined",
            cell: (u) => (
              <span className="text-xs text-celis-ink-secondary">
                {formatRelativeDate(u.createdAt)}
              </span>
            ),
          },
          ...(domain === "customer"
            ? [
                {
                  key: "actions" as const,
                  header: "",
                  cell: (u: (typeof optimisticUsers)[number]) => (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canManageUsers || loadingId === u.id}
                      onClick={() => handleVerify(u.id)}
                    >
                      {u.isVerified ? "Unverify" : "Verify"}
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) =>
          navigate({ search: (prev) => ({ ...prev, page: p > 1 ? p : undefined }) })
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] max-w-[calc(100vw-2rem)] overflow-y-auto p-4 sm:max-w-md md:p-6">
          <DialogHeader>
            <DialogTitle>Create internal user</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateInternal} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ci-email">Email</Label>
              <Input
                id="ci-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ci-password">Password</Label>
              <Input
                id="ci-password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, password: e.target.value }))
                }
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ci-role">Role</Label>
              <Select
                value={createForm.role}
                onValueChange={(v) =>
                  setCreateForm((f) => ({ ...f, role: v }))
                }
              >
                <SelectTrigger id="ci-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[50vh]">
                  {internalRoleOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ci-department">Department</Label>
              <Input
                id="ci-department"
                value={createForm.department}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, department: e.target.value }))
                }
                placeholder="e.g. Operations"
              />
            </div>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? "Creating..." : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
