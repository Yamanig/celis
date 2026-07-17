"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { initiatePayment, simulateConfirmPayment } from "~/server/payments.functions";
import { WALLET_PROVIDERS } from "~/db/schema";
import { formatPrice } from "~/lib/format";
import { Loader2, CheckCircle2 } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  listingId: string | null;
  amountCents: number;
  enabledProviders?: readonly string[];
  featureListing?: boolean;
  onSuccess: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  userId,
  listingId,
  amountCents,
  enabledProviders = WALLET_PROVIDERS,
  featureListing = false,
  onSuccess,
}: PaymentModalProps) {
  const providers = (enabledProviders.length > 0 ? enabledProviders : WALLET_PROVIDERS) as string[];
  const [provider, setProvider] = useState<string>(providers[0]);
  const [phone, setPhone] = useState("");
  const [merchantRef, setMerchantRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setProvider(providers[0]);
    setPhone("");
    setMerchantRef(null);
    setError(null);
    setSuccess(false);
    setLoading(false);
  };

  const handleInitiate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await initiatePayment({
        data: {
          userId,
          listingId,
          orderId: null,
          provider: provider as (typeof WALLET_PROVIDERS)[number],
          phone,
          featureListing,
        },
      });
      setMerchantRef(result.merchantRef);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be started");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateConfirm = async () => {
    if (!merchantRef || !listingId) return;
    setLoading(true);
    setError(null);
    try {
      await simulateConfirmPayment({
        data: { merchantRef, listingId },
      });
      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {featureListing ? "Pay feature fee" : "Pay listing fee"}
          </DialogTitle>
          <DialogDescription>
            {featureListing
              ? `Feature this listing for ${formatPrice(amountCents)} via mobile money.`
              : `Activate your listing for ${formatPrice(amountCents)} via mobile money.`}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-celis-success" />
            <p className="text-lg font-medium">Payment received</p>
            <p className="text-sm text-celis-ink-secondary">
              {featureListing
                ? "Your listing is now featured for 7 days."
                : "Your listing is now live on Celis."}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="provider">Mobile wallet</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Wallet phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+25261XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!!merchantRef}
              />
            </div>

            {merchantRef && (
              <div className="rounded-md bg-celis-primary-subtle p-3 text-sm text-celis-ink-secondary">
                <p className="font-medium text-celis-ink">Payment initiated</p>
                <p>
                  Reference: <code className="text-xs">{merchantRef}</code>
                </p>
                <p className="mt-1">
                  In production you would confirm the prompt on your phone. For
                  development, click the button below to simulate approval.
                </p>
              </div>
            )}

            {error && <p className="text-sm text-celis-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {!success && !merchantRef && (
            <Button onClick={handleInitiate} disabled={!phone || loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pay {formatPrice(amountCents)}
            </Button>
          )}
          {!success && merchantRef && (
            <Button onClick={handleSimulateConfirm} disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simulate approval
            </Button>
          )}
          {success && (
            <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
