import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell } from "~/components/admin/admin-shell";

export const Route = createFileRoute("/admin")({
  component: AdminShell,
  beforeLoad: async ({ context }) => {
    if (!context.user || context.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
});
