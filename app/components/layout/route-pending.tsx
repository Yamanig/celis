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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-56" />
      </div>

      {isDashboard ? (
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
          <AdminTablePending rows={5} />
        </>
      ) : (
        <>
          <div className="rounded-md border border-celis-border bg-celis-surface-base p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-11 w-full sm:w-44" />
              <Skeleton className="h-11 w-full sm:w-52" />
            </div>
          </div>
          <AdminTablePending rows={8} />
        </>
      )}
    </div>
  );
}

function AdminTablePending({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-md border border-celis-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] caption-bottom text-sm">
          <thead>
            <tr className="border-b border-celis-border bg-muted/50">
              {["Record", "Amount", "Status", "Created", "Action"].map(
                (header) => (
                  <th
                    key={header}
                    className="h-12 px-4 text-left align-middle font-medium text-celis-ink-secondary"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, index) => (
              <tr key={index} className="border-b border-celis-border">
                <td className="p-4 align-middle">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="p-4 align-middle">
                  <Skeleton className="h-10 w-32" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
