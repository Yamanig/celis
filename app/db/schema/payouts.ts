import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  uniqueIndex,
  index,
  text,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { orders } from "./orders";
import { payoutStatusEnum, payoutMethodEnum } from "./enums";
import { bankAccounts } from "./payments";

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id),
    bankAccountId: uuid("bank_account_id").references(
      () => bankAccounts.id
    ),
    bankTransferRef: varchar("bank_transfer_ref", { length: 100 }),
    amount: integer("amount").notNull(), // USD cents
    fee: integer("fee").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    status: payoutStatusEnum("status").notNull().default("pending"),
    transferMethod: payoutMethodEnum("transfer_method")
      .notNull()
      .default("bank_transfer"),
    destinationWallet: varchar("destination_wallet", { length: 20 }),
    destinationPhone: varchar("destination_phone", { length: 15 }),
    initiatedAt: timestamp("initiated_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxPayoutsUser: index("idx_payouts_user").on(table.userId, table.createdAt),
    idxPayoutsStatusMethod: index("idx_payouts_status_method").on(
      table.status,
      table.transferMethod,
      table.createdAt
    ),
  })
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    revieweeId: uuid("reviewee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idxReviewsOrderReviewerUnique: uniqueIndex(
      "idx_reviews_order_reviewer_unique"
    ).on(table.orderId, table.reviewerId),
    idxReviewsReviewee: index("idx_reviews_reviewee").on(
      table.revieweeId,
      table.createdAt
    ),
    idxReviewsReviewer: index("idx_reviews_reviewer").on(
      table.reviewerId,
      table.createdAt
    ),
  })
);
