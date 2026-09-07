import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { requestAddPhoneOtp } from "~/server/auth.functions";
import { toE164 } from "~/lib/phone";
import { safeInternalPath } from "~/lib/safe-redirect";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { CelisLogo } from "~/components/branding/celis-logo";
import {
  PhoneInput,
  DEFAULT_COUNTRY,
  type CountryItem,
} from "~/components/auth/phone-input";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth/add-phone")({
  component: AddPhonePage,
  validateSearch: searchSchema,
  beforeLoad: ({ context, search }) => {
    if (!context.user) {
      throw redirect({
        to: "/auth/sign-in",
        search: { redirect: "/auth/add-phone" },
      });
    }
    if (context.user.hasVerifiedPhone) {
      throw redirect({ to: safeInternalPath(search.redirect) });
    }
  },
  head: () => ({
    meta: [
      { title: "Add your phone number | Celis" },
      {
        name: "description",
        content: "Add and verify a phone number for your Celis account.",
      },
    ],
  }),
});

function AddPhonePage() {
  const { redirect: redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const [country, setCountry] = useState<CountryItem>(DEFAULT_COUNTRY);
  const [national, setNational] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const phone = toE164(country.dialCode, national);
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError("Enter a valid phone number.");
      setLoading(false);
      return;
    }

    try {
      await requestAddPhoneOtp({ data: { phone } });
      navigate({
        to: "/auth/verify-otp",
        search: {
          phone,
          mode: "add-phone",
          ...(redirectTo ? { redirect: redirectTo } : {}),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-celis-bg px-4 py-12">
      <Link to="/" className="mb-8">
        <CelisLogo variant="primary" size={48} />
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Add your phone number</CardTitle>
          <CardDescription>
            Buyers use your number to reach you, and it secures your account. We
            verify it with a WhatsApp code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <PhoneInput
              country={country}
              onCountryChange={setCountry}
              national={national}
              onNationalChange={(v) => {
                setNational(v);
                setError(null);
              }}
              autoFocus
            />
            {error && <p className="text-sm text-celis-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send code"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-celis-ink-secondary">
            <Link
              to={safeInternalPath(redirectTo)}
              className="text-celis-primary hover:underline"
            >
              Skip for now
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
