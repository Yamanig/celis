"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Combobox } from "~/components/ui/combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ImageUploader } from "./image-uploader";
import { PaymentModal } from "./payment-modal";
import { listingSchema, type ListingInput } from "~/lib/validation";
import {
  createListing,
  fetchSellerListingEligibility,
  submitShopListing,
} from "~/server/listings.functions";
import {
  ITEM_CONDITIONS,
  DELIVERY_METHODS,
  MONETIZATION_TYPES,
} from "~/db/schema";
import { formatPrice } from "~/lib/format";
import {
  calculateListingPricing,
  type ListingTiersConfig,
} from "~/lib/pricing";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import type { CategoryListItem } from "~/server/categories.functions";

interface ListingWizardProps {
  sellerId: string;
  categories: CategoryListItem[];
  tiersConfig: ListingTiersConfig;
}

const STEPS = ["Details", "Pricing", "Photos", "Review"];

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

const emptyForm: ListingInput = {
  title: "",
  description: "",
  categoryId: "",
  condition: "good",
  price: 0,
  monetizationType: "fixed_rate",
  deliveryMethod: "local_pickup",
  images: [],
  metadata: {},
};

export function ListingWizard({ sellerId, categories, tiersConfig }: ListingWizardProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ListingInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submittedForReview, setSubmittedForReview] = useState(false);
  const [eligibility, setEligibility] = useState<{
    sellerType: "individual" | "shop";
    canList: boolean;
    requiresPayment: boolean;
    remainingListings: number | null;
  } | null>(null);

  useEffect(() => {
    fetchSellerListingEligibility({ data: { sellerId } }).then(setEligibility);
  }, [sellerId]);

  const updateField = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStep = () => {
    const result = listingSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const canProceed = useMemo(() => {
    if (step === 0) {
      return form.title.length >= 5 && form.description.length >= 20 && form.categoryId;
    }
    if (step === 1) {
      return form.price >= 100 && form.deliveryMethod;
    }
    if (step === 2) {
      return form.images.length > 0;
    }
    return true;
  }, [step, form]);

  const preview = useMemo(
    () => calculateListingPricing(form.price, form.condition, tiersConfig),
    [form.price, form.condition, tiersConfig]
  );

  const categoryOptions = useMemo(
    () => categories.map((cat) => ({ value: cat.id, label: cat.name })),
    [categories]
  );
  const conditionOptions = useMemo(
    () => ITEM_CONDITIONS.map((c) => ({ value: c, label: titleCase(c) })),
    []
  );
  const monetizationOptions = useMemo(
    () =>
      MONETIZATION_TYPES.map((t) => ({
        value: t,
        label: t === "fixed_rate" ? "Fixed-rate listing" : "Commission on sale",
      })),
    []
  );
  const deliveryOptions = useMemo(
    () => DELIVERY_METHODS.map((m) => ({ value: m, label: titleCase(m) })),
    []
  );

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!eligibility?.canList) return;
    setSubmitting(true);
    try {
      const result = await createListing({
        data: { sellerId, listing: form },
      });
      setCreatedListingId(result.id);

      if (eligibility.requiresPayment) {
        setPaymentOpen(true);
      } else {
        await submitShopListing({
          data: { listingId: result.id, sellerId },
        });
        setSubmittedForReview(true);
      }
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "Failed to create listing" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedForReview) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-celis-success" />
          <h2 className="text-2xl font-semibold">Listing submitted for review</h2>
          <p className="text-celis-ink-secondary">
            Your listing is waiting for admin approval. It will appear publicly
            after review.
          </p>
          <Button asChild>
            <a href="/dashboard">Go to dashboard</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Sell an item</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </CardDescription>
          <div className="mt-4 flex gap-1">
            {STEPS.map((label, idx) => (
              <div
                key={label}
                className={`h-2.5 flex-1 rounded-full ${
                  idx <= step ? "bg-celis-primary" : "bg-celis-border"
                }`}
                aria-label={label}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {eligibility?.canList === false && (
            <div className="rounded-lg border border-celis-caution bg-celis-caution-subtle p-4 text-sm text-celis-ink">
              {eligibility.sellerType === "shop"
                ? "Your shop does not have an active listing package. Contact admin to activate a package before publishing."
                : "You cannot publish right now. Please check your account status."}
            </div>
          )}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="What are you selling?"
                />
                {errors.title && <p className="text-sm text-celis-destructive">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Combobox
                  value={form.categoryId}
                  onValueChange={(v) => updateField("categoryId", v)}
                  placeholder="Select a category"
                  searchPlaceholder="Search categories..."
                  options={categoryOptions}
                />
                {errors.categoryId && (
                  <p className="text-sm text-celis-destructive">{errors.categoryId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Combobox
                  value={form.condition}
                  onValueChange={(v) => updateField("condition", v as typeof form.condition)}
                  options={conditionOptions}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe the item, its condition, and any defects."
                  rows={5}
                />
                {errors.description && (
                  <p className="text-sm text-celis-destructive">{errors.description}</p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-celis-ink-secondary">$</span>
                  <Input
                    id="price"
                    type="number"
                    min={1}
                    step={1}
                    className="pl-7"
                    value={form.price / 100 || ""}
                    onChange={(e) =>
                      updateField("price", Math.round(parseFloat(e.target.value || "0") * 100))
                    }
                    placeholder="0.00"
                  />
                </div>
                {errors.price && <p className="text-sm text-celis-destructive">{errors.price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monetizationType">Listing type</Label>
                <Combobox
                  value={form.monetizationType}
                  onValueChange={(v) => updateField("monetizationType", v as typeof form.monetizationType)}
                  options={monetizationOptions}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryMethod">Delivery</Label>
                <Combobox
                  value={form.deliveryMethod}
                  onValueChange={(v) => updateField("deliveryMethod", v as typeof form.deliveryMethod)}
                  options={deliveryOptions}
                />
              </div>

              <div className="rounded-lg border border-celis-border bg-celis-surface-inset p-4 text-sm text-celis-ink-secondary">
                <p className="font-medium text-celis-ink">
                  {preview.tierLabel} tier
                </p>
                <p>
                  Listing fee:{" "}
                  <strong className="text-celis-ink">
                    {formatPrice(preview.feeCents)}
                  </strong>{" "}
                  {preview.baseFeeCents !== preview.feeCents && (
                    <span className="text-xs">
                      ({formatPrice(preview.baseFeeCents)} × condition multiplier)
                    </span>
                  )}
                </p>
                <p>Expires on {preview.expiresAt.toLocaleDateString()}.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <ImageUploader
                sellerId={sellerId}
                images={form.images}
                onChange={(imgs) => updateField("images", imgs)}
              />
              {errors.images && <p className="text-sm text-celis-destructive">{errors.images}</p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium">Review your listing</h3>
              <dl className="divide-y divide-celis-border text-sm">
                <div className="flex justify-between py-2">
                  <dt className="text-celis-ink-secondary">Title</dt>
                  <dd className="max-w-[60%] text-right font-medium">{form.title}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-celis-ink-secondary">Category</dt>
                  <dd className="font-medium">
                    {categories.find((c) => c.id === form.categoryId)?.name ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-celis-ink-secondary">Condition</dt>
                  <dd className="font-medium">{form.condition.replace(/_/g, " ")}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-celis-ink-secondary">Price</dt>
                  <dd className="font-medium">{formatPrice(form.price)}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-celis-ink-secondary">Delivery</dt>
                  <dd className="font-medium">{form.deliveryMethod.replace(/_/g, " ")}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-celis-ink-secondary">Listing fee</dt>
                  <dd className="font-medium">{formatPrice(preview.feeCents)}</dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-celis-ink-secondary">Expires</dt>
                  <dd className="font-medium">
                    {preview.expiresAt.toLocaleDateString()}
                  </dd>
                </div>
              </dl>
              <p className="text-sm text-celis-ink-secondary">
                {form.description}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {form.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.url}
                    alt=""
                    className="aspect-square rounded-md object-cover"
                  />
                ))}
              </div>
              {errors.submit && (
                <p className="text-sm text-celis-destructive">{errors.submit}</p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-celis-border pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} disabled={!canProceed}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed || submitting || eligibility?.canList === false}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {eligibility?.requiresPayment
                ? `Publish & pay ${formatPrice(preview.feeCents)}`
                : eligibility?.sellerType === "shop"
                ? `Publish (package: ${eligibility?.remainingListings ?? 0} left)`
                : "Publish"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        userId={sellerId}
        listingId={createdListingId}
        amountCents={preview.feeCents}
        onSuccess={() => setSubmittedForReview(true)}
      />
    </>
  );
}
