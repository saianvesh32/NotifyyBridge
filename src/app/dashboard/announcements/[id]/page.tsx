import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-guard";
import { markAnnouncementRead } from "@/actions/announcement-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AnnouncementAcknowledgeButton } from "@/components/announcements/announcement-ack-button";
import { AnnouncementAuthorControls } from "@/components/announcements/announcement-author-controls";
import { AnnouncementPublishButton } from "@/components/announcements/announcement-publish-button";
import { CATEGORY_LABEL, STATUS_LABEL } from "@/lib/announcement-meta";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await prisma.announcement.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: row?.title ?? "Announcement" };
}

export default async function AnnouncementDetailPage({ params }: Props) {
  const session = await requireSession();

  const row = await prisma.announcement.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      acknowledgments: {
        where: { userId: session.user.id },
        select: { acknowledgedAt: true },
        take: 1,
      },
    },
  });

  if (!row) notFound();

  const isAuthor = row.authorId === session.user.id;
  if (row.status === "DRAFT" && !isAuthor) notFound();

  const readResult = await markAnnouncementRead({ announcementId: row.id });
  if (!readResult.success && process.env.NODE_ENV === "development") {
    console.warn("markAnnouncementRead:", readResult.error);
  }

  const hasAck = row.acknowledgments[0] != null;
  const showAck =
    row.status === "PUBLISHED" && row.requiresAcknowledgment && !hasAck;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{CATEGORY_LABEL[row.category]}</Badge>
            <Badge variant="secondary">{STATUS_LABEL[row.status]}</Badge>
            {row.pinned ? <Badge>Pinned</Badge> : null}
            {row.requiresAcknowledgment ? <Badge variant="default">Ack required</Badge> : null}
          </div>
          <h1 className="page-title text-balance">{row.title}</h1>
          <p className="text-sm text-muted-foreground">
            By {row.author.name ?? row.author.email}
            {row.publishedAt ? ` · ${new Date(row.publishedAt).toLocaleString()}` : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/announcements">Back to list</Link>
          </Button>
          {isAuthor && row.status === "DRAFT" ? (
            <>
              <AnnouncementPublishButton announcementId={row.id} />
              <Button variant="outline" asChild>
                <Link href={`/dashboard/announcements/${row.id}/edit`}>Edit draft</Link>
              </Button>
            </>
          ) : null}
          {isAuthor && row.status !== "DRAFT" ? (
            <Button variant="secondary" asChild>
              <Link href={`/dashboard/announcements/${row.id}/analytics`}>Analytics</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Separator />

      <article className="max-w-none">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{row.body}</div>
      </article>

      {showAck ? (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
          <p className="mb-3 text-sm font-medium">This post requires your acknowledgment.</p>
          <AnnouncementAcknowledgeButton announcementId={row.id} />
        </div>
      ) : null}

      {row.requiresAcknowledgment && row.status === "PUBLISHED" && hasAck ? (
        <p className="text-sm text-muted-foreground">
          Acknowledged on {new Date(row.acknowledgments[0]!.acknowledgedAt).toLocaleString()}.
        </p>
      ) : null}

      {isAuthor && session.user.role === Role.AUTHOR ? (
        <div className="rounded-xl border border-border/70 bg-card/40 p-4">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Author actions</p>
          <AnnouncementAuthorControls announcementId={row.id} status={row.status} />
        </div>
      ) : null}
    </div>
  );
}
