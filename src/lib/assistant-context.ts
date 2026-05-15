import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const BODY_SNIPPET_LEN = 400;

function snippet(body: string) {
  const t = body.trim();
  if (t.length <= BODY_SNIPPET_LEN) return t;
  return `${t.slice(0, BODY_SNIPPET_LEN)}…`;
}

export async function buildAssistantContext(userId: string, role: Role): Promise<string> {
  const published = await prisma.announcement.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take: 30,
    select: {
      id: true,
      title: true,
      category: true,
      pinned: true,
      requiresAcknowledgment: true,
      publishedAt: true,
      body: true,
      author: { select: { name: true, email: true } },
      reads: { where: { userId }, select: { readAt: true }, take: 1 },
      acknowledgments: { where: { userId }, select: { acknowledgedAt: true }, take: 1 },
    },
  });

  const lines: string[] = [
    `User role: ${role}`,
    "",
    "=== Published announcements (visible to all authenticated users) ===",
  ];

  if (published.length === 0) {
    lines.push("(none)");
  } else {
    for (const a of published) {
      const read = a.reads[0] ? "yes" : "no";
      const ack = a.requiresAcknowledgment ? (a.acknowledgments[0] ? "yes" : "no") : "n/a";
      lines.push(
        [
          `- [${a.id}] "${a.title}"`,
          `  category: ${a.category}, pinned: ${a.pinned}, requires_ack: ${a.requiresAcknowledgment}`,
          `  author: ${a.author.name ?? a.author.email}`,
          `  published: ${a.publishedAt?.toISOString() ?? "unknown"}`,
          `  user_has_read: ${read}, user_has_acknowledged: ${ack}`,
          `  excerpt: ${snippet(a.body)}`,
        ].join("\n"),
      );
    }
  }

  if (role === Role.AUTHOR) {
    const drafts = await prisma.announcement.findMany({
      where: { authorId: userId, status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        id: true,
        title: true,
        category: true,
        pinned: true,
        requiresAcknowledgment: true,
        updatedAt: true,
        body: true,
      },
    });

    lines.push("", "=== Your draft announcements (author only) ===");
    if (drafts.length === 0) {
      lines.push("(none)");
    } else {
      for (const d of drafts) {
        lines.push(
          [
            `- [${d.id}] "${d.title}" (DRAFT)`,
            `  category: ${d.category}, pinned: ${d.pinned}, requires_ack: ${d.requiresAcknowledgment}`,
            `  updated: ${d.updatedAt.toISOString()}`,
            `  excerpt: ${snippet(d.body)}`,
          ].join("\n"),
        );
      }
    }

    const stats = await prisma.announcement.groupBy({
      by: ["status"],
      where: { authorId: userId },
      _count: { id: true },
    });
    lines.push(
      "",
      "=== Your announcement counts ===",
      stats.map((s) => `${s.status}: ${s._count.id}`).join(", ") || "(none)",
    );
  }

  return lines.join("\n");
}
