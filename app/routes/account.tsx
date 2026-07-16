import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "~/components/layout/site-header";
import { SiteFooter } from "~/components/layout/site-footer";
import { useAuth } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
} from "~/server/auth.functions";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/account")({
  component: AccountPage,
  head: () => ({
    meta: [
      { title: "Account settings | Celis" },
      { name: "description", content: "Manage your Celis profile, phone number, seller details, and preferences." },
    ],
  }),

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

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function AccountPage() {
  const profile = Route.useLoaderData();
  const router = useRouter();
  const { refresh } = useAuth();
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [sellerType, setSellerType] = useState<"individual" | "shop">(
    profile.sellerType ?? "individual"
  );
  const [businessName, setBusinessName] = useState(profile.businessName ?? "");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState(
    profile.businessRegistrationNumber ?? ""
  );
  const [businessAddress, setBusinessAddress] = useState(
    profile.businessAddress ?? ""
  );
  const [businessLogoUrl, setBusinessLogoUrl] = useState(
    profile.businessLogoUrl ?? ""
  );
  const [shopSlug, setShopSlug] = useState(profile.shopSlug ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSeller = profile.role === "seller";

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
          ...(isSeller && {
            sellerType,
            ...(sellerType === "shop" && {
              businessName: businessName.trim() || undefined,
              businessRegistrationNumber:
                businessRegistrationNumber.trim() || undefined,
              businessAddress: businessAddress.trim() || undefined,
              businessLogoUrl: businessLogoUrl.trim() || undefined,
              shopSlug:
                shopSlug.trim() || slugify(businessName) || undefined,
            }),
          }),
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

              {profile.sellerNumber && (
                <div className="space-y-2">
                  <Label htmlFor="sellerNumber">Seller number</Label>
                  <Input
                    id="sellerNumber"
                    value={profile.sellerNumber}
                    disabled
                  />
                  <p className="text-xs text-celis-ink-tertiary">
                    Share this number with admins when assigning a package.
                  </p>
                </div>
              )}

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

              {isSeller && (
                <div className="space-y-4 rounded-lg border border-celis-border bg-celis-surface-inset p-4">
                  <h3 className="font-medium">Seller profile</h3>

                  <div className="space-y-2">
                    <Label>Seller type</Label>
                    <Select
                      value={sellerType}
                      onValueChange={(v) =>
                        setSellerType(v as typeof sellerType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="shop">Shop / Business</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <Label htmlFor="businessAddress">
                          Business address
                        </Label>
                        <Input
                          id="businessAddress"
                          value={businessAddress}
                          onChange={(e) => setBusinessAddress(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessLogoUrl">Business logo URL</Label>
                        <Input
                          id="businessLogoUrl"
                          value={businessLogoUrl}
                          onChange={(e) => setBusinessLogoUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shopSlug">Shop slug</Label>
                        <Input
                          id="shopSlug"
                          value={shopSlug}
                          onChange={(e) => setShopSlug(slugify(e.target.value))}
                          placeholder={slugify(businessName) || "your-shop"}
                        />
                        <p className="text-xs text-celis-ink-tertiary">
                          Used for your public shop page: /shops/{shopSlug || slugify(businessName)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

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
