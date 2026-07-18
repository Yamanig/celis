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
  fetchCategoryConditions,
  fetchCategoryMetadataSchema,
  listChildCategories,
  type CategoryConditionItem,
} from "~/server/categories.functions";
import { getListingPricingPreview } from "~/server/config.functions";
import {
  DELIVERY_METHODS,
  MONETIZATION_TYPES,
  WALLET_PROVIDERS,
} from "~/db/schema";
import { formatPrice } from "~/lib/format";
import {
  calculateListingPricing,
  type ListingTiersConfig,
  type ListingPricing,
  type MonetizationModel,
} from "~/lib/pricing";
import {
  validateMetadata,
  normalizeMetadataValue,
  formatMetadataValue,
  type MetadataField,
  type CategoryMetadataSchema,
} from "~/lib/category-metadata";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import type { CategoryListItem } from "~/server/categories.functions";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";

interface FeatureToggles {
  localPickupEnabled: boolean;
  platformShippingEnabled: boolean;
  evcEnabled: boolean;
  premierWalletEnabled: boolean;
  edahabEnabled: boolean;
}

interface ListingWizardProps {
  sellerId: string;
  categories: CategoryListItem[];
  tiersConfig: ListingTiersConfig;
  monetizationModel: MonetizationModel;
  featureToggles: FeatureToggles;
}

const STEPS = ["Details", "Pricing", "Photos", "Review"];

function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

const emptyForm: ListingInput = {
  title: "",
  description: "",
  categoryId: "",
  condition: null,
  price: 0,
  monetizationType: "fixed_rate",
  deliveryMethod: "local_pickup",
  images: [],
  metadata: {},
};

export function ListingWizard({
  sellerId,
  categories,
  tiersConfig,
  monetizationModel,
  featureToggles,
}: ListingWizardProps) {
  const enabledDeliveryMethods = useMemo(() => {
    return DELIVERY_METHODS.filter((m) => {
      if (m === "shipping") return featureToggles.platformShippingEnabled;
      if (m === "local_pickup") return featureToggles.localPickupEnabled;
      return featureToggles.platformShippingEnabled && featureToggles.localPickupEnabled;
    });
  }, [featureToggles]);

  const enabledWalletProviders = useMemo(() => {
    return WALLET_PROVIDERS.filter((p) => {
      if (p === "evc") return featureToggles.evcEnabled;
      if (p === "premier") return featureToggles.premierWalletEnabled;
      if (p === "edahab") return featureToggles.edahabEnabled;
      return true;
    });
  }, [featureToggles]);

  const defaultDeliveryMethod = enabledDeliveryMethods[0] ?? "local_pickup";

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ListingInput>({
    ...emptyForm,
    monetizationType:
      monetizationModel === "commission_only" ? "commission" : "fixed_rate",
    deliveryMethod: defaultDeliveryMethod as ListingInput["deliveryMethod"],
  });

  // If toggles change and the selected delivery method is no longer available,
  // fall back to the first enabled option.
  useEffect(() => {
    if (!enabledDeliveryMethods.includes(form.deliveryMethod)) {
      setForm((prev) => ({
        ...prev,
        deliveryMethod: defaultDeliveryMethod as ListingInput["deliveryMethod"],
      }));
    }
  }, [enabledDeliveryMethods, defaultDeliveryMethod, form.deliveryMethod]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [serverFeeCents, setServerFeeCents] = useState<number>(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submittedForReview, setSubmittedForReview] = useState(false);
  const [eligibility, setEligibility] = useState<{
    sellerType: "individual" | "shop";
    canList: boolean;
    requiresPayment: boolean;
    remainingListings: number | null;
  } | null>(null);
  const [categoryConditions, setCategoryConditions] = useState<
    CategoryConditionItem[]
  >([]);
  const [metadataSchema, setMetadataSchema] = useState<CategoryMetadataSchema | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [subcategories, setSubcategories] = useState<CategoryListItem[]>([]);

  useEffect(() => {
    fetchSellerListingEligibility({ data: { sellerId } }).then(setEligibility);
  }, [sellerId]);

  useEffect(() => {
    if (!parentCategoryId) {
      setSubcategories([]);
      return;
    }
    listChildCategories({ data: { parentId: parentCategoryId } }).then(
      setSubcategories
    );
  }, [parentCategoryId]);

  useEffect(() => {
    if (!form.categoryId) {
      setCategoryConditions([]);
      setMetadataSchema(null);
      return;
    }
    fetchCategoryConditions({ data: { categoryId: form.categoryId } }).then(
      setCategoryConditions
    );
    fetchCategoryMetadataSchema({ data: { categoryId: form.categoryId } }).then(
      setMetadataSchema
    );
  }, [form.categoryId]);

  useEffect(() => {
    setForm((prev) => {
      if (!prev.condition) return prev;
      if (
        categoryConditions.length > 0 &&
        !categoryConditions.some((c) => c.code === prev.condition)
      ) {
        return { ...prev, condition: null };
      }
      return prev;
    });
  }, [categoryConditions]);

  const updateField = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateMetadata = (key: string, value: unknown) => {
    const field = metadataSchema?.fields.find((f) => f.key === key);
    const normalized = field
      ? normalizeMetadataValue(field.type, value)
      : value === null || value === undefined
      ? null
      : typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? value
      : null;
    setForm((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: normalized },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateStep = () => {
    const result = listingSchema.safeParse(form);
    const metadataErrors = validateMetadata(metadataSchema, form.metadata);
    if (!result.success || Object.keys(metadataErrors).length > 0) {
      const fieldErrors: Record<string, string> = { ...metadataErrors };
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const path = issue.path[0] as string;
          if (!fieldErrors[path]) fieldErrors[path] = issue.message;
        });
      }
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

  const [preview, setPreview] = useState<ListingPricing>(() =>
    calculateListingPricing(form.price, tiersConfig, {
      monetizationModel,
    })
  );

  const rootCategoryOptions = useMemo(
    () => categories.map((cat) => ({ value: cat.id, label: cat.name })),
    [categories]
  );
  const subcategoryOptions = useMemo(
    () => subcategories.map((cat) => ({ value: cat.id, label: cat.name })),
    [subcategories]
  );
  const allCategories = useMemo(
    () => [...categories, ...subcategories],
    [categories, subcategories]
  );
  const conditionOptions = useMemo(
    () => categoryConditions.map((c) => ({ value: c.code, label: c.label })),
    [categoryConditions]
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
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!form.categoryId) {
        setPreview(
          calculateListingPricing(form.price, tiersConfig, {
            monetizationModel,
          })
        );
        return;
      }
      getListingPricingPreview({
        data: {
          price: form.price,
          categoryId: form.categoryId,
        },
      }).then(setPreview);
    }, 250);
    return () => clearTimeout(timeout);
  }, [form.price, form.condition, form.categoryId, tiersConfig, monetizationModel]);

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
      setServerFeeCents(result.feeCents ?? 0);

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
                <Label htmlFor="parentCategory">Category</Label>
                <Combobox
                  value={parentCategoryId}
                  onValueChange={(v) => {
                    setParentCategoryId(v);
                    setForm((prev) => ({
                      ...prev,
                      categoryId: "",
                      condition: null,
                    }));
                  }}
                  placeholder="Select a category"
                  searchPlaceholder="Search categories..."
                  options={rootCategoryOptions}
                />
              </div>

              {parentCategoryId && subcategoryOptions.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Combobox
                    value={form.categoryId}
                    onValueChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        categoryId: v,
                        condition: null,
                      }))
                    }
                    placeholder="Select a subcategory"
                    searchPlaceholder="Search subcategories..."
                    options={subcategoryOptions}
                  />
                  {errors.categoryId && (
                    <p className="text-sm text-celis-destructive">{errors.categoryId}</p>
                  )}
                </div>
              )}

              {form.categoryId && (
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Combobox
                    value={form.condition ?? undefined}
                    onValueChange={(v) =>
                      updateField("condition", v as NonNullable<ListingInput["condition"]>)
                    }
                    options={conditionOptions}
                  />
                </div>
              )}

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

              {metadataSchema && metadataSchema.fields.length > 0 && (
                <div className="space-y-4 rounded-lg border border-celis-border bg-celis-surface-inset p-4">
                  <h3 className="text-sm font-medium text-celis-ink">
                    Category details
                  </h3>
                  {metadataSchema.fields.map((field) => (
                    <MetadataFieldInput
                      key={field.key}
                      field={field}
                      value={form.metadata[field.key]}
                      error={errors[field.key]}
                      onChange={(value) => updateMetadata(field.key, value)}
                    />
                  ))}
                </div>
              )}
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
                <p className="mb-2 font-medium text-celis-ink">Listing fee tiers</p>
                <ul className="space-y-1">
                  {tiersConfig.tiers.map((tier) => {
                    const min = tier.minCents / 100;
                    const max = tier.maxCents === null ? null : tier.maxCents / 100;
                    const range = max === null
                      ? `$${min.toLocaleString()}+`
                      : `$${min.toLocaleString()} – $${max.toLocaleString()}`;
                    return (
                      <li
                        key={tier.label}
                        className={`flex items-center justify-between ${
                          preview.tierLabel === tier.label
                            ? "font-medium text-celis-ink"
                            : ""
                        }`}
                      >
                        <span>
                          {tier.label}: {range}
                        </span>
                        <span>{formatPrice(tier.feeCents)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-lg border border-celis-border bg-celis-surface-inset p-4 text-sm text-celis-ink-secondary">
                <p className="font-medium text-celis-ink">
                  {preview.tierLabel} tier
                </p>
                {preview.feeCents > 0 && (
                  <p>
                    Listing fee:{" "}
                    <strong className="text-celis-ink">
                      {formatPrice(preview.feeCents)}
                    </strong>
                  </p>
                )}
                {preview.commissionAmountCents !== null && preview.commissionAmountCents > 0 && (
                  <p>
                    Commission ({(preview.commissionBps ?? 0) / 100}%):{" "}
                    <strong className="text-celis-ink">
                      {formatPrice(preview.commissionAmountCents)}
                    </strong>
                  </p>
                )}
                {preview.totalFeeCents > 0 && (
                  <p>
                    Total charge:{" "}
                    <strong className="text-celis-ink">
                      {formatPrice(preview.totalFeeCents)}
                    </strong>
                  </p>
                )}
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
                    {allCategories.find((c) => c.id === form.categoryId)?.name ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between py-2">
                  <dt className="text-celis-ink-secondary">Condition</dt>
                  <dd className="font-medium">
                    {categoryConditions.find((c) => c.code === form.condition)?.label ??
                      form.condition?.replace(/_/g, " ") ??
                      "—"}
                  </dd>
                </div>
                {metadataSchema &&
                  metadataSchema.fields.map((field) => (
                    <div key={field.key} className="flex justify-between py-2">
                      <dt className="text-celis-ink-secondary">{field.label}</dt>
                      <dd className="font-medium">
                        {formatMetadataValue(field, form.metadata[field.key])}
                      </dd>
                    </div>
                  ))}
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
                  <dd className="font-medium">
                    {preview.feeCents > 0 ? formatPrice(preview.feeCents) : "—"}
                  </dd>
                </div>
                {preview.commissionAmountCents !== null && preview.commissionAmountCents > 0 && (
                  <div className="flex justify-between py-2">
                    <dt className="text-celis-ink-secondary">Commission</dt>
                    <dd className="font-medium">
                      {formatPrice(preview.commissionAmountCents)} ({(preview.commissionBps ?? 0) / 100}%)
                    </dd>
                  </div>
                )}
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
                ? `Publish & pay ${formatPrice(serverFeeCents || preview.totalFeeCents)}`
                : eligibility?.sellerType === "shop"
                ? `Publish (package: ${
                    eligibility?.remainingListings === null
                      ? "Unlimited"
                      : `${eligibility?.remainingListings} left`
                  })`
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
        amountCents={serverFeeCents || preview.totalFeeCents}
        enabledProviders={enabledWalletProviders}
        onSuccess={() => setSubmittedForReview(true)}
      />
    </>
  );
}

function MetadataFieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: MetadataField;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}) {
  const normalized = normalizeMetadataValue(field.type, value);

  return (
    <div className="space-y-2">
      <Label htmlFor={`meta-${field.key}`}>
        {field.label}
        {field.required && <span className="text-celis-destructive"> *</span>}
      </Label>
      {field.type === "text" && (
        <Input
          id={`meta-${field.key}`}
          value={normalized as string}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.type === "number" && (
        <Input
          id={`meta-${field.key}`}
          type="number"
          value={normalized as number}
          onChange={(e) =>
            onChange(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
        />
      )}
      {field.type === "boolean" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={normalized as boolean}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-celis-border"
          />
          Yes
        </label>
      )}
      {field.type === "select" && (
        <Select
          value={normalized as string}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger id={`meta-${field.key}`} className="w-full">
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-[50vh]">
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {error && <p className="text-sm text-celis-destructive">{error}</p>}
    </div>
  );
}
