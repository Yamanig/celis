import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { useAuth } from "~/lib/auth-context";
import { CelisLogo } from "~/components/branding/celis-logo";
import { AdminPendingContentScope } from "~/components/layout/route-pending";
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
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  UserCheck,
  LogOut,
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
    to: "/admin/verifications",
    label: "Verifications",
    icon: UserCheck,
    permission: "seller:verify",
  },
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
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const visibleNav = nav.filter((item) =>
    permissions.includes(item.permission)
  );

  useEffect(() => {
    const stored = window.localStorage.getItem("celis-admin-sidebar-collapsed");
    setCollapsed(stored === "true");
  }, []);

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(
        "celis-admin-sidebar-collapsed",
        String(next)
      );
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-celis-bg">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-celis-border bg-celis-surface-base transition-[width] duration-200 md:flex",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center px-4",
            collapsed ? "justify-center gap-2 px-2" : "justify-between gap-2"
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <CelisLogo
              variant={collapsed ? "mark-only" : "primary"}
              size={36}
              badge
            />
            {!collapsed && (
              <span className="font-semibold text-celis-ink">Admin</span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
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
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-md py-2.5 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-0" : "gap-3 px-3",
                  active
                    ? "bg-celis-primary-subtle text-celis-primary"
                    : "text-celis-ink-secondary hover:bg-celis-surface-elevated hover:text-celis-ink"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div
          className={cn(
            "flex p-4",
            collapsed ? "flex-col items-center gap-3" : "items-center justify-between"
          )}
        >
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            title="Back to site"
            asChild
          >
            <Link to="/">
              {collapsed ? (
                <Home className="h-4 w-4" />
              ) : (
                "Back to site"
              )}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            title="Log out"
            disabled={loggingOut}
            onClick={handleLogout}
          >
            {collapsed ? (
              <LogOut className="h-4 w-4" />
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </>
            )}
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Log out"
            disabled={loggingOut}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
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
      <main
        className={cn(
          "flex-1 pt-16 transition-[padding-left] duration-200 md:pt-0",
          collapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        <div className="w-full px-4 py-4 md:px-5 md:py-6 xl:px-6">
          <AdminPendingContentScope>
            <Outlet />
          </AdminPendingContentScope>
        </div>
      </main>
    </div>
  );
}
