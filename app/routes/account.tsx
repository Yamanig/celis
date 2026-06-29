import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { useAuth } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
} from "~/server/auth.functions";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({
        to: "/auth/sign-in",
        search: { redirect: "/account" },
      });
    }
  },
  loader: async () => fetchCurrentUserProfile(),
});

function AccountPage() {
  const profile = Route.useLoaderData();
  const router = useRouter();
  const { refresh } = useAuth();
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      await updateCurrentUserProfile({
        data: {
          displayName: displayName.trim(),
          phone: phone.trim() || undefined,
          bio: bio.trim() || undefined,
        },
      });
      await refresh();
      await router.invalidate();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-celis-bg">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Account settings</h1>
          <p className="text-sm text-celis-ink-secondary">
            Update your profile and contact info.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  minLength={2}
                  maxLength={60}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone / WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+252 61 123 4567"
                  maxLength={15}
                />
                <p className="text-xs text-celis-ink-tertiary">
                  This number will be shown to buyers on your listings.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell buyers a little about yourself..."
                  maxLength={500}
                  rows={4}
                />
              </div>

              {error && (
                <p className="text-sm text-celis-destructive">{error}</p>
              )}
              {success && (
                <p className="flex items-center gap-1 text-sm text-celis-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Profile updated.
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save changes"}
                </Button>
                <Button variant="outline" asChild>
                  <Link to={profile.role === "admin" ? "/admin" : "/dashboard"}>
                    Back to dashboard
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
