"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { actionError, actionSuccess, type ActionResult } from "@/lib/errors";

const notificationIdSchema = z.object({
  notificationId: z.string().cuid(),
});

export async function markNotificationRead(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");

  const parsed = notificationIdSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid input");

  await prisma.notification.updateMany({
    where: { id: parsed.data.notificationId, userId: session.user.id },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  return actionSuccess();
}

export async function deleteNotification(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");

  const parsed = notificationIdSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid input");

  await prisma.notification.deleteMany({
    where: { id: parsed.data.notificationId, userId: session.user.id },
  });

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  return actionSuccess();
}
