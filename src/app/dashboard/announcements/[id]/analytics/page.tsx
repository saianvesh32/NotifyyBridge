import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAuthor } from "@/lib/auth-guard";
import { getAnnouncementAnalytics } from "@/actions/announcement-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Props = { params: { id: string } };

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Announcement analytics" };
}

export default async function AnnouncementAnalyticsPage({ params }: Props) {
  const session = await requireAuthor();

  const ownership = await prisma.announcement.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true, title: true },
  });
  if (!ownership) notFound();
  if (ownership.authorId !== session.user.id) notFound();

  const result = await getAnnouncementAnalytics({ announcementId: params.id });
  if (!result.success || !result.data) notFound();

  const a = result.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="page-title">Analytics</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{a.title}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">Author-only</Badge>
          <Link
            href={`/dashboard/announcements/${params.id}`}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View post
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription>Total reads</CardDescription>
            <CardTitle className="text-3xl">{a.totalReads}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription>Acknowledgments</CardDescription>
            <CardTitle className="text-3xl">{a.totalAcknowledgments}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription>Pending (employees)</CardDescription>
            <CardTitle className="text-3xl">{a.pendingAcknowledgments}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription>Acknowledgment rate</CardDescription>
            <CardTitle className="text-3xl">
              {a.acknowledgmentPercent != null ? `${a.acknowledgmentPercent}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {a.employeeCount} active employees in directory.
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/50">
        <CardHeader>
          <CardTitle>Employees who have not acknowledged</CardTitle>
          <CardDescription>Only users with the EMPLOYEE role are counted toward pending totals.</CardDescription>
        </CardHeader>
        <CardContent>
          {a.pendingEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground">Everyone has acknowledged — or acknowledgment was not required.</p>
          ) : (
            <div className="rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {a.pendingEmployees.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name ?? u.email}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{u.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/50">
        <CardHeader>
          <CardTitle>Employees who have read</CardTitle>
          <CardDescription>When each employee opened the announcement detail page.</CardDescription>
        </CardHeader>
        <CardContent>
          {a.readEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employee reads recorded yet.</p>
          ) : (
            <div className="rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="text-right">Read at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {a.readEmployees.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name ?? u.email}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{u.email}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(u.readAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />
      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard/author" className="text-primary underline-offset-4 hover:underline">
          Back to author workspace
        </Link>
      </p>
    </div>
  );
}
