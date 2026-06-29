import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useOptimistic, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
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
import { formatRelativeDate } from "~/lib/format";
import { Search } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
  loader: async () => fetchAdminUsers(),
});

function AdminUsersPage() {
  const users = Route.useLoaderData();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [optimisticUsers, updateOptimisticUser] = useOptimistic(
    users,
    (
      state,
      update: {
        id: string;
        patch: Partial<(typeof users)[number]>;
      }
    ) => state.map((u) => (u.id === update.id ? { ...u, ...update.patch } : u))
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return optimisticUsers.filter((u) => {
      const matchesSearch =
        !term ||
        u.email.toLowerCase().includes(term) ||
        (u.displayName?.toLowerCase().includes(term) ?? false) ||
        (u.phone?.toLowerCase().includes(term) ?? false);
      const matchesRole = !role || u.role === role;
      return matchesSearch && matchesRole;
    });
  }, [optimisticUsers, search, role]);

  const handleRoleChange = async (id: string, next: string) => {
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={role} onValueChange={setRole}>
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
        </CardContent>
      </Card>

      <AdminTable
        rows={filtered}
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
                disabled={loadingId === u.id}
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
                disabled={loadingId === u.id}
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
                disabled={loadingId === u.id}
                onClick={() => handleVerify(u.id)}
              >
                {u.isVerified ? "Unverify" : "Verify"}
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
