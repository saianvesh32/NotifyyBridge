"use server";

import { revalidatePath } from "next/cache";
import { AnnouncementStatus, Role } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";
import { announcementDraftUpsertSchema } from "@/lib/validations/announcement";
import {
  notifyAuthorOfAcknowledgment,
  notifyEmployeesOfPublishedAnnouncement,
} from "@/lib/notifications";

const idSchema = z.string().cuid();

async function getSessionOrError() {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: "Unauthorized" };
  if (session.user.isSuspended) return { ok: false as const, error: "Suspended" };
  return { ok: true as const, session };
}

export async function createAnnouncement(input: unknown): Promise<ActionResult<{ id: string }>> {
  const gate = await getSessionOrError();
  if (!gate.ok) return actionError(gate.error);
  if (gate.session.user.role !== Role.AUTHOR) return actionError("Forbidden");

  const parsed = announcementDraftUpsertSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.errors[0]?.message ?? "Invalid input");

  try {
    const row = await prisma.announcement.create({
      data: {
        title: parsed.data.title.trim(),
        body: parsed.data.body.trim(),
        category: parsed.data.category,
        pinned: parsed.data.pinned,
        requiresAcknowledgment: parsed.data.requiresAcknowledgment,
        status: AnnouncementStatus.DRAFT,
        authorId: gate.session.user.id,
      },
      select: { id: true },
    });
    revalidatePath("/dashboard/announcements");
    revalidatePath("/dashboard/author");
    return actionSuccess({ id: row.id });
  } catch (e) {
    console.error(e);
    return actionError("Could not create announcement");
  }
}

export async function updateAnnouncementDraft(input: unknown): Promise<ActionResult> {
  const gate = await getSessionOrError();
  if (!gate.ok) return actionError(gate.error);
  if (gate.session.user.role !== Role.AUTHOR) return actionError("Forbidden");

  const schema = z.object({
    id: idSchema,
    data: announcementDraftUpsertSchema,
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.errors[0]?.message ?? "Invalid input");

  try {
    const existing = await prisma.announcement.findUnique({
      where: { id: parsed.data.id },
      select: { authorId: true, status: true },
    });
    if (!existing) return actionError("Not found");
    if (existing.authorId !== gate.session.user.id) return actionError("Forbidden");
    if (existing.status !== AnnouncementStatus.DRAFT) return actionError("Only drafts can be edited");

    await prisma.announcement.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.data.title.trim(),
        body: parsed.data.data.body.trim(),
        category: parsed.data.data.category,
        pinned: parsed.data.data.pinned,
        requiresAcknowledgment: parsed.data.data.requiresAcknowledgment,
      },
    });
    revalidatePath("/dashboard/announcements");
    revalidatePath(`/dashboard/announcements/${parsed.data.id}`);
    revalidatePath("/dashboard/author");
    return actionSuccess();
  } catch (e) {
    console.error(e);
    return actionError("Could not update announcement");
  }
}

export async function deleteAnnouncementDraft(input: unknown): Promise<ActionResult> {
  const gate = await getSessionOrError();
  if (!gate.ok) return actionError(gate.error);
  if (gate.session.user.role !== Role.AUTHOR) return actionError("Forbidden");

  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return actionError("Invalid input");

  try {
    const existing = await prisma.announcement.findUnique({
      where: { id: parsed.data.id },
      select: { authorId: true, status: true },
    });
    if (!existing) return actionError("Not found");
    if (existing.authorId !== gate.session.user.id) return actionError("Forbidden");
    if (existing.status !== AnnouncementStatus.DRAFT) return actionError("Only drafts can be deleted");

    await prisma.announcement.delete({ where: { id: parsed.data.id } });
    revalidatePath("/dashboard/announcements");
    revalidatePath("/dashboard/author");
    return actionSuccess();
  } catch (e) {
    console.error(e);
    return actionError("Could not delete announcement");
  }
}

export async function publishAnnouncement(input: unknown): Promise<ActionResult> {
  const gate = await getSessionOrError();
  if (!gate.ok) return actionError(gate.error);
  if (gate.session.user.role !== Role.AUTHOR) return actionError("Forbidden");

  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return actionError("Invalid input");

  try {
    const existing = await prisma.announcement.findUnique({
      where: { id: parsed.data.id },
      select: {
        id: true,
        title: true,
        requiresAcknowledgment: true,
        authorId: true,
        status: true,
        publishedAt: true,
        author: { select: { name: true } },
      },
    });
    if (!existing) return actionError("Not found");
    if (existing.authorId !== gate.session.user.id) return actionError("Forbidden");
    if (existing.status !== AnnouncementStatus.DRAFT) return actionError("Only drafts can be published");

    await prisma.$transaction([
      prisma.announcement.update({
        where: { id: parsed.data.id },
        data: {
          status: AnnouncementStatus.PUBLISHED,
          publishedAt: existing.publishedAt ?? new Date(),
        },
      }),
    ]);

    await notifyEmployeesOfPublishedAnnouncement({
      id: existing.id,
      title: existing.title,
      requiresAcknowledgment: existing.requiresAcknowledgment,
      authorName: existing.author.name,
    });

    revalidatePath("/dashboard/announcements");
    revalidatePath(`/dashboard/announcements/${parsed.data.id}`);
    revalidatePath("/dashboard/author");
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard");
    return actionSuccess();
  } catch (e) {
    console.error(e);
    return actionError("Could not publish announcement");
  }
}

export async function archiveAnnouncement(input: unknown): Promise<ActionResult> {
  const gate = await getSessionOrError();
  if (!gate.ok) return actionError(gate.error);
  if (gate.session.user.role !== Role.AUTHOR) return actionError("Forbidden");

  const parsed = z.object({ id: idSchema }).safeParse(input);
  if (!parsed.success) return actionError("Invalid input");

  try {
    const existing = await prisma.announcement.findUnique({
      where: { id: parsed.data.id },
      select: { authorId: true, status: true },
    });
    if (!existing) return actionError("Not found");
    if (existing.authorId !== gate.session.user.id) return actionError("Forbidden");
    if (existing.status !== AnnouncementStatus.PUBLISHED) return actionError("Only published posts can be archived");

    await prisma.announcement.update({
      where: { id: parsed.data.id },
      data: { status: AnnouncementStatus.ARCHIVED },
    });
    revalidatePath("/dashboard/announcements");
    revalidatePath(`/dashboard/announcements/${parsed.data.id}`);
    revalidatePath("/dashboard/author");
    return actionSuccess();
  } catch (e) {
    console.error(e);
    return actionError("Could not archive announcement");
  }
}

export async function markAnnouncementRead(input: unknown): Promise<ActionResult> {
  const gate = await getSessionOrError();
  if (!gate.ok) return actionError(gate.error);

  const parsed = z.object({ announcementId: idSchema }).safeParse(input);
  if (!parsed.success) return actionError("Invalid input");

  try {
    const row = await prisma.announcement.findUnique({
      where: { id: parsed.data.announcementId },
      select: { id: true, status: true, authorId: true },
    });
    if (!row) return actionError("Not found");

    const isAuthor = row.authorId === gate.session.user.id;
    if (row.status === AnnouncementStatus.DRAFT && !isAuthor) return actionError("Forbidden");
    if (row.status === AnnouncementStatus.DRAFT) return actionSuccess();
    if (row.status !== AnnouncementStatus.PUBLISHED && row.status !== AnnouncementStatus.ARCHIVED) {
      return actionError("Forbidden");
    }

    await prisma.announcementRead.upsert({
      where: {
        userId_announcementId: {
          userId: gate.session.user.id,
          announcementId: row.id,
        },
      },
      create: {
        userId: gate.session.user.id,
        announcementId: row.id,
      },
      update: {},
    });
    revalidatePath("/dashboard/announcements");
    revalidatePath(`/dashboard/announcements/${row.id}`);
    revalidatePath("/dashboard");
    return actionSuccess();
  } catch (e) {
    console.error(e);
    return actionError("Could not record read");
  }
}

export async function acknowledgeAnnouncement(input: unknown): Promise<ActionResult> {
  const gate = await getSessionOrError();
  if (!gate.ok) return actionError(gate.error);

  const parsed = z.object({ announcementId: idSchema }).safeParse(input);
  if (!parsed.success) return actionError("Invalid input");

  try {
    const row = await prisma.announcement.findUnique({
      where: { id: parsed.data.announcementId },
      select: {
        id: true,
        title: true,
        status: true,
        requiresAcknowledgment: true,
        authorId: true,
      },
    });
    if (!row) return actionError("Not found");
    if (row.status !== AnnouncementStatus.PUBLISHED) return actionError("Acknowledgment is only available on published posts");
    if (!row.requiresAcknowledgment) return actionError("This post does not require acknowledgment");

    const prior = await prisma.announcementAcknowledgment.findUnique({
      where: {
        userId_announcementId: {
          userId: gate.session.user.id,
          announcementId: row.id,
        },
      },
    });

    await prisma.announcementAcknowledgment.upsert({
      where: {
        userId_announcementId: {
          userId: gate.session.user.id,
          announcementId: row.id,
        },
      },
      create: {
        userId: gate.session.user.id,
        announcementId: row.id,
      },
      update: {},
    });

    if (!prior && gate.session.user.id !== row.authorId) {
      await notifyAuthorOfAcknowledgment({
        id: row.id,
        title: row.title,
        authorId: row.authorId,
        employeeName: gate.session.user.name ?? null,
        employeeEmail: gate.session.user.email ?? "",
      });
    }

    revalidatePath("/dashboard/announcements");
    revalidatePath(`/dashboard/announcements/${row.id}`);
    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard");
    return actionSuccess();
  } catch (e) {
    console.error(e);
    return actionError("Could not acknowledge");
  }
}

export type AnnouncementAnalyticsDTO = {
  announcementId: string;
  title: string;
  totalReads: number;
  totalAcknowledgments: number;
  employeeCount: number;
  pendingAcknowledgments: number;
  acknowledgmentPercent: number | null;
  pendingEmployees: { id: string; name: string | null; email: string }[];
  readEmployees: { id: string; name: string | null; email: string; readAt: Date }[];
};

export async function getAnnouncementAnalytics(
  input: unknown,
): Promise<ActionResult<AnnouncementAnalyticsDTO>> {
  const gate = await getSessionOrError();
  if (!gate.ok) return actionError(gate.error);
  if (gate.session.user.role !== Role.AUTHOR) return actionError("Forbidden");

  const parsed = z.object({ announcementId: idSchema }).safeParse(input);
  if (!parsed.success) return actionError("Invalid input");

  const announcement = await prisma.announcement.findUnique({
    where: { id: parsed.data.announcementId },
    select: {
      id: true,
      title: true,
      authorId: true,
      requiresAcknowledgment: true,
    },
  });
  if (!announcement) return actionError("Not found");
  if (announcement.authorId !== gate.session.user.id) return actionError("Forbidden");

  const [totalReads, totalAcknowledgments, employees, ackUserIds, employeeAckCount, reads] =
    await prisma.$transaction([
      prisma.announcementRead.count({ where: { announcementId: announcement.id } }),
      prisma.announcementAcknowledgment.count({ where: { announcementId: announcement.id } }),
      prisma.user.findMany({
        where: { role: Role.EMPLOYEE, isSuspended: false },
        select: { id: true, name: true, email: true },
      }),
      prisma.announcementAcknowledgment.findMany({
        where: { announcementId: announcement.id },
        select: { userId: true },
      }),
      prisma.announcementAcknowledgment.count({
        where: {
          announcementId: announcement.id,
          user: { role: Role.EMPLOYEE },
        },
      }),
      prisma.announcementRead.findMany({
        where: {
          announcementId: announcement.id,
          user: { role: Role.EMPLOYEE },
        },
        orderBy: { readAt: "desc" },
        select: {
          readAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

  const ackSet = new Set(ackUserIds.map((a) => a.userId));
  const pendingEmployees = employees.filter((u) => !ackSet.has(u.id));
  const employeeCount = employees.length;
  const pendingAcknowledgments = announcement.requiresAcknowledgment ? pendingEmployees.length : 0;
  const acknowledgmentPercent =
    announcement.requiresAcknowledgment && employeeCount > 0
      ? Math.round((employeeAckCount / employeeCount) * 1000) / 10
      : null;

  const readEmployees = reads.map((r) => ({
    id: r.user.id,
    name: r.user.name,
    email: r.user.email,
    readAt: r.readAt,
  }));

  return actionSuccess({
    announcementId: announcement.id,
    title: announcement.title,
    totalReads,
    totalAcknowledgments,
    employeeCount,
    pendingAcknowledgments,
    acknowledgmentPercent,
    pendingEmployees,
    readEmployees,
  });
}
