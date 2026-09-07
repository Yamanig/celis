import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  verifyPhoneOtp,
  verifyAddPhoneOtp,
  resetPasswordWithOtp,
  requestPhoneOtp,
  requestAddPhoneOtp,
  requestPasswordResetOtp,
} from "~/server/auth.functions";
import { useAuth } from "~/lib/auth-context";
import { safeInternalPath } from "~/lib/safe-redirect";
import { formatE164ForDisplay } from "~/lib/phone";
import { clientErrorMessage } from "~/lib/errors";
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

const searchSchema = z.object({
  phone: z.string().min(1),
  mode: z.enum(["signin", "add-phone", "reset"]).default("signin"),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth/verify-otp")({
  component: VerifyOtpPage,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Enter your code | Celis" },
      { name: "description", content: "Enter the code we sent to your WhatsApp." },
    ],
  }),
});

const RESEND_SECONDS = 60;

function VerifyOtpPage() {
  const { phone, mode, redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCooldown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resend = async () => {
    if (cooldown > 0) return;
    setError(null);
    try {
      if (mode === "add-phone") await requestAddPhoneOtp({ data: { phone } });
      else if (mode === "reset")
        await requestPasswordResetOtp({ data: { phone } });
      else await requestPhoneOtp({ data: { phone } });
      startCooldown();
    } catch (err) {
      setError(clientErrorMessage(err, "Couldn't resend the code. Try again."));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(token)) {
      setError("Enter the 6-digit code.");
      return;
    }

    if (mode === "reset") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "reset") {
        await resetPasswordWithOtp({ data: { phone, token, password } });
        setDone(true);
        setTimeout(() => navigate({ to: "/auth/sign-in" }), 1800);
      } else if (mode === "add-phone") {
        await verifyAddPhoneOtp({ data: { phone, token } });
        await refresh();
        navigate({ to: safeInternalPath(redirect) });
      } else {
        await verifyPhoneOtp({ data: { phone, token } });
        await refresh();
        navigate({ to: safeInternalPath(redirect) });
      }
    } catch (err) {
      setError(clientErrorMessage(err, "Verification failed. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "reset"
      ? "Reset your password"
      : mode === "add-phone"
        ? "Confirm your phone number"
        : "Enter your code";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-celis-bg px-4 py-12">
      <Link to="/" className="mb-8">
        <CelisLogo variant="primary" size={48} />
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Enter the 6-digit code we sent on WhatsApp to{" "}
            {formatE164ForDisplay(phone)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-celis-ink-secondary">
                Your password has been updated. You can now sign in.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth/sign-in">Sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError(null);
                  }}
                  placeholder="123456"
                />
              </div>

              {mode === "reset" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                    />
                  </div>
                </>
              )}

              {error && <p className="text-sm text-celis-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </Button>

              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0}
                className="w-full text-center text-sm text-celis-primary hover:underline disabled:text-celis-ink-tertiary disabled:no-underline"
              >
                {cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Resend code"}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
