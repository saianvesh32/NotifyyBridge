"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { markAllNotificationsRead } from "@/actions/notification-actions";
import { Button } from "@/components/ui/button";

export function NotificationsToolbar({
  unreadCount,
  totalCount,
}: {
  unreadCount: number;
  totalCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") === "unread" ? "unread" : "all";
  const [pending, start] = useTransition();

  function setFilter(next: "all" | "unread") {
    const sp = new URLSearchParams(searchParams.toString());
    if (next === "unread") sp.set("filter", "unread");
    else sp.delete("filter");
    const qs = sp.toString();
    router.replace(qs ? `/dashboard/notifications?${qs}` : "/dashboard/notifications");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          All ({totalCount})
        </Button>
        <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
          Unread ({unreadCount})
        </Button>
      </div>
      {unreadCount > 0 ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            start(async () => {
              const res = await markAllNotificationsRead();
              if (!res.success) {
                toast.error(res.error);
                return;
              }
              toast.success("All notifications marked as read");
              router.refresh();
            });
          }}
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Mark all as read
        </Button>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/announcements">Browse announcements</Link>
        </Button>
      )}
    </div>
  );
}
