import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import { cn } from "~/lib/utils";
import { CelisLogo } from "~/components/branding/celis-logo";
import { ThemeToggle } from "~/components/theme/theme-toggle";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  LayoutGrid,
  Tags,
  Package,
  Wallet,
  FileText,
  Settings,
  ShieldCheck,
  ScrollText,
  Briefcase,
} from "lucide-react";

interface AdminShellProps {
  permissions: string[];
}

const nav = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: "admin:access",
  },
  { to: "/admin/users", label: "Users", icon: Users, permission: "users:read" },
  {
    to: "/admin/listings",
    label: "Listings",
    icon: LayoutGrid,
    permission: "listings:read",
  },
  {
    to: "/admin/categories",
    label: "Categories",
    icon: Tags,
    permission: "categories:manage",
  },
  {
    to: "/admin/orders",
    label: "Orders",
    icon: Package,
    permission: "orders:read",
  },
  {
    to: "/admin/payouts",
    label: "Payouts",
    icon: Wallet,
    permission: "payouts:read",
  },
  {
    to: "/admin/reports",
    label: "Reports",
    icon: FileText,
    permission: "reports:read",
  },
  {
    to: "/admin/audit-log",
    label: "Audit log",
    icon: ScrollText,
    permission: "audit:read",
  },
  {
    to: "/admin/roles",
    label: "Roles",
    icon: ShieldCheck,
    permission: "settings:manage",
  },
  {
    to: "/admin/packages",
    label: "Packages",
    icon: Briefcase,
    permission: "settings:manage",
  },
  {
    to: "/admin/settings",
    label: "Settings",
    icon: Settings,
    permission: "settings:manage",
  },
];

export function AdminShell({ permissions }: AdminShellProps) {
  const { location } = useRouterState();
  const pathname = location.pathname;

  const visibleNav = nav.filter((item) =>
    permissions.includes(item.permission)
  );

  return (
    <div className="flex min-h-screen bg-celis-bg">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-celis-border bg-celis-surface-base md:flex">
        <div className="flex h-16 items-center gap-2 px-4">
          <CelisLogo variant="primary" size={36} badge />
          <span className="font-semibold text-celis-ink">Admin</span>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {visibleNav.map((item) => {
            const active =
              item.to === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-celis-primary-subtle text-celis-primary"
                    : "text-celis-ink-secondary hover:bg-celis-surface-elevated hover:text-celis-ink"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Back to site</Link>
          </Button>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-celis-border bg-celis-surface-base px-4 md:hidden">
        <div className="flex items-center gap-2">
          <CelisLogo variant="primary" size={32} badge />
          <span className="font-semibold text-celis-ink">Admin</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Mobile nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex overflow-x-auto border-t border-celis-border bg-celis-surface-base px-2 pb-safe md:hidden">
        {visibleNav.map((item) => {
          const active =
            item.to === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-[3.5rem] min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors",
                active
                  ? "text-celis-primary"
                  : "text-celis-ink-secondary hover:text-celis-ink"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 pt-16 md:pl-64 md:pt-0">
        <div className="mx-auto max-w-7xl p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
