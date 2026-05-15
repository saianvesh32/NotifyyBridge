import Link from "next/link";
import { AnnouncementStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthor } from "@/lib/auth-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CATEGORY_LABEL, STATUS_LABEL } from "@/lib/announcement-meta";
import { AnnouncementPublishButton } from "@/components/announcements/announcement-publish-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Author workspace",
};

export default async function AuthorWorkspacePage() {
  const session = await requireAuthor();

  const [drafts, published, archived] = await Promise.all([
    prisma.announcement.findMany({
      where: { authorId: session.user.id, status: AnnouncementStatus.DRAFT },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, category: true, updatedAt: true },
    }),
    prisma.announcement.findMany({
      where: { authorId: session.user.id, status: AnnouncementStatus.PUBLISHED },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      select: { id: true, title: true, category: true, pinned: true, publishedAt: true },
    }),
    prisma.announcement.findMany({
      where: { authorId: session.user.id, status: AnnouncementStatus.ARCHIVED },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, category: true, publishedAt: true },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="page-title">Author workspace</h1>
          <p className="page-subtitle max-w-2xl">
            Drafts stay private until you publish. Published content can only be archived — never silently edited.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/announcements/new">Create announcement</Link>
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Drafts</h2>
        <div className="rounded-xl border border-border/70 bg-card/40 shadow-sm backdrop-blur">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No drafts yet.
                  </TableCell>
                </TableRow>
              ) : (
                drafts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{CATEGORY_LABEL[d.category]}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {new Date(d.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <AnnouncementPublishButton announcementId={d.id} size="sm" />
                        <Button variant="link" asChild className="h-auto p-0">
                          <Link href={`/dashboard/announcements/${d.id}/edit`}>Edit</Link>
                        </Button>
                        <Button variant="link" asChild className="h-auto p-0">
                          <Link href={`/dashboard/announcements/${d.id}`}>Preview</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Published</h2>
        <div className="rounded-xl border border-border/70 bg-card/40 shadow-sm backdrop-blur">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {published.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Nothing published yet.
                  </TableCell>
                </TableRow>
              ) : (
                published.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{p.title}</span>
                        {p.pinned ? <Badge className="w-fit text-xs">Pinned</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{CATEGORY_LABEL[p.category]}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-3">
                        <Button variant="link" asChild className="h-auto p-0">
                          <Link href={`/dashboard/announcements/${p.id}`}>View</Link>
                        </Button>
                        <Button variant="link" asChild className="h-auto p-0">
                          <Link href={`/dashboard/announcements/${p.id}/analytics`}>Analytics</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Archived</h2>
        <div className="rounded-xl border border-border/70 bg-card/40 shadow-sm backdrop-blur">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Originally published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archived.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    No archived announcements.
                  </TableCell>
                </TableRow>
              ) : (
                archived.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{CATEGORY_LABEL[a.category]}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-3">
                        <Button variant="link" asChild className="h-auto p-0">
                          <Link href={`/dashboard/announcements/${a.id}`}>View</Link>
                        </Button>
                        <Button variant="link" asChild className="h-auto p-0">
                          <Link href={`/dashboard/announcements/${a.id}/analytics`}>Analytics</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
