import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { requestPasswordResetOtp } from "~/server/auth.functions";
import { toE164 } from "~/lib/phone";
import { clientErrorMessage } from "~/lib/errors";
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

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Forgot password | Celis" },
      { name: "description", content: "Reset your Celis account password." },
    ],
  }),
});

function ForgotPasswordPage() {
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
      await requestPasswordResetOtp({ data: { phone } });
      navigate({
        to: "/auth/verify-otp",
        search: { phone, mode: "reset" },
      });
    } catch (err) {
      setError(clientErrorMessage(err, "Request failed. Try again."));
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
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter the phone number on your account and we&apos;ll send a code on
            WhatsApp.
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
            Remember your password?{" "}
            <Link
              to="/auth/sign-in"
              className="text-celis-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
