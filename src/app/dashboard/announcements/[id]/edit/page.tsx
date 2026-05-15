import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AnnouncementStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthor } from "@/lib/auth-guard";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { AnnouncementPublishButton } from "@/components/announcements/announcement-publish-button";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await prisma.announcement.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: row ? `Edit · ${row.title}` : "Edit announcement" };
}

export default async function EditAnnouncementPage({ params }: Props) {
  const session = await requireAuthor();

  const row = await prisma.announcement.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      pinned: true,
      requiresAcknowledgment: true,
      status: true,
      authorId: true,
    },
  });

  if (!row) notFound();
  if (row.authorId !== session.user.id) notFound();
  if (row.status !== AnnouncementStatus.DRAFT) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="page-title">Edit draft</h1>
          <p className="text-sm text-muted-foreground">
            Save changes, then publish when ready. Publishing locks title, body, category, pin, and acknowledgment settings.
          </p>
        </div>
        <AnnouncementPublishButton announcementId={row.id} />
      </div>
      <div className="max-w-3xl rounded-xl border border-border/70 bg-card/40 p-6 shadow-sm backdrop-blur">
        <AnnouncementForm
          announcementId={row.id}
          initial={{
            title: row.title,
            body: row.body,
            category: row.category,
            pinned: row.pinned,
            requiresAcknowledgment: row.requiresAcknowledgment,
          }}
        />
        <p className="mt-6 text-sm text-muted-foreground">
          <Link href={`/dashboard/announcements/${row.id}`} className="text-primary underline-offset-4 hover:underline">
            Preview detail
          </Link>
          {" · "}
          <Link href="/dashboard/author" className="text-primary underline-offset-4 hover:underline">
            Author workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
