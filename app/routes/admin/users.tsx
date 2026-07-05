import { createFileRoute, useRouter, useNavigate } from "@tanstack/react-router";
import { useEffect, useOptimistic, useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
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
  page: z.coerce.number().int().min(1).optional().default(1),
});

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
  validateSearch: usersSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps: { search } }) => {
    const [result, currentUser, permissions] = await Promise.all([
      fetchAdminUsers({
        data: {
          search: search.search,
          role: search.role,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage buyer, seller and admin accounts"
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
            value={role}
            onValueChange={(value) => {
              const next = value as z.infer<typeof usersSearchSchema>["role"];
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
              <SelectItem value="buyer">Buyer</SelectItem>
              <SelectItem value="seller">Seller</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
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
          {
            key: "role",
            header: "Role",
            cell: (u) => (
              <Select
                value={u.role}
                disabled={!canManageUsers || loadingId === u.id}
                onValueChange={(v) => handleRoleChange(u.id, v)}
              >
                <SelectTrigger className="h-8 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            ),
          },
          {
            key: "verified",
            header: "Verified",
            cell: (u) => <VerificationBadge verified={u.isVerified} />,
          },
          {
            key: "superadmin",
            header: "Super admin",
            cell: (u) => (
              <Switch
                checked={u.isSuperAdmin}
                disabled={!canManageUsers || !isCurrentUserSuper || loadingId === u.id}
                onCheckedChange={() => handleSuperAdmin(u.id)}
              />
            ),
          },
          {
            key: "joined",
            header: "Joined",
            cell: (u) => (
              <span className="text-xs text-celis-ink-secondary">
                {formatRelativeDate(u.createdAt)}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            cell: (u) => (
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
