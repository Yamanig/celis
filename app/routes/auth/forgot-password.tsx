import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { requestPasswordReset } from "~/server/password-reset.functions";
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
import { CelisLogo } from "~/components/branding/celis-logo";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Forgot password | Celis" },
      {
        name: "description",
        content: "Reset your Celis account password.",
      },
    ],
  }),
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await requestPasswordReset({ data: { email } });
      navigate({
        to: "/auth/reset-password",
        search: { token: result.token, email: result.email },
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
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your email to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            {error && (
              <p className="text-sm text-celis-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Checking..." : "Continue"}
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
