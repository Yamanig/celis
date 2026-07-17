import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { CelisLogo } from "~/components/branding/celis-logo";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { ThemeToggle } from "~/components/theme/theme-toggle";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Briefcase,
  FileText,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Package,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

const AdminPendingShellContext = createContext(false);

export function AdminPendingContentScope({ children }: { children: ReactNode }) {
  return (
    <AdminPendingShellContext.Provider value>
      {children}
    </AdminPendingShellContext.Provider>
  );
}

export function RoutePending() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isInsideAdminShell = useContext(AdminPendingShellContext);

  if (pathname.startsWith("/admin")) {
    return isInsideAdminShell ? (
      <AdminRoutePending pathname={pathname} />
    ) : (
      <AdminShellPending pathname={pathname} />
    );
  }

  if (pathname === "/") {
    return (
      <PublicRouteChrome showSearch={false} fullWidth>
        <HomeRoutePending />
      </PublicRouteChrome>
    );
  }

  if (pathname.startsWith("/account")) {
    return (
      <PublicRouteChrome>
        <AccountRoutePending />
      </PublicRouteChrome>
    );
  }

  if (pathname.startsWith("/dashboard")) {
    return (
      <PublicRouteChrome>
        <DashboardRoutePending />
      </PublicRouteChrome>
    );
  }

  if (pathname.startsWith("/sell")) {
    return (
      <PublicRouteChrome showSearch={false}>
        <SellRoutePending />
      </PublicRouteChrome>
    );
  }

  if (pathname.startsWith("/listings/")) {
    return (
      <PublicRouteChrome>
        <ListingDetailRoutePending />
      </PublicRouteChrome>
    );
  }

  if (pathname.startsWith("/notifications")) {
    return (
      <PublicRouteChrome>
        <NotificationsRoutePending />
      </PublicRouteChrome>
    );
  }

  if (pathname.startsWith("/shops/")) {
    return (
      <PublicRouteChrome>
        <ShopRoutePending />
      </PublicRouteChrome>
    );
  }

  return (
    <PublicRouteChrome>
      <MarketplaceGridRoutePending />
    </PublicRouteChrome>
  );
}

function PublicRouteChrome({
  children,
  fullWidth = false,
  showSearch = true,
}: {
  children: ReactNode;
  fullWidth?: boolean;
  showSearch?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader showSearch={showSearch} />
      <main
        className={
          fullWidth
            ? "w-full flex-1"
            : "mx-auto w-full max-w-7xl flex-1 px-4 py-8"
        }
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

function PageTitlePending({
  titleWidth = "w-56",
  subtitleWidth = "w-full max-w-md",
}: {
  titleWidth?: string;
  subtitleWidth?: string;
}) {
  return (
    <div className="mb-8 space-y-3">
      <Skeleton className={`h-8 ${titleWidth}`} />
      <Skeleton className={`h-4 ${subtitleWidth}`} />
    </div>
  );
}

function ListingCardsPending({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-md border border-celis-border bg-celis-surface-base"
        >
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-6 w-24" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketplaceGridRoutePending() {
  return (
    <>
      <PageTitlePending />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-md border border-celis-border bg-celis-surface-base p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-11 w-full" />
        </aside>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <ListingCardsPending />
        </section>
      </div>
    </>
  );
}

function HomeRoutePending() {
  return (
    <>
      <section className="bg-celis-gradient-hero relative overflow-hidden border-b border-celis-border px-4 py-24 sm:py-32">
        <div className="relative mx-auto max-w-5xl text-center">
          <Skeleton className="mx-auto mb-6 h-8 w-64 rounded-full" />
          <Skeleton className="mx-auto h-14 w-full max-w-3xl" />
          <Skeleton className="mx-auto mt-6 h-5 w-full max-w-2xl" />
          <Skeleton className="mx-auto mt-3 h-5 w-full max-w-xl" />

          <div className="mx-auto mt-10 max-w-3xl rounded-md border border-celis-border bg-celis-surface-base p-4 text-left shadow-lg sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-12 w-full rounded-lg sm:w-44" />
              </div>
              <Skeleton className="h-12 w-full rounded-md sm:w-32" />
            </div>

            <div className="my-5 border-t border-celis-border" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-12">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="rounded-md border border-celis-border bg-celis-surface-base p-5"
              >
                <Skeleton className="mb-5 h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-28" />
              </div>
            ))}
          </div>
        </section>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-5 w-24" />
        </div>
        <ListingCardsPending count={4} />
      </div>
    </>
  );
}

function AccountRoutePending() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageTitlePending titleWidth="w-44" subtitleWidth="w-72 max-w-full" />
      <section className="rounded-md border border-celis-border bg-celis-surface-base p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </section>
      <section className="rounded-md border border-celis-border bg-celis-surface-base">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-celis-border p-5 last:border-b-0"
          >
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        ))}
      </section>
    </div>
  );
}

function DashboardRoutePending() {
  return (
    <div className="space-y-8">
      <PageTitlePending titleWidth="w-52" subtitleWidth="w-80 max-w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-md border border-celis-border bg-celis-surface-base p-5"
          >
            <Skeleton className="mb-5 h-4 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ListingCardsPending count={4} />
        <aside className="space-y-4 rounded-md border border-celis-border bg-celis-surface-base p-5">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-10 w-full" />
        </aside>
      </div>
    </div>
  );
}

function SellRoutePending() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageTitlePending titleWidth="w-60" subtitleWidth="w-full max-w-xl" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="mx-auto h-12 w-12 rounded-full" />
            <Skeleton className="mx-auto h-4 w-20" />
          </div>
        ))}
      </div>
      <section className="rounded-md border border-celis-border bg-celis-surface-base p-6">
        <Skeleton className="mb-6 h-6 w-44" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <Skeleton className="mt-6 h-28 w-full" />
      </section>
    </div>
  );
}

function ListingDetailRoutePending() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6">
        <Skeleton className="aspect-[16/10] w-full rounded-md" />
        <div className="rounded-md border border-celis-border bg-celis-surface-base p-6">
          <Skeleton className="mb-4 h-8 w-3/4" />
          <Skeleton className="mb-6 h-7 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </section>
      <aside className="space-y-4">
        <div className="rounded-md border border-celis-border bg-celis-surface-base p-5">
          <Skeleton className="mb-4 h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
        </div>
        <div className="rounded-md border border-celis-border bg-celis-surface-base p-5">
          <Skeleton className="mb-4 h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-10/12" />
        </div>
      </aside>
    </div>
  );
}

function NotificationsRoutePending() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageTitlePending titleWidth="w-52" subtitleWidth="w-80 max-w-full" />
      <section className="rounded-md border border-celis-border bg-celis-surface-base">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex gap-4 border-b border-celis-border p-5 last:border-b-0"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function ShopRoutePending() {
  return (
    <div className="space-y-8">
      <section className="rounded-md border border-celis-border bg-celis-surface-base p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </section>
      <ListingCardsPending />
    </div>
  );
}

export function AdminShellPending({ pathname = "/admin" }: { pathname?: string }) {
  return (
    <div className="flex min-h-screen bg-celis-bg">
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-celis-border bg-celis-surface-base md:flex">
        <div className="flex h-16 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <CelisLogo variant="primary" size={36} badge />
            <span className="font-semibold text-celis-ink">Admin</span>
          </div>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-3">
          {adminPendingNav.map((item) => {
            const active =
              item.to === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.to);
            return (
              <div
                key={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                  active
                    ? "bg-celis-primary-subtle text-celis-primary"
                    : "text-celis-ink-secondary"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
        <Separator />
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to site
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </aside>

      <div className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-celis-border bg-celis-surface-base px-4 md:hidden">
        <div className="flex items-center gap-2">
          <CelisLogo variant="primary" size={32} badge />
          <span className="font-semibold text-celis-ink">Admin</span>
        </div>
        <ThemeToggle />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex overflow-x-auto border-t border-celis-border bg-celis-surface-base px-2 pb-safe md:hidden">
        {adminPendingNav.slice(0, 5).map((item) => {
          const active =
            item.to === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.to);
          return (
            <div
              key={item.to}
              className={`flex min-h-[3.5rem] min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-1 px-1 text-xs font-medium ${
                active ? "text-celis-primary" : "text-celis-ink-secondary"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </div>
          );
        })}
      </nav>

      <main className="flex-1 pt-16 md:pl-64 md:pt-0">
        <div className="w-full px-4 py-4 md:px-5 md:py-6 xl:px-6">
          <AdminRoutePending pathname={pathname} />
        </div>
      </main>
    </div>
  );
}

const adminPendingNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/verifications", label: "Verifications", icon: UserCheck },
  { to: "/admin/listings", label: "Listings", icon: LayoutGrid },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/orders", label: "Orders", icon: Package },
  { to: "/admin/payouts", label: "Payouts", icon: Wallet },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/audit-log", label: "Audit log", icon: ScrollText },
  { to: "/admin/roles", label: "Roles", icon: ShieldCheck },
  { to: "/admin/packages", label: "Packages", icon: Briefcase },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminRoutePending({ pathname }: { pathname: string }) {
  const isDashboard = pathname === "/admin";
  const isRoles = pathname.startsWith("/admin/roles");
  const isSettings = pathname.startsWith("/admin/settings");
  const isListingDetail = /^\/admin\/listings\/[^/]+/.test(pathname);
  const tableColumns = getAdminTableColumnCount(pathname);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-56" />
      </div>

      {isRoles ? (
        <AdminRolesPending />
      ) : isSettings ? (
        <AdminSettingsPending />
      ) : isListingDetail ? (
        <AdminDetailPending />
      ) : isDashboard ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-md border border-celis-border bg-celis-surface-base p-5"
              >
                <Skeleton className="mb-5 h-4 w-28" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
          <AdminTablePending columns={4} rows={5} />
        </>
      ) : (
        <>
          {hasAdminFilters(pathname) && (
            <div className="rounded-md border border-celis-border bg-celis-surface-base p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Skeleton className="h-11 w-full sm:w-44" />
                <Skeleton className="h-11 w-full sm:w-52" />
              </div>
            </div>
          )}
          <AdminTablePending columns={tableColumns} rows={8} />
        </>
      )}
    </div>
  );
}

function AdminTablePending({
  columns,
  rows,
}: {
  columns: number;
  rows: number;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-celis-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] caption-bottom text-sm">
          <thead>
            <tr className="border-b border-celis-border bg-muted/50">
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="h-12 px-4 text-left align-middle">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <tr key={index} className="border-b border-celis-border">
                {Array.from({ length: columns }).map((_, cellIndex) => (
                  <td key={cellIndex} className="p-4 align-middle">
                    {cellIndex === 0 ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    ) : cellIndex === columns - 1 ? (
                      <Skeleton className="h-10 w-28" />
                    ) : (
                      <Skeleton
                        className={
                          cellIndex % 2 === 0
                            ? "h-6 w-24 rounded-full"
                            : "h-4 w-20"
                        }
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminRolesPending() {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24" />
        ))}
      </div>

      <div className="rounded-md border border-celis-border bg-celis-surface-base">
        <div className="border-b border-celis-border p-6">
          <Skeleton className="h-6 w-44" />
        </div>
        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-3 rounded-md border border-celis-border p-3"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
    </>
  );
}

function AdminSettingsPending() {
  return (
    <>
      <div className="rounded-md border border-celis-border bg-celis-surface-base">
        <div className="border-b border-celis-border p-6">
          <Skeleton className="h-6 w-36" />
        </div>
        <div className="space-y-6 p-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton
                className={index > 1 ? "h-6 w-10 rounded-full" : "h-10 w-48"}
              />
            </div>
          ))}
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="rounded-md border border-celis-border bg-celis-surface-base">
        <div className="flex items-center justify-between border-b border-celis-border p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-4 p-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AdminDetailPending() {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-md border border-celis-border bg-celis-surface-base">
          <div className="border-b border-celis-border p-6">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/3] w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-md border border-celis-border bg-celis-surface-base p-6"
            >
              <Skeleton className="mb-6 h-6 w-36" />
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((__, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex items-center justify-between gap-6"
                  >
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-celis-border bg-celis-surface-base p-6">
        <Skeleton className="mb-6 h-6 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </>
  );
}

function getAdminTableColumnCount(pathname: string) {
  if (pathname.startsWith("/admin/users")) return 7;
  if (pathname.startsWith("/admin/listings")) return 7;
  if (pathname.startsWith("/admin/categories")) return 5;
  if (pathname.startsWith("/admin/orders")) return 6;
  if (pathname.startsWith("/admin/payouts")) return 5;
  if (pathname.startsWith("/admin/reports")) return 6;
  if (pathname.startsWith("/admin/audit-log")) return 4;
  if (pathname.startsWith("/admin/packages")) return 5;
  return 5;
}

function hasAdminFilters(pathname: string) {
  return (
    pathname.startsWith("/admin/users") ||
    pathname.startsWith("/admin/listings") ||
    pathname.startsWith("/admin/orders") ||
    pathname.startsWith("/admin/payouts") ||
    pathname.startsWith("/admin/reports")
  );
}
