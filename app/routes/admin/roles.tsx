import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { PageHeader } from "~/components/admin/page-header";
import {
  fetchCurrentUser,
  fetchAllPermissions,
  fetchRolePermissions,
  updateRolePermissions,
} from "~/server/auth.functions";

const ROLES = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super admin" },
] as const;

export const Route = createFileRoute("/admin/roles")({
  component: AdminRolesPage,
  loader: async () => {
    const [user, permissions] = await Promise.all([
      fetchCurrentUser(),
      fetchAllPermissions(),
    ]);
    return { user, permissions };
  },
});

function AdminRolesPage() {
  const { user, permissions } = Route.useLoaderData();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const canManage = user?.isSuperAdmin ?? false;

  useEffect(() => {
    setLoading(true);
    fetchRolePermissions({ data: { role: selectedRole as never } })
      .then((perms) => setRolePermissions(perms))
      .finally(() => setLoading(false));
  }, [selectedRole]);

  const togglePermission = (key: string) => {
    if (!canManage) return;
    setRolePermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!canManage) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateRolePermissions({
        data: { role: selectedRole as never, permissionKeys: rolePermissions },
      });
      await router.invalidate();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Control what each role can do in the admin dashboard"
      />

      {!canManage && (
        <p className="rounded-md border border-celis-caution bg-celis-caution-subtle p-3 text-sm text-celis-ink">
          Only super admins can manage role permissions.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <Button
            key={role.value}
            variant={selectedRole === role.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRole(role.value)}
          >
            {role.label}
            {role.value === "super_admin" && (
              <Badge variant="secondary" className="ml-2">
                all
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <Card className="border-celis-border bg-celis-surface-base">
        <CardHeader>
          <CardTitle className="text-lg">
            {ROLES.find((r) => r.value === selectedRole)?.label} permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-celis-ink-secondary">Loading...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {permissions.map((permission) => {
                const checked = rolePermissions.includes(permission.key);
                return (
                  <div
                    key={permission.key}
                    className="flex items-start justify-between gap-3 rounded-md border border-celis-border p-3"
                  >
                    <div>
                      <p className="font-medium text-celis-ink">
                        {permission.label}
                      </p>
                      <p className="text-xs text-celis-ink-secondary">
                        {permission.description}
                      </p>
                      <code className="mt-1 block text-[10px] text-celis-ink-tertiary">
                        {permission.key}
                      </code>
                    </div>
                    <Switch
                      checked={checked}
                      disabled={!canManage || selectedRole === "super_admin"}
                      onCheckedChange={() => togglePermission(permission.key)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={!canManage || saving || loading}>
              {saving ? "Saving..." : "Save permissions"}
            </Button>
            {saved && <span className="text-sm text-celis-success">Saved.</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
