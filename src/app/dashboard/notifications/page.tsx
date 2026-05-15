import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationRow } from "@/components/dashboard/notification-row";
import { NotificationsToolbar } from "@/components/dashboard/notifications-toolbar";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Notifications",
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function NotificationsPage({ searchParams }: Props) {
  const session = await requireSession();
  const unreadOnly = searchParams.filter === "unread";

  const [notifications, unreadCount, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        body: true,
        type: true,
        announcementId: true,
        readAt: true,
        createdAt: true,
      },
    }),
    getUnreadNotificationCount(session.user.id),
    prisma.notification.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="page-title">Notifications</h1>
        <p className="page-subtitle">
          Alerts when announcements are published, when acknowledgment is required, and when employees acknowledge your
          posts.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full max-w-xl" />}>
        <NotificationsToolbar unreadCount={unreadCount} totalCount={totalCount} />
      </Suspense>

      {notifications.length === 0 ? (
        <Card className="border-dashed border-border/70 bg-card/40">
          <CardHeader>
            <CardTitle>{unreadOnly ? "No unread notifications" : "You are all caught up"}</CardTitle>
            <CardDescription>
              {unreadOnly
                ? "Switch to All to see older notifications."
                : "New alerts appear when authors publish announcements or when you receive acknowledgments."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/dashboard/announcements">View announcements</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} />
          ))}
        </div>
      )}
    </div>
  );
}
