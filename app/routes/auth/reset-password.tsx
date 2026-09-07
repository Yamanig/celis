import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The token-based password reset was removed (SEC-1). Password reset now runs
 * through phone + WhatsApp OTP starting at `/auth/forgot-password`. This route
 * only redirects any stale links.
 */
export const Route = createFileRoute("/auth/reset-password")({
  beforeLoad: () => {
    throw redirect({ to: "/auth/forgot-password" });
  },
});
