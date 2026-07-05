import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "~/components/admin/admin-shell";
import {
  fetchCurrentUser,
  fetchCurrentUserPermissions,
} from "~/server/auth.functions";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/" });
    }
  },
  loader: async () => {
    const [user, permissions] = await Promise.all([
      fetchCurrentUser(),
      fetchCurrentUserPermissions(),
    ]);
    if (!user || !permissions.includes("admin:access")) {
      throw redirect({ to: "/" });
    }
    return { user, permissions };
  },
});

function AdminLayout() {
  const { permissions } = Route.useLoaderData();
  return <AdminShell permissions={permissions} />;
}
