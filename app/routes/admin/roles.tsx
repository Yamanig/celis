import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PageHeader } from "~/components/admin/page-header";
import {
  fetchCurrentUser,
  fetchAllPermissions,
  fetchRolePermissions,
  updateRolePermissions,
  fetchRoles,
  createRoleFn,
  updateRoleFn,
  deleteRoleFn,
} from "~/server/auth.functions";
import type { RoleRecord } from "~/server/auth.server";

export const Route = createFileRoute("/admin/roles")({
  component: AdminRolesPage,
  head: () => ({
    meta: [
      { title: "Roles & permissions | Admin | Celis" },
      { name: "description", content: "Manage user roles and permissions in Celis admin." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),

  loader: async () => {
    const [user, permissions, roles] = await Promise.all([
      fetchCurrentUser(),
      fetchAllPermissions(),
      fetchRoles(),
    ]);
    return { user, permissions, roles };
  },
});

function AdminRolesPage() {
  const { user, permissions, roles } = Route.useLoaderData();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [roleDialog, setRoleDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    role?: RoleRecord;
  }>({ open: false, mode: "create" });
  const [roleForm, setRoleForm] = useState({
    key: "",
    label: "",
    description: "",
    domain: "internal" as "customer" | "internal",
  });
  const [roleFormLoading, setRoleFormLoading] = useState(false);
  const [roleFormError, setRoleFormError] = useState<string | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    role?: RoleRecord;
  }>({ open: false });
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        data: { role: selectedRole, permissionKeys: rolePermissions },
      });
      await router.invalidate();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const openCreateRole = () => {
    setRoleForm({ key: "", label: "", description: "", domain: "internal" });
    setRoleFormError(null);
    setRoleDialog({ open: true, mode: "create" });
  };

  const openEditRole = (role: RoleRecord) => {
    setRoleForm({
      key: role.key,
      label: role.label,
      description: role.description ?? "",
      domain: role.domain,
    });
    setRoleFormError(null);
    setRoleDialog({ open: true, mode: "edit", role });
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setRoleFormLoading(true);
    setRoleFormError(null);
    try {
      if (roleDialog.mode === "create") {
        await createRoleFn({ data: roleForm });
      } else {
        await updateRoleFn({ data: roleForm });
      }
      await router.invalidate();
      setRoleDialog({ open: false, mode: "create" });
    } catch (err) {
      setRoleFormError(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setRoleFormLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!canManage || !deleteDialog.role) return;
    setDeleteLoading(true);
    try {
      await deleteRoleFn({ data: { key: deleteDialog.role.key } });
      await router.invalidate();
      if (selectedRole === deleteDialog.role.key) {
        setSelectedRole("admin");
      }
      setDeleteDialog({ open: false });
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectedRoleRecord = roles.find((r) => r.key === selectedRole);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Control what each role can do in the admin dashboard"
        action={
          canManage ? (
            <Button onClick={openCreateRole}>Create role</Button>
          ) : undefined
        }
      />

      {!canManage && (
        <p className="rounded-md border border-celis-caution bg-celis-caution-subtle p-3 text-sm text-celis-ink">
          Only super admins can manage role permissions.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <div key={role.key} className="flex items-center gap-1">
            <Button
              variant={selectedRole === role.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRole(role.key)}
            >
              {role.label}
              {role.key === "super_admin" && (
                <Badge variant="secondary" className="ml-2">
                  all
                </Badge>
              )}
            </Button>
            {canManage && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => openEditRole(role)}
                >
                  Edit
                </Button>
                {!role.isSystem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive"
                    onClick={() => setDeleteDialog({ open: true, role })}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Card className="border-celis-border bg-celis-surface-base">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedRoleRecord?.label ?? selectedRole} permissions
          </CardTitle>
          {selectedRoleRecord?.description && (
            <p className="text-sm text-celis-ink-secondary">
              {selectedRoleRecord.description}
            </p>
          )}
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

      <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog((d) => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {roleDialog.mode === "create" ? "Create role" : "Edit role"}
            </DialogTitle>
            <DialogDescription>
              {roleDialog.mode === "create"
                ? "Define a new role and assign permissions to it."
                : "Update the role name, description or domain."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-key">Role key</Label>
              <Input
                id="role-key"
                value={roleForm.key}
                onChange={(e) =>
                  setRoleForm((f) => ({ ...f, key: e.target.value }))
                }
                placeholder="e.g. finance_officer"
                disabled={roleDialog.mode === "edit"}
                required
              />
              <p className="text-xs text-celis-ink-tertiary">
                Machine identifier. Cannot be changed after creation.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-label">Display name</Label>
              <Input
                id="role-label"
                value={roleForm.label}
                onChange={(e) =>
                  setRoleForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder="e.g. Finance Officer"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="What can this role do?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-domain">Domain</Label>
              <Select
                value={roleForm.domain}
                onValueChange={(v) =>
                  setRoleForm((f) => ({ ...f, domain: v as "customer" | "internal" }))
                }
              >
                <SelectTrigger id="role-domain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal staff</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {roleFormError && (
              <p className="text-sm text-destructive">{roleFormError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRoleDialog({ open: false, mode: "create" })}
                disabled={roleFormLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={roleFormLoading}>
                {roleFormLoading ? "Saving..." : "Save role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((d) => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteDialog.role?.label}</strong>? This will also remove
              all permission assignments for this role.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false })}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
