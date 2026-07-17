import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notifications.server";

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  status: "unread" | "read";
  metadata: Record<string, string | number | boolean | null> | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapNotification(row: {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  status: "unread" | "read";
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): NotificationItem {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    status: row.status,
    metadata: (row.metadata as Record<string, string | number | boolean | null> | null) ?? null,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const notificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  unreadOnly: z.coerce.boolean().optional().default(false),
});

export const fetchNotifications = createServerFn({ method: "GET" })
  .validator(notificationsQuerySchema)
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    const result = await getNotificationsForUser(user.id, data);
    return {
      items: result.items.map(mapNotification),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  });

export const fetchUnreadNotificationCount = createServerFn({
  method: "GET",
}).handler(async () => {
  const { getCurrentUser } = await import("./auth.server");
  const user = await getCurrentUser();
  if (!user) return 0;
  return getUnreadNotificationCount(user.id);
});

const notificationIdSchema = z.object({ id: z.string().uuid() });

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .validator(notificationIdSchema)
  .handler(async ({ data }) => {
    const { getCurrentUser } = await import("./auth.server");
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    const row = await markNotificationRead(user.id, data.id);
    return row ? mapNotification(row) : null;
  });

export const markAllNotificationsReadFn = createServerFn({
  method: "POST",
}).handler(async () => {
  const { getCurrentUser } = await import("./auth.server");
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return markAllNotificationsRead(user.id);
});
