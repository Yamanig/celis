export type MonetizationModel = "fixed_only" | "commission_only" | "hybrid";

export interface FeeRuleInput {
  id?: string;
  feeType: "listing_fee" | "commission" | "featured_fee";
  amount?: number; // cents
  percentage?: number; // basis points (100 = 1%)
  currency: string;
}

export interface PricingTier {
  label: string;
  minCents: number;
  maxCents: number | null;
  feeCents: number;
  expiryDays: number;
}

export interface ListingTiersConfig {
  currency: string;
  tiers: PricingTier[];
}

export const DEFAULT_LISTING_TIERS: ListingTiersConfig = {
  currency: "USD",
  tiers: [
    {
      label: "Basic",
      minCents: 10,
      maxCents: 499,
      feeCents: 50,
      expiryDays: 7,
    },
    {
      label: "Standard",
      minCents: 500,
      maxCents: 4999,
      feeCents: 100,
      expiryDays: 14,
    },
    {
      label: "Premium",
      minCents: 5000,
      maxCents: null,
      feeCents: 250,
      expiryDays: 30,
    },
  ],
};

export function parseListingTiersConfig(raw: unknown): ListingTiersConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_LISTING_TIERS;
  const obj = raw as Partial<ListingTiersConfig>;
  const tiers = Array.isArray(obj.tiers)
    ? obj.tiers
        .filter(
          (t): t is PricingTier =>
            typeof t === "object" &&
            t !== null &&
            typeof t.label === "string" &&
            typeof t.minCents === "number" &&
            (t.maxCents === null || typeof t.maxCents === "number") &&
            typeof t.feeCents === "number" &&
            typeof t.expiryDays === "number"
        )
        .map((t) => ({
          ...t,
          minCents: Math.round(t.minCents),
          maxCents: t.maxCents === null ? null : Math.round(t.maxCents),
          feeCents: Math.round(t.feeCents),
          expiryDays: Math.round(t.expiryDays),
        }))
    : [];

  return {
    currency: "USD",
    tiers: tiers.length > 0 ? tiers : DEFAULT_LISTING_TIERS.tiers,
  };
}

export interface ListingPricing {
  tierLabel: string;
  baseFeeCents: number;
  feeCents: number;
  commissionBps: number | null;
  commissionAmountCents: number | null;
  totalFeeCents: number;
  expiryDays: number;
  expiresAt: Date;
  currency: string;
  appliedFeeRuleId: string | null;
  monetizationModel: MonetizationModel;
}

export interface CalculateListingPricingOptions {
  monetizationModel?: MonetizationModel;
  listingFeeRule?: FeeRuleInput;
  commissionRule?: FeeRuleInput;
  currency?: string;
}

export function calculateListingPricing(
  priceCents: number,
  config: ListingTiersConfig,
  options: CalculateListingPricingOptions = {},
  referenceDate: Date = new Date()
): ListingPricing {
  const {
    monetizationModel = "fixed_only",
    listingFeeRule,
    commissionRule,
    currency = config.currency,
  } = options;

  const tier =
    config.tiers.find((t) => {
      const aboveMin = priceCents >= t.minCents;
      const belowMax = t.maxCents === null || priceCents <= t.maxCents;
      return aboveMin && belowMax;
    }) ?? config.tiers[config.tiers.length - 1];

  const baseFeeCents = tier.feeCents;

  let feeCents = 0;
  let commissionBps: number | null = null;
  let commissionAmountCents: number | null = null;
  let appliedFeeRuleId: string | null = null;

  if (monetizationModel === "fixed_only" || monetizationModel === "hybrid") {
    if (listingFeeRule?.amount !== undefined) {
      feeCents = listingFeeRule.amount;
      appliedFeeRuleId = listingFeeRule.id ?? null;
    } else {
      feeCents = baseFeeCents;
    }
  }

  if (
    monetizationModel === "commission_only" ||
    monetizationModel === "hybrid"
  ) {
    commissionBps = commissionRule?.percentage ?? 0;
    commissionAmountCents = Math.round((priceCents * commissionBps) / 10_000);
    if (!appliedFeeRuleId && commissionRule?.id) {
      appliedFeeRuleId = commissionRule.id;
    }
  }

  const totalFeeCents = feeCents + (commissionAmountCents ?? 0);

  const expiresAt = new Date(referenceDate);
  expiresAt.setDate(expiresAt.getDate() + tier.expiryDays);

  return {
    tierLabel: tier.label,
    baseFeeCents,
    feeCents,
    commissionBps,
    commissionAmountCents,
    totalFeeCents,
    expiryDays: tier.expiryDays,
    expiresAt,
    currency,
    appliedFeeRuleId,
    monetizationModel,
  };
}
