import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { PageHeader } from "~/components/admin/page-header";
import {
  fetchPlatformConfigAll,
  updateAdminPlatformConfig,
  runAdminExpirySweep,
} from "~/server/admin.functions";
import { formatRelativeDate } from "~/lib/format";
import {
  DEFAULT_LISTING_TIERS,
  type ListingTiersConfig,
  type PricingTier,
} from "~/lib/pricing";
import { ITEM_CONDITIONS } from "~/db/schema";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
  loader: async () => fetchPlatformConfigAll(),
});

const LABELS: Record<string, string> = {
  listing_fee_cents: "Listing fee (cents)",
  commission_bps: "Commission basis points",
  local_pickup_enabled: "Local pickup enabled",
  platform_shipping_enabled: "Platform shipping enabled",
  commission_model_enabled: "Commission model enabled",
  evc_enabled: "EVC wallet enabled",
  premier_wallet_enabled: "Premier wallet enabled",
  edahab_enabled: "edahab wallet enabled",
  bank_transfer_payouts_enabled: "Bank transfer payouts enabled",
  listing_tiers: "Listing pricing tiers",
};

function isListingTiersConfig(value: unknown): value is ListingTiersConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "tiers" in value &&
    Array.isArray((value as ListingTiersConfig).tiers)
  );
}

function AdminSettingsPage() {
  const configs = Route.useLoaderData();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(
    () => Object.fromEntries(configs.map((c) => [c.key, c.value]))
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sweepLoading, setSweepLoading] = useState(false);
  const [sweepResult, setSweepResult] = useState<{ expiredCount: number } | null>(
    null
  );

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await Promise.all(
        Object.entries(values).map(([key, value]) =>
          updateAdminPlatformConfig({
            data: {
              key,
              value: value as string | number | boolean | Record<string, unknown>,
            },
          })
        )
      );
      await router.invalidate();
      setSaved(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSweep = async () => {
    setSweepLoading(true);
    setSweepResult(null);
    try {
      const result = await runAdminExpirySweep();
      setSweepResult(result);
      await router.invalidate();
    } finally {
      setSweepLoading(false);
    }
  };

  const tiersValue = values.listing_tiers;
  const tiersConfig = isListingTiersConfig(tiersValue)
    ? tiersValue
    : DEFAULT_LISTING_TIERS;

  const updateTier = (idx: number, patch: Partial<PricingTier>) => {
    setValues((v) => {
      const current = isListingTiersConfig(v.listing_tiers)
        ? v.listing_tiers
        : DEFAULT_LISTING_TIERS;
      const tiers = current.tiers.map((t, i) =>
        i === idx ? { ...t, ...patch } : t
      );
      return { ...v, listing_tiers: { ...current, tiers } };
    });
  };

  const updateMultiplier = (condition: string, multiplier: number) => {
    setValues((v) => {
      const current = isListingTiersConfig(v.listing_tiers)
        ? v.listing_tiers
        : DEFAULT_LISTING_TIERS;
      return {
        ...v,
        listing_tiers: {
          ...current,
          conditionMultipliers: {
            ...current.conditionMultipliers,
            [condition]: multiplier,
          },
        },
      };
    });
  };

  const resetTiers = () => {
    setValues((v) => ({ ...v, listing_tiers: DEFAULT_LISTING_TIERS }));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Platform configuration" />

      <Card className="border-celis-border bg-celis-surface-base">
        <CardHeader>
          <CardTitle className="text-lg">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {configs
            .filter((c) => c.key !== "listing_tiers")
            .map((config) => {
              const label = LABELS[config.key] ?? config.key;
              const isBool = typeof config.defaultValue === "boolean";
              return (
                <div
                  key={config.key}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Label htmlFor={config.key}>{label}</Label>
                    {config.updatedAt && (
                      <p className="text-xs text-celis-ink-secondary">
                        Last updated {formatRelativeDate(config.updatedAt)}
                      </p>
                    )}
                  </div>
                  {isBool ? (
                    <Switch
                      id={config.key}
                      checked={Boolean(values[config.key])}
                      onCheckedChange={(checked) =>
                        setValues((v) => ({ ...v, [config.key]: checked }))
                      }
                    />
                  ) : (
                    <Input
                      id={config.key}
                      type="number"
                      className="sm:w-48"
                      value={(values[config.key] as string | number) ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          [config.key]:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        }))
                      }
                    />
                  )}
                </div>
              );
            })}

          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
            {saved && (
              <span className="text-sm text-celis-success">Saved.</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-celis-border bg-celis-surface-base">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Listing pricing tiers</CardTitle>
            <Button variant="outline" size="sm" onClick={resetTiers}>
              Reset to defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-celis-border text-left text-celis-ink-secondary">
                  <th className="pb-2 font-medium">Label</th>
                  <th className="pb-2 font-medium">Min price</th>
                  <th className="pb-2 font-medium">Max price</th>
                  <th className="pb-2 font-medium">Fee</th>
                  <th className="pb-2 font-medium">Expiry days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-celis-border">
                {tiersConfig.tiers.map((tier, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-3">
                      <Input
                        value={tier.label}
                        onChange={(e) =>
                          updateTier(idx, { label: e.target.value })
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={tier.minCents}
                        onChange={(e) =>
                          updateTier(idx, {
                            minCents: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="No max"
                        value={tier.maxCents ?? ""}
                        onChange={(e) =>
                          updateTier(idx, {
                            maxCents:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={tier.feeCents}
                        onChange={(e) =>
                          updateTier(idx, {
                            feeCents: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={tier.expiryDays}
                        onChange={(e) =>
                          updateTier(idx, {
                            expiryDays: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-medium text-celis-ink">
              Condition fee multipliers
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ITEM_CONDITIONS.map((condition) => (
                <div
                  key={condition}
                  className="flex items-center justify-between gap-3"
                >
                  <Label htmlFor={`mult-${condition}`} className="capitalize">
                    {condition.replace(/_/g, " ")}
                  </Label>
                  <Input
                    id={`mult-${condition}`}
                    type="number"
                    min={0}
                    step={0.05}
                    className="w-28"
                    value={tiersConfig.conditionMultipliers[condition] ?? 1}
                    onChange={(e) =>
                      updateMultiplier(condition, Number(e.target.value))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save pricing"}
            </Button>
            {saved && (
              <span className="text-sm text-celis-success">Saved.</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-celis-border bg-celis-surface-base">
        <CardHeader>
          <CardTitle className="text-lg">Listing expiry sweep</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-celis-ink-secondary">
            Manually mark active listings whose expiry date has passed as{" "}
            <code>expired</code>. Run this periodically or set up a cron job.
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={handleSweep} disabled={sweepLoading}>
              {sweepLoading ? "Running..." : "Run expiry sweep"}
            </Button>
            {sweepResult && (
              <span className="text-sm text-celis-ink-secondary">
                {sweepResult.expiredCount} listing
                {sweepResult.expiredCount === 1 ? "" : "s"} expired.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-celis-border bg-celis-surface-base">
        <CardHeader>
          <CardTitle className="text-lg">Audit log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-celis-border">
            {configs
              .filter((c) => c.description)
              .map((c) => (
                <div key={c.key} className="py-3 text-sm">
                  <p className="font-medium text-celis-ink">
                    {LABELS[c.key] ?? c.key}
                  </p>
                  <p className="text-xs text-celis-ink-secondary">
                    {c.description}
                  </p>
                </div>
              ))}
            {configs.every((c) => !c.description) && (
              <p className="py-4 text-sm text-celis-ink-secondary">
                No config changes recorded yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
