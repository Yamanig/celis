import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { signIn, requestPhoneOtp } from "~/server/auth.functions";
import { useAuth } from "~/lib/auth-context";
import { safeInternalPath } from "~/lib/safe-redirect";
import { toE164 } from "~/lib/phone";
import { clientErrorMessage } from "~/lib/errors";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { CelisLogo } from "~/components/branding/celis-logo";
import {
  PhoneInput,
  DEFAULT_COUNTRY,
  type CountryItem,
} from "~/components/auth/phone-input";

const signInSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInPage,
  head: () => ({
    meta: [
      { title: "Sign in | Celis" },
      { name: "description", content: "Sign in to your Celis account to buy, sell, and manage listings." },
    ],
  }),

  validateSearch: signInSearchSchema,
});

function SignInPage() {
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState<CountryItem>(DEFAULT_COUNTRY);
  const [national, setNational] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signIn({ data: { email, password } });
      await refresh();
      if (result.needsPhone) {
        navigate({
          to: "/auth/add-phone",
          search: redirect ? { redirect } : {},
        });
        return;
      }
      navigate({ to: safeInternalPath(redirect) });
    } catch (err) {
      setError(clientErrorMessage(err, "Sign in failed. Check your details and try again."));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
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
      await requestPhoneOtp({ data: { phone } });
      navigate({
        to: "/auth/verify-otp",
        search: {
          phone,
          mode: "signin",
          ...(redirect ? { redirect } : {}),
        },
      });
    } catch (err) {
      setError(clientErrorMessage(err, "Couldn't send the code. Try again."));
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
          <CardTitle>Sign in to Celis</CardTitle>
          <CardDescription>Welcome back to the marketplace.</CardDescription>
        </CardHeader>
        <CardContent>
          {method === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
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
              {error && (
                <p className="text-sm text-celis-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send code"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMethod("email");
                  setError(null);
                }}
                className="w-full text-center text-sm text-celis-primary hover:underline"
              >
                Sign in with email and password instead
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/auth/forgot-password"
                    className="text-xs text-celis-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-celis-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMethod("phone");
                  setError(null);
                }}
                className="w-full text-center text-sm text-celis-primary hover:underline"
              >
                Sign in with a WhatsApp code instead
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-celis-ink-secondary">
            Don&apos;t have an account?{" "}
            <Link to="/auth/sign-up" className="text-celis-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
