import { Link } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth-context";
import { Phone } from "lucide-react";

/**
 * Soft prompt shown to signed-in accounts that have no verified phone number
 * (existing email/password users, mid-migration to phone auth). Non-blocking —
 * it only nudges toward `/auth/add-phone`.
 */
export function AddPhoneBanner({ redirect = "/dashboard" }: { redirect?: string }) {
  const auth = useAuth();
  if (!auth.user || auth.user.hasVerifiedPhone) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-celis-caution bg-celis-caution-subtle px-4 py-3 text-sm">
      <Phone className="h-4 w-4 shrink-0 text-celis-caution" />
      <p className="flex-1 text-celis-ink">
        Add a phone number to secure your account and let buyers reach you.
      </p>
      <Link
        to="/auth/add-phone"
        search={{ redirect }}
        className="font-medium text-celis-primary hover:underline"
      >
        Add phone number
      </Link>
    </div>
  );
}
