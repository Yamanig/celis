import { pgEnum } from "drizzle-orm/pg-core";

export const USER_ROLES = [
  "buyer",
  "seller",
  "admin",
  "listing_review_officer",
  "seller_verification_officer",
  "listing_review_and_verification_officer",
  "finance_officer",
  "support_officer",
  "auditor",
] as const;
export const userRoleEnum = pgEnum("user_role", USER_ROLES);

export const SELLER_TYPES = ["individual", "shop"] as const;
export const sellerTypeEnum = pgEnum("seller_type", SELLER_TYPES);

export const SUBSCRIPTION_STATUSES = [
  "active",
  "cancelled",
  "expired",
] as const;
export const subscriptionStatusEnum = pgEnum(
  "subscription_status",
  SUBSCRIPTION_STATUSES
);

export const ITEM_CONDITIONS = [
  "new_with_tags",
  "like_new",
  "good",
  "fair",
  "poor",
  "brand_new",
  "used",
  "refurbished",
  "local_used",
] as const;
export const itemConditionEnum = pgEnum("item_condition", ITEM_CONDITIONS);

export const DELIVERY_METHODS = [
  "shipping",
  "local_pickup",
  "both",
] as const;
export const deliveryMethodEnum = pgEnum("delivery_method", DELIVERY_METHODS);

export const LISTING_STATUSES = [
  "draft",
  "pending_review",
  "active",
  "inactive",
  "sold",
  "expired",
  "rejected",
  "suspended",
] as const;
export const listingStatusEnum = pgEnum("listing_status", LISTING_STATUSES);

export const MONETIZATION_TYPES = ["fixed_rate", "commission"] as const;
export const monetizationTypeEnum = pgEnum(
  "monetization_type",
  MONETIZATION_TYPES
);

export const MONETIZATION_STATUSES = [
  "pending_paid",
  "active",
  "waived",
] as const;
export const monetizationStatusEnum = pgEnum(
  "monetization_status",
  MONETIZATION_STATUSES
);

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
] as const;
export const orderStatusEnum = pgEnum("order_status", ORDER_STATUSES);

export const DELIVERY_CONFIRM_SOURCES = [
  "carrier",
  "buyer",
  "pin",
  "admin",
] as const;
export const deliveryConfirmSourceEnum = pgEnum(
  "delivery_confirm_source",
  DELIVERY_CONFIRM_SOURCES
);

export const TRANSACTION_TYPES = [
  "flat_fee",
  "payout",
  "shipping_charge",
  "refund",
] as const;
export const transactionTypeEnum = pgEnum(
  "transaction_type",
  TRANSACTION_TYPES
);

export const TRANSACTION_STATUSES = [
  "pending",
  "completed",
  "failed",
  "reversed",
] as const;
export const transactionStatusEnum = pgEnum(
  "transaction_status",
  TRANSACTION_STATUSES
);

export const PAYOUT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;
export const payoutStatusEnum = pgEnum("payout_status", PAYOUT_STATUSES);

export const PAYOUT_METHODS = ["bank_transfer", "wallet_transfer"] as const;
export const payoutMethodEnum = pgEnum("payout_method", PAYOUT_METHODS);

export const WALLET_PROVIDERS = ["evc", "premier", "edahab"] as const;
export const walletProviderEnum = pgEnum("wallet_provider", WALLET_PROVIDERS);

export const BANK_NAMES = [
  "salaam_somali",
  "dahabshiil",
  "amal",
  "premier",
  "trust",
] as const;
export const bankNameEnum = pgEnum("bank_name", BANK_NAMES);

export const BANK_ACCOUNT_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "active",
] as const;
export const bankAccountStatusEnum = pgEnum(
  "bank_account_status",
  BANK_ACCOUNT_STATUSES
);

export const CATEGORY_FEE_TYPES = [
  "listing_fee",
  "commission",
  "featured_fee",
] as const;
export const categoryFeeTypeEnum = pgEnum(
  "category_fee_type",
  CATEGORY_FEE_TYPES
);

export const VERIFICATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "suspended",
] as const;
export const verificationStatusEnum = pgEnum(
  "verification_status",
  VERIFICATION_STATUSES
);

export const DISPUTE_REASONS = [
  "not_received",
  "not_as_described",
  "other",
] as const;
export const disputeReasonEnum = pgEnum("dispute_reason", DISPUTE_REASONS);

export type UserRole = string;
export type SellerType = (typeof SELLER_TYPES)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type MonetizationType = (typeof MONETIZATION_TYPES)[number];
export type MonetizationStatus = (typeof MONETIZATION_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type DeliveryConfirmSource = (typeof DELIVERY_CONFIRM_SOURCES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];
export type WalletProvider = (typeof WALLET_PROVIDERS)[number];
export type BankName = (typeof BANK_NAMES)[number];
export type BankAccountStatus = (typeof BANK_ACCOUNT_STATUSES)[number];
export const INTERACTION_TYPES = ["show_contact", "request_callback"] as const;
export const interactionTypeEnum = pgEnum(
  "interaction_type",
  INTERACTION_TYPES
);

export const NOTIFICATION_STATUSES = ["unread", "read"] as const;
export const notificationStatusEnum = pgEnum(
  "notification_status",
  NOTIFICATION_STATUSES
);

export type DisputeReason = (typeof DISPUTE_REASONS)[number];
export type InteractionType = (typeof INTERACTION_TYPES)[number];
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];
