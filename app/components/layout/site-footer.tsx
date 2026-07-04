import { Link } from "@tanstack/react-router";
import { CelisLogo } from "~/components/branding/celis-logo";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/auth-context";

export function SiteFooter() {
  const { user, logout } = useAuth();

  return (
    <footer className="border-t border-celis-border bg-celis-surface-base">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <CelisLogo variant="mark-only" size={32} badge />
            <p className="text-sm text-celis-ink-secondary">
              Somalia&apos;s trusted marketplace for buying and selling locally.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Marketplace</h4>
            <ul className="space-y-2 text-sm text-celis-ink-secondary">
              <li><Link to="/browse" className="hover:text-celis-ink">Browse</Link></li>
              <li><Link to="/search" className="hover:text-celis-ink">Search</Link></li>
              <li><Link to="/sell" className="hover:text-celis-ink">Sell an item</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Account</h4>
            <ul className="space-y-2 text-sm text-celis-ink-secondary">
              {user ? (
                <>
                  <li>
                    <Link
                      to={user.role === "admin" ? "/admin" : "/dashboard"}
                      className="hover:text-celis-ink"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => logout()}
                      className="h-auto p-0 text-celis-ink-secondary hover:text-celis-ink"
                    >
                      Log out
                    </Button>
                  </li>
                </>
              ) : (
                <>
                  <li><Link to="/auth/sign-in" className="hover:text-celis-ink">Sign in</Link></li>
                  <li><Link to="/auth/sign-up" className="hover:text-celis-ink">Create account</Link></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Trust</h4>
            <ul className="space-y-2 text-sm text-celis-ink-secondary">
              <li>Mobile money payments</li>
              <li>Verified seller profiles</li>
              <li>Transparent fees</li>
            </ul>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-celis-ink-secondary sm:flex-row">
          <p>© {new Date().getFullYear()} Celis. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-celis-ink">Privacy</Link>
            <Link to="/" className="hover:text-celis-ink">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
