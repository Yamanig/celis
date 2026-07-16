import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "~/lib/auth-context";
import { useTheme } from "~/lib/theme-provider";
import { CelisLogo } from "~/components/branding/celis-logo";
import { NotificationBell } from "~/components/notifications/notification-bell";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import {
  Search,
  Plus,
  LayoutDashboard,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  Bell,
} from "lucide-react";

interface SiteHeaderProps {
  showSearch?: boolean;
}

export function SiteHeader({ showSearch = true }: SiteHeaderProps) {
  const { user, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-celis-border bg-celis-bg/85 backdrop-blur-lg">
      <div className="mx-auto flex min-h-[3.5rem] max-w-7xl items-center gap-2 px-4 md:min-h-[4rem] md:gap-4">
        <Link to="/" className="flex items-center gap-2">
          <CelisLogo variant="primary" size={40} />
        </Link>

        {showSearch && (
          <form
            action="/search"
            method="get"
            className="hidden flex-1 items-center sm:flex"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const query = new FormData(form).get("q") as string;
              window.location.href = `/search?query=${encodeURIComponent(query)}`;
            }}
          >
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-celis-ink-tertiary" />
              <Input
                name="q"
                placeholder="Search items..."
                className="h-11 w-full rounded-full border-celis-border bg-celis-surface-inset pl-10 pr-4 transition focus:bg-celis-surface-base"
              />
            </div>
          </form>
        )}

        <nav className="ml-auto flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden md:inline-flex"
          >
            <Link to="/browse">Browse</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hidden md:inline-flex"
          >
            <Link to="/search">Search</Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-12 w-12 text-celis-ink-secondary"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <div className="hidden items-center gap-1 md:flex md:gap-2">
            {user ? (
              <>
                <NotificationBell />
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/account">
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={user.role === "admin" ? "/admin" : "/dashboard"}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/sell">
                    <Plus className="mr-1 h-4 w-4" />
                    Sell
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  aria-label="Sign out"
                  className="h-12 w-12"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth/sign-in">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth/sign-up">Get started</Link>
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </nav>
      </div>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Button variant="ghost" asChild className="justify-start">
              <Link to="/browse" onClick={() => setMenuOpen(false)}>
                Browse
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start">
              <Link to="/search" onClick={() => setMenuOpen(false)}>
                Search
              </Link>
            </Button>
            <Separator />
            {user ? (
              <>
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/notifications" onClick={() => setMenuOpen(false)}>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/account" onClick={() => setMenuOpen(false)}>
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start">
                  <Link
                    to={user.role === "admin" ? "/admin" : "/dashboard"}
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start">
                  <Link to="/sell" onClick={() => setMenuOpen(false)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Sell
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="justify-start">
                  <Link to="/auth/sign-in" onClick={() => setMenuOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild className="justify-start">
                  <Link to="/auth/sign-up" onClick={() => setMenuOpen(false)}>
                    Get started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
