import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { signUp, requestPhoneOtp } from "~/server/auth.functions";
import { useAuth } from "~/lib/auth-context";
import { toE164 } from "~/lib/phone";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Combobox } from "~/components/ui/combobox";
import { CelisLogo } from "~/components/branding/celis-logo";
import {
  PhoneInput,
  DEFAULT_COUNTRY,
  type CountryItem,
} from "~/components/auth/phone-input";

export const Route = createFileRoute("/auth/sign-up")({
  component: SignUpPage,
  head: () => ({
    meta: [
      { title: "Sign up | Celis" },
      { name: "description", content: "Create your free Celis account and start buying or selling in Somalia." },
    ],
  }),

});

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function SignUpPage() {
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [sellerType, setSellerType] = useState<"individual" | "shop">("individual");
  const [businessName, setBusinessName] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [country, setCountry] = useState<CountryItem>(DEFAULT_COUNTRY);
  const [national, setNational] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const roleOptions = [
    { value: "buyer", label: "Buy items" },
    { value: "seller", label: "Sell items" },
  ];
  const sellerTypeOptions = [
    { value: "individual", label: "Individual" },
    { value: "shop", label: "Shop / Business" },
  ];

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
        search: { phone, mode: "signin" },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUp({
        data: {
          email,
          password,
          displayName,
          role,
          ...(role === "seller" && {
            sellerType,
            ...(sellerType === "shop" && {
              businessName,
              businessRegistrationNumber,
              businessAddress,
              shopSlug: slugify(businessName),
            }),
          }),
        },
      });
      await refresh();
      navigate({ to: "/auth/add-phone", search: { redirect: "/dashboard" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
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
          <CardTitle>Create your Celis account</CardTitle>
          <CardDescription>
            Buy, sell, and discover in Somalia.
          </CardDescription>
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
              <p className="text-center text-xs text-celis-ink-tertiary">
                By continuing, you agree to Celis&apos;s{" "}
                <Link to="/terms" className="text-celis-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-celis-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <button
                type="button"
                onClick={() => {
                  setMethod("email");
                  setError(null);
                }}
                className="w-full text-center text-sm text-celis-primary hover:underline"
              >
                Sign up with email and password instead
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">I want to</Label>
                <Combobox
                  value={role}
                  onValueChange={(v) => setRole(v as typeof role)}
                  options={roleOptions}
                />
              </div>

              {role === "seller" && (
                <div className="space-y-4 rounded-lg border border-celis-border bg-celis-surface-inset p-4">
                  <div className="space-y-2">
                    <Label>Seller type</Label>
                    <Combobox
                      value={sellerType}
                      onValueChange={(v) => setSellerType(v as typeof sellerType)}
                      options={sellerTypeOptions}
                    />
                  </div>

                  {sellerType === "shop" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business name</Label>
                        <Input
                          id="businessName"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Your shop name"
                          required={sellerType === "shop"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessRegistrationNumber">
                          Business registration number
                        </Label>
                        <Input
                          id="businessRegistrationNumber"
                          value={businessRegistrationNumber}
                          onChange={(e) =>
                            setBusinessRegistrationNumber(e.target.value)
                          }
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessAddress">Business address</Label>
                        <Input
                          id="businessAddress"
                          value={businessAddress}
                          onChange={(e) => setBusinessAddress(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-celis-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>

              <p className="text-center text-xs text-celis-ink-tertiary">
                By creating an account, you agree to Celis&apos;s{" "}
                <Link to="/terms" className="text-celis-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-celis-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <button
                type="button"
                onClick={() => {
                  setMethod("phone");
                  setError(null);
                }}
                className="w-full text-center text-sm text-celis-primary hover:underline"
              >
                Sign up with a WhatsApp code instead
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-celis-ink-secondary">
            Already have an account?{" "}
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
