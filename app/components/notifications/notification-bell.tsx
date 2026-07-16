"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationReadFn,
} from "~/server/notifications.functions";
import { formatRelativeDate } from "~/lib/format";
import type { NotificationItem } from "~/server/notifications.functions";

const PREVIEW_LIMIT = 8;

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const load = async () => {
    const [count, data] = await Promise.all([
      fetchUnreadNotificationCount(),
      fetchNotifications({ data: { page: 1, limit: PREVIEW_LIMIT, unreadOnly: false } }),
    ]);
    setUnreadCount(count);
    setNotifications(data.items);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = async (notification: NotificationItem) => {
    setOpen(false);
    if (notification.status === "unread") {
      await markNotificationReadFn({ data: { id: notification.id } });
      await load();
    }
    if (notification.link) {
      navigate({ to: notification.link as any });
    } else {
      navigate({ to: "/notifications" });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative h-12 w-12"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-celis-destructive px-1 text-[10px] font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-celis-primary-subtle px-2 py-0.5 text-xs text-celis-primary">
              {unreadCount} unread
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-celis-ink-secondary">
            No notifications yet.
          </div>
        ) : (
          <>
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex cursor-pointer flex-col items-start gap-1 px-3 py-2"
                onClick={() => handleClick(n)}
              >
                <div className="flex w-full items-start gap-2">
                  <span
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                      n.status === "unread"
                        ? "bg-celis-primary"
                        : "bg-celis-border"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-celis-ink-secondary">
                      {n.body}
                    </p>
                    <p className="mt-0.5 text-[10px] text-celis-ink-tertiary">
                      {formatRelativeDate(n.createdAt)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer justify-center text-celis-primary">
              <Link to="/notifications">View all notifications</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
