"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteNotification, markNotificationRead } from "@/actions/notification-actions";
import { NOTIFICATION_TYPES } from "@/lib/notifications";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  announcementId: string | null;
  readAt: Date | null;
  createdAt: Date;
};

function typeLabel(type: string) {
  switch (type) {
    case NOTIFICATION_TYPES.ANNOUNCEMENT_PUBLISHED:
      return "New post";
    case NOTIFICATION_TYPES.ACK_REQUIRED:
      return "Ack required";
    case NOTIFICATION_TYPES.ACK_RECEIVED:
      return "Ack received";
    default:
      return type;
  }
}

export function NotificationRow({ notification }: { notification: NotificationItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const unread = !notification.readAt;

  const stamp = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    notification.createdAt,
  );

  const href = notification.announcementId
    ? `/dashboard/announcements/${notification.announcementId}`
    : null;

  async function markRead() {
    start(async () => {
      const res = await markNotificationRead({ notificationId: notification.id });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  async function remove() {
    start(async () => {
      const res = await deleteNotification({ notificationId: notification.id });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Notification removed");
      router.refresh();
    });
  }

  return (
    <Card
      className={`border-border/70 p-4 shadow-sm backdrop-blur ${unread ? "bg-primary/5 ring-1 ring-primary/15" : "bg-card/60"}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{notification.title}</p>
            {unread ? <Badge>New</Badge> : <Badge variant="secondary">Read</Badge>}
            <Badge variant="outline">{typeLabel(notification.type)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{notification.body}</p>
          <p className="text-xs text-muted-foreground">{stamp}</p>
          {href ? (
            <Link
              href={href}
              className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => {
                if (unread) void markRead();
              }}
            >
              View announcement →
            </Link>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {unread ? (
            <Button size="sm" variant="secondary" disabled={pending} onClick={markRead}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark read"}
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" disabled={pending} onClick={remove} aria-label="Delete notification">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
