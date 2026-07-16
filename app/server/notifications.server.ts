import { db } from "~/db";
import { notifications } from "~/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export type NotificationType =
  | "listing_approved"
  | "listing_rejected"
  | "listing_expiring_soon"
  | "order_received"
  | "payment_received"
  | "payout_completed"
  | "seller_verification_approved"
  | "seller_verification_rejected"
  | "seller_verification_suspended";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      metadata: input.metadata ?? null,
    })
    .returning();
  return notification;
}

export async function getNotificationsForUser(
  userId: string,
  options?: { page?: number; limit?: number; unreadOnly?: boolean }
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;

  const conditions = [eq(notifications.userId, userId)];
  if (options?.unreadOnly) {
    conditions.push(eq(notifications.status, "unread"));
  }

  const where = and(...conditions);

  const rows = await db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(notifications)
    .where(where);

  return {
    items: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUnreadNotificationCount(userId: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.status, "unread"))
    );
  return value;
}

export async function markNotificationRead(userId: string, id: string) {
  const [updated] = await db
    .update(notifications)
    .set({ status: "read", readAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(notifications.id, id), eq(notifications.userId, userId))
    )
    .returning();
  return updated;
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notifications)
    .set({ status: "read", readAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.status, "unread"))
    );
  return { success: true };
}
