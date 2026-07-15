import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
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
  head: () => ({
    meta: [
      { title: "Settings | Admin | Celis" },
      { name: "description", content: "Configure platform settings and pricing in Celis admin." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),

  loader: async () => fetchPlatformConfigAll(),
});

const PLATFORM_CURRENCY = "USD";
const MAX_COMMISSION_BPS = 5000; // 50%

interface ConfigItem {
  key: string;
  value: string | number | boolean;
  defaultValue: string | number | boolean | object;
  updatedAt: Date | null;
  updatedBy: string | null;
  description: string | null;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
}

const LABELS: Record<string, string> = {
  listing_fee_cents: "Listing fee",
  commission_bps: "Sales commission",
  local_pickup_enabled: "Local pickup",
  platform_shipping_enabled: "Platform shipping",
  commission_model_enabled: "Commission model",
  evc_enabled: "EVC wallet",
  premier_wallet_enabled: "Premier wallet",
  edahab_enabled: "edahab wallet",
  bank_transfer_payouts_enabled: "Bank transfer payouts",
  listing_tiers: "Listing pricing tiers",
};

const HELPERS: Record<string, string> = {
  listing_fee_cents: "Fixed fee charged when a seller publishes or renews a listing.",
  commission_bps:
    "Percentage charged only when an order reaches the business-defined completed status.",
  local_pickup_enabled: "Allow buyers to pick up items directly from the seller.",
  platform_shipping_enabled: "Enable platform-managed shipping options.",
  commission_model_enabled:
    "Enable commission-on-sale as a charging model. Requires the commission percentage to be set.",
  evc_enabled: "Accept EVC wallet payments.",
  premier_wallet_enabled: "Accept Premier wallet payments.",
  edahab_enabled: "Accept edahab wallet payments.",
  bank_transfer_payouts_enabled: "Allow sellers to receive payouts via bank transfer.",
  listing_tiers: "Price bands used to calculate listing fees and expiry durations.",
};

const FINANCIAL_KEYS = new Set([
  "listing_fee_cents",
  "commission_bps",
  "commission_model_enabled",
  "bank_transfer_payouts_enabled",
]);

function isListingTiersConfig(value: unknown): value is ListingTiersConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "tiers" in value &&
    Array.isArray((value as ListingTiersConfig).tiers)
  );
}

function formatCurrency(cents: number, currency = PLATFORM_CURRENCY): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

function AdminSettingsPage() {
  const configs = Route.useLoaderData();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(
    () => Object.fromEntries(configs.map((c) => [c.key, c.value]))
  );
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sweepLoading, setSweepLoading] = useState(false);
  const [sweepResult, setSweepResult] = useState<{ expiredCount: number } | null>(
    null
  );
  const [confirm, setConfirm] = useState<{
    open: boolean;
    key: string;
    value: string | number | boolean | Record<string, unknown>;
  }>({ open: false, key: "", value: "" });

  const configMap = useMemo(
    () => new Map(configs.map((c) => [c.key, c])),
    [configs]
  );

  const validate = (key: string, value: unknown): string | null => {
    if (key === "listing_fee_cents") {
      const n = Number(value);
      if (Number.isNaN(n) || n < 0) return "Listing fee must be a non-negative amount.";
      if (!Number.isInteger(n)) return "Listing fee must be a whole number of cents.";
    }
    if (key === "commission_bps") {
      const n = Number(value);
      if (Number.isNaN(n) || n < 0) return "Commission must be non-negative.";
      if (!Number.isInteger(n)) return "Commission must be a whole number of basis points.";
      if (n > MAX_COMMISSION_BPS)
        return `Commission cannot exceed ${bpsToPercent(MAX_COMMISSION_BPS)}.`;
    }
    return null;
  };

  const validateDependencies = (
    allValues: Record<string, unknown>
  ): Record<string, string | null> => {
    const deps: Record<string, string | null> = {};
    const commissionEnabled = Boolean(allValues.commission_model_enabled);
    const bps = Number(allValues.commission_bps);
    if (commissionEnabled && (Number.isNaN(bps) || bps <= 0)) {
      deps.commission_model_enabled =
        "Enable commission only after setting a commission percentage greater than 0.";
      deps.commission_bps =
        "Commission must be greater than 0 when the commission model is enabled.";
    }
    return deps;
  };

  const handleChange = (key: string, value: unknown) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: validate(key, value) }));
    setSaved(false);
  };

  const confirmSave = (key: string) => {
    const value = values[key] as string | number | boolean | Record<string, unknown>;
    const fieldError = validate(key, value);
    const depErrors = validateDependencies(values);
    if (fieldError || depErrors[key]) {
      setErrors((e) => ({ ...e, [key]: fieldError ?? depErrors[key] }));
      return;
    }
    if (FINANCIAL_KEYS.has(key)) {
      setConfirm({ open: true, key, value });
    } else {
      doSave(key, value);
    }
  };

  const doSave = async (
    key: string,
    value: string | number | boolean | Record<string, unknown>
  ) => {
    setLoading(true);
    setSaved(false);
    try {
      await updateAdminPlatformConfig({ data: { key, value } });
      await router.invalidate();
      setSaved(true);
    } finally {
      setLoading(false);
      setConfirm((c) => ({ ...c, open: false }));
    }
  };

  const handleSaveAll = async () => {
    const nextErrors: Record<string, string | null> = {};
    for (const key of Object.keys(values)) {
      nextErrors[key] = validate(key, values[key]);
    }
    const depErrors = validateDependencies(values);
    for (const key of Object.keys(depErrors)) {
      if (depErrors[key]) nextErrors[key] = depErrors[key];
    }
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

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

  const feeConfigs = configs.filter(
    (c) => c.key === "listing_fee_cents" || c.key === "commission_bps"
  );
  const featureConfigs = configs.filter(
    (c) =>
      c.key !== "listing_fee_cents" &&
      c.key !== "commission_bps" &&
      c.key !== "listing_tiers"
  );

  const renderInput = (config: ConfigItem) => {
    const label = LABELS[config.key] ?? config.key;
    const isBool = typeof config.defaultValue === "boolean";
    const value = values[config.key];

    if (isBool) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Switch
              id={config.key}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleChange(config.key, checked)}
            />
            <Label htmlFor={config.key} className="cursor-pointer">
              {label}
            </Label>
          </div>
          {errors[config.key] && (
            <p className="text-xs text-destructive">{errors[config.key]}</p>
          )}
        </div>
      );
    }

    if (config.key === "listing_fee_cents") {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              id={config.key}
              type="number"
              min={0}
              step={1}
              className="sm:w-48"
              value={value as number}
              onChange={(e) =>
                handleChange(
                  config.key,
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
            <span className="text-sm text-celis-ink-secondary">
              = {formatCurrency(Number(value) || 0)}
            </span>
          </div>
          {errors[config.key] && (
            <p className="text-xs text-destructive">{errors[config.key]}</p>
          )}
        </div>
      );
    }

    if (config.key === "commission_bps") {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              id={config.key}
              type="number"
              min={0}
              max={MAX_COMMISSION_BPS}
              step={1}
              className="sm:w-48"
              value={value as number}
              onChange={(e) =>
                handleChange(
                  config.key,
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
            <span className="text-sm text-celis-ink-secondary">
              = {bpsToPercent(Number(value) || 0)}
            </span>
          </div>
          {errors[config.key] && (
            <p className="text-xs text-destructive">{errors[config.key]}</p>
          )}
        </div>
      );
    }

    return (
      <Input
        id={config.key}
        type="number"
        className="sm:w-48"
        value={(value as string | number) ?? ""}
        onChange={(e) =>
          handleChange(
            config.key,
            e.target.value === "" ? "" : Number(e.target.value)
          )
        }
      />
    );
  };

  const confirmItem = confirm.open ? configMap.get(confirm.key) : undefined;
  const confirmPreviousValue = confirmItem?.value;
  const confirmDisplayPrevious =
    confirm.key === "listing_fee_cents"
      ? formatCurrency(Number(confirmPreviousValue) || 0)
      : confirm.key === "commission_bps"
      ? bpsToPercent(Number(confirmPreviousValue) || 0)
      : String(confirmPreviousValue);
  const confirmDisplayNew =
    confirm.key === "listing_fee_cents"
      ? formatCurrency(Number(confirm.value) || 0)
      : confirm.key === "commission_bps"
      ? bpsToPercent(Number(confirm.value) || 0)
      : String(confirm.value);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Platform configuration" />

      <Card className="border-celis-border bg-celis-surface-base">
        <CardHeader>
          <CardTitle className="text-lg">Fees</CardTitle>
          <p className="text-xs text-celis-ink-secondary">
            Financial settings require confirmation and are recorded in the audit log.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {feeConfigs.map((config) => (
            <div
              key={config.key}
              className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="space-y-1">
                <Label htmlFor={config.key}>{LABELS[config.key] ?? config.key}</Label>
                <p className="max-w-md text-xs text-celis-ink-secondary">
                  {HELPERS[config.key]}
                </p>
                {config.updatedAt && (
                  <p className="text-xs text-celis-ink-tertiary">
                    Last updated {formatRelativeDate(config.updatedAt)}
                    {config.effectiveFrom || config.effectiveUntil
                      ? ` · effective ${
                          config.effectiveFrom
                            ? new Date(config.effectiveFrom).toLocaleDateString()
                            : "now"
                        } – ${
                          config.effectiveUntil
                            ? new Date(config.effectiveUntil).toLocaleDateString()
                            : "ongoing"
                        }`
                      : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {renderInput(config)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => confirmSave(config.key)}
                  disabled={
                    loading ||
                    values[config.key] === config.value ||
                    Boolean(errors[config.key])
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-celis-border bg-celis-surface-base">
        <CardHeader>
          <CardTitle className="text-lg">Features and payment methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {featureConfigs.map((config) => (
            <div
              key={config.key}
              className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="space-y-1">
                <Label htmlFor={config.key}>{LABELS[config.key] ?? config.key}</Label>
                <p className="max-w-md text-xs text-celis-ink-secondary">
                  {HELPERS[config.key]}
                </p>
                {config.updatedAt && (
                  <p className="text-xs text-celis-ink-tertiary">
                    Last updated {formatRelativeDate(config.updatedAt)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {renderInput(config)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => confirmSave(config.key)}
                  disabled={
                    loading ||
                    values[config.key] === config.value ||
                    Boolean(errors[config.key])
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSaveAll} disabled={loading}>
              {loading ? "Saving..." : "Save all changes"}
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
            <Button onClick={handleSaveAll} disabled={loading}>
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

      <Dialog open={confirm.open} onOpenChange={(open) => setConfirm((c) => ({ ...c, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm financial setting change</DialogTitle>
            <DialogDescription>
              You are changing <strong>{LABELS[confirm.key] ?? confirm.key}</strong>.
              This will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2 text-sm">
            <div className="flex justify-between">
              <span className="text-celis-ink-secondary">Previous value</span>
              <span className="font-medium">{confirmDisplayPrevious}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-celis-ink-secondary">New value</span>
              <span className="font-medium">{confirmDisplayNew}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirm((c) => ({ ...c, open: false }))}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => doSave(confirm.key, confirm.value)}
              disabled={loading}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
