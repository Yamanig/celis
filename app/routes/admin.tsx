import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "~/components/admin/admin-shell";
import { AdminShellPending } from "~/components/layout/route-pending";
import {
  fetchCurrentUser,
  fetchCurrentUserPermissions,
} from "~/server/auth.functions";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  pendingComponent: AdminShellPending,
  head: () => ({
    meta: [
      { title: "Admin | Celis" },
      { name: "description", content: "Celis admin dashboard." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),

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
