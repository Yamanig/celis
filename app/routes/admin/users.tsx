import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useOptimistic, useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Pagination } from "~/components/ui/pagination";
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
  updateAdminUserRole,
  toggleAdminUserVerification,
  toggleAdminUserSuperAdmin,
} from "~/server/admin.functions";
import {
  fetchCurrentUser,
  fetchCurrentUserPermissions,
} from "~/server/auth.functions";
import { formatRelativeDate } from "~/lib/format";
import { Search } from "lucide-react";

const roleSchema = z.enum(["buyer", "seller", "admin"]);

const usersSearchSchema = z.object({
  search: z.string().optional(),
  role: roleSchema.optional(),
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
    const [result, currentUser, permissions] = await Promise.all([
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
    ]);
    return { result, currentUser, permissions };
  },
});

function AdminUsersPage() {
  const { result, currentUser, permissions } = Route.useLoaderData();
  const { items, page, totalPages } = result;
  const search = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate({ from: "/admin/users" });
  const [searchInput, setSearchInput] = useState(search.search ?? "");
  const [role, setRole] = useState<z.infer<typeof usersSearchSchema>["role"]>(
    search.role
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const canManageUsers = permissions.includes("users:manage");
  const isCurrentUserSuper = currentUser?.isSuperAdmin ?? false;

  useEffect(() => {
    setSearchInput(search.search ?? "");
  }, [search.search]);

  useEffect(() => {
    setRole(search.role);
  }, [search.role]);

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

  const domain = search.domain ?? "customer";
  const customerRoleOptions = [
    { value: "buyer", label: "Buyer" },
    { value: "seller", label: "Seller" },
  ];
  const internalRoleOptions = [
    { value: "admin", label: "Admin" },
    { value: "listing_review_officer", label: "Listing Review Officer" },
    { value: "seller_verification_officer", label: "Seller Verification Officer" },
    { value: "finance_officer", label: "Finance Officer" },
    { value: "support_officer", label: "Support Officer" },
    { value: "auditor", label: "Auditor" },
  ];
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage customer accounts and internal staff separately"
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
              placeholder="Search by email, name or phone"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={role ?? ""}
            onValueChange={(value) => {
              const next = value as z.infer<typeof usersSearchSchema>["role"] | undefined;
              setRole(next);
              navigate({
                search: (prev) => ({
                  ...prev,
                  role: next || undefined,
                  page: 1,
                }),
              });
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All roles</SelectItem>
              {roleOptions.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <Select
                value={u.role}
                disabled={!canManageUsers || loadingId === u.id}
                onValueChange={(v) => handleRoleChange(u.id, v)}
              >
                <SelectTrigger className="h-8 w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        onPageChange={(p) => navigate({ search: (prev) => ({ ...prev, page: p }) })}
      />
    </div>
  );
}
