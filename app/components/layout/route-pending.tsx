import { useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { Skeleton } from "~/components/ui/skeleton";

export function RoutePending() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (pathname.startsWith("/admin")) {
    return <AdminRoutePending pathname={pathname} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
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
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

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
