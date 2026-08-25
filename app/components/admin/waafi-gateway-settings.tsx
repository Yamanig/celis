import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Skeleton } from "~/components/ui/skeleton";
import {
  fetchAdminWaafiGateway,
  updateAdminWaafiGateway,
} from "~/server/payment-gateways.functions";
import {
  WAAFI_PRODUCTION_URL,
  WAAFI_SANDBOX_URL,
} from "~/lib/waafi";

type Environment = "sandbox" | "production";

export function WaafiGatewaySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [masked, setMasked] = useState({ merchant: "", user: "", key: "" });
  const [form, setForm] = useState({
    enabled: false,
    environment: "sandbox" as Environment,
    baseUrl: WAAFI_SANDBOX_URL,
    merchantUid: "",
    apiUserId: "",
    apiKey: "",
    timeoutSeconds: 30,
  });

  useEffect(() => {
    let active = true;
    fetchAdminWaafiGateway()
      .then((gateway) => {
        if (!active) return;
        setConfigured(gateway.configured);
        setMasked({
          merchant: gateway.merchantUidMasked ?? "",
          user: gateway.apiUserIdMasked ?? "",
          key: gateway.apiKeyMasked ?? "",
        });
        setForm((current) => ({
          ...current,
          enabled: gateway.enabled,
          environment: gateway.environment,
          baseUrl: gateway.baseUrl,
          timeoutSeconds: gateway.timeoutSeconds,
        }));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load WaafiPay settings."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const selectEnvironment = (environment: Environment) => {
    setForm((current) => ({
      ...current,
      environment,
      baseUrl: environment === "production" ? WAAFI_PRODUCTION_URL : WAAFI_SANDBOX_URL,
      enabled: environment === "production" ? false : current.enabled,
    }));
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateAdminWaafiGateway({
        data: {
          enabled: form.enabled,
          environment: form.environment,
          baseUrl: form.baseUrl,
          merchantUid: form.merchantUid || undefined,
          apiUserId: form.apiUserId || undefined,
          apiKey: form.apiKey || undefined,
          timeoutSeconds: form.timeoutSeconds,
        },
      });
      setConfigured(true);
      setMasked({
        merchant: form.merchantUid ? `••••${form.merchantUid.slice(-4)}` : masked.merchant,
        user: form.apiUserId ? `••••${form.apiUserId.slice(-4)}` : masked.user,
        key: form.apiKey ? `••••${form.apiKey.slice(-4)}` : masked.key,
      });
      setForm((current) => ({ ...current, merchantUid: "", apiUserId: "", apiKey: "" }));
      setMessage("WaafiPay settings saved securely.");
      setConfirmOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save WaafiPay settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="border-celis-border bg-celis-surface-base">
        <CardHeader>
          <CardTitle className="text-lg">WaafiPay gateway</CardTitle>
          <p className="max-w-2xl text-xs text-celis-ink-secondary">
            Credentials are encrypted before storage and never returned to the browser. Blank secret fields keep the current value.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="space-y-5" aria-label="Loading WaafiPay settings">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-44" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Environment</Label>
                  <Select value={form.environment} onValueChange={(value) => selectEnvironment(value as Environment)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waafi-timeout">Timeout (seconds)</Label>
                  <Input
                    id="waafi-timeout"
                    type="number"
                    min={5}
                    max={120}
                    value={form.timeoutSeconds}
                    onChange={(event) => setForm((current) => ({ ...current, timeoutSeconds: Number(event.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="waafi-url">API endpoint</Label>
                <Input id="waafi-url" value={form.baseUrl} readOnly />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="waafi-merchant">Merchant UID</Label>
                  <Input
                    id="waafi-merchant"
                    type="password"
                    autoComplete="new-password"
                    placeholder={masked.merchant || "Required"}
                    value={form.merchantUid}
                    onChange={(event) => setForm((current) => ({ ...current, merchantUid: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waafi-user">API User ID</Label>
                  <Input
                    id="waafi-user"
                    type="password"
                    autoComplete="new-password"
                    placeholder={masked.user || "Required"}
                    value={form.apiUserId}
                    onChange={(event) => setForm((current) => ({ ...current, apiUserId: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waafi-key">API Key</Label>
                  <Input
                    id="waafi-key"
                    type="password"
                    autoComplete="new-password"
                    placeholder={masked.key || "Required"}
                    value={form.apiKey}
                    onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-celis-border p-3">
                <div>
                  <Label htmlFor="waafi-enabled">Accept WaafiPay payments</Label>
                  <p className="text-xs text-celis-ink-secondary">
                    {form.environment === "production" ? "Save production credentials before enabling live payments." : "Sandbox payments use Waafi test wallets."}
                  </p>
                </div>
                <Switch
                  id="waafi-enabled"
                  checked={form.enabled}
                  onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
                />
              </div>

              {message && <p className="text-sm text-celis-success">{message}</p>}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button onClick={() => setConfirmOpen(true)} disabled={saving}>
                Save WaafiPay settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm gateway change</DialogTitle>
            <DialogDescription>
              Save {form.environment} WaafiPay configuration{form.enabled ? " and enable payments" : " with payments disabled"}. This action is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-celis-ink-secondary">
            {configured ? "Blank credential fields will keep their encrypted values." : "All three credentials are required for first-time setup."}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Confirm & save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
