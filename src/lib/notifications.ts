import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const NOTIFICATION_TYPES = {
  ANNOUNCEMENT_PUBLISHED: "announcement_published",
  ACK_REQUIRED: "ack_required",
  ACK_RECEIVED: "ack_received",
  WELCOME: "welcome",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export async function notifyEmployeesOfPublishedAnnouncement(announcement: {
  id: string;
  title: string;
  requiresAcknowledgment: boolean;
  authorName: string | null;
}) {
  const employees = await prisma.user.findMany({
    where: { role: Role.EMPLOYEE, isSuspended: false },
    select: { id: true },
  });

  if (employees.length === 0) return;

  const ackNote = announcement.requiresAcknowledgment
    ? " Your acknowledgment is required."
    : "";

  await prisma.notification.createMany({
    data: employees.map((e) => ({
      userId: e.id,
      announcementId: announcement.id,
      type: announcement.requiresAcknowledgment
        ? NOTIFICATION_TYPES.ACK_REQUIRED
        : NOTIFICATION_TYPES.ANNOUNCEMENT_PUBLISHED,
      title: announcement.requiresAcknowledgment
        ? "Acknowledgment required"
        : "New announcement",
      body: `${announcement.authorName ?? "An author"} published "${announcement.title}".${ackNote}`,
    })),
  });
}

export async function notifyAuthorOfAcknowledgment(announcement: {
  id: string;
  title: string;
  authorId: string;
  employeeName: string | null;
  employeeEmail: string;
}) {
  await prisma.notification.create({
    data: {
      userId: announcement.authorId,
      announcementId: announcement.id,
      type: NOTIFICATION_TYPES.ACK_RECEIVED,
      title: "Acknowledgment received",
      body: `${announcement.employeeName ?? announcement.employeeEmail} acknowledged "${announcement.title}".`,
    },
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}
