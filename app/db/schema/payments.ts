import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { orders } from "./orders";
import {
  walletProviderEnum,
  bankNameEnum,
  bankAccountStatusEnum,
} from "./enums";

export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bankName: bankNameEnum("bank_name").notNull(),
    accountHolderName: varchar("account_holder_name", { length: 120 }).notNull(),
    accountNumber: varchar("account_number", { length: 50 }).notNull(),
    branchCode: varchar("branch_code", { length: 20 }),
    isDefault: boolean("is_default").notNull().default(false),
    status: bankAccountStatusEnum("status").notNull().default("pending"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxBankAccountsUser: index("idx_bank_accounts_user").on(table.userId),
    idxBankAccountsDefault: index("idx_bank_accounts_default").on(
      table.userId,
      table.isDefault
    ),
  })
);

export const walletPayments = pgTable(
  "wallet_payments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id),
    listingId: uuid("listing_id"), // for fixed-rate listing fees
    walletProvider: walletProviderEnum("wallet_provider").notNull(),
    amount: integer("amount").notNull(), // USD cents
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    walletRef: varchar("wallet_ref", { length: 100 }),
    merchantRef: varchar("merchant_ref", { length: 100 }).notNull().unique(),
    customerPhone: varchar("customer_phone", { length: 15 }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    callbackPayload: jsonb("callback_payload"),
    callbackReceivedAt: timestamp("callback_received_at", { withTimezone: true }),
    retryCount: integer("retry_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxWalletPaymentsUser: index("idx_wallet_payments_user").on(
      table.userId,
      table.createdAt
    ),
    idxWalletPaymentsOrder: index("idx_wallet_payments_order").on(table.orderId),
    idxWalletPaymentsListing: index("idx_wallet_payments_listing").on(
      table.listingId
    ),
    idxWalletPaymentsMerchantRef: index("idx_wallet_payments_merchant_ref").on(
      table.merchantRef
    ),
    idxWalletPaymentsWalletRef: index("idx_wallet_payments_wallet_ref").on(
      table.walletRef
    ),
  })
);
