import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@tanstack/react-router";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import { AuthProvider } from "~/lib/auth-context";
import { ThemeProvider } from "~/lib/theme-provider";
import { fetchCurrentUser } from "~/server/auth.functions";

import "~/styles/globals.css";

const defaultDescription =
  "Celis is Somalia's marketplace for electronics, vehicles, property, fashion, livestock, and more. Buy and sell locally with mobile money.";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { title: "Celis — Buy & sell anything in Somalia" },
      { name: "description", content: defaultDescription },
      { property: "og:site_name", content: "Celis" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_SO" },
      { property: "og:description", content: defaultDescription },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:description", content: defaultDescription },
    ],
  }),
  beforeLoad: async () => {
    const user = await fetchCurrentUser();
    return { user };
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Response && error.status === 401) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

function RootComponent() {
  const { user } = Route.useRouteContext();

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <HeadContent />
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0085FF" />
        <link rel="icon" type="image/svg+xml" href="/celis-favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider initialUser={user ?? null}>
              <Outlet />
              <ScrollRestoration />
              <Scripts />
            </AuthProvider>
          </ThemeProvider>
          {process.env.NODE_ENV === "development" && (
            <>
              <TanStackRouterDevtools position="bottom-left" />
              <ReactQueryDevtools buttonPosition="bottom-right" />
            </>
          )}
        </QueryClientProvider>
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-celis-ink-secondary">
        The page you’re looking for doesn’t exist on Celis.
      </p>
    </main>
  );
}

export default RootComponent;
