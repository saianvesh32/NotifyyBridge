import { Role } from "@prisma/client";
import { requireSession } from "@/lib/auth-guard";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AUTHOR_NAV_ITEM, USER_NAV } from "@/constants/navigation";
import { getUnreadNotificationCount } from "@/lib/notifications";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const unreadNotificationCount = await getUnreadNotificationCount(session.user.id);

  const items =
    session.user.role === Role.AUTHOR
      ? [...USER_NAV.slice(0, 2), AUTHOR_NAV_ITEM, ...USER_NAV.slice(2)]
      : USER_NAV;

  return (
    <DashboardShell user={session.user} items={items} unreadNotificationCount={unreadNotificationCount}>
      {children}
    </DashboardShell>
  );
}
