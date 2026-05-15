"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveAnnouncement, deleteAnnouncementDraft } from "@/actions/announcement-actions";
import { AnnouncementPublishButton } from "@/components/announcements/announcement-publish-button";

export function AnnouncementAuthorControls({
  announcementId,
  status,
}: {
  announcementId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (status === "ARCHIVED") {
    return <p className="text-sm text-muted-foreground">This announcement is archived.</p>;
  }

  if (status === "PUBLISHED") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => {
            start(async () => {
              const res = await archiveAnnouncement({ id: announcementId });
              if (!res.success) {
                toast.error(res.error);
                return;
              }
              toast.success("Archived");
              router.refresh();
            });
          }}
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Archive
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <AnnouncementPublishButton announcementId={announcementId} />
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Delete this draft permanently?")) return;
          start(async () => {
            const res = await deleteAnnouncementDraft({ id: announcementId });
            if (!res.success) {
              toast.error(res.error);
              return;
            }
            toast.success("Draft deleted");
            router.push("/dashboard/author");
            router.refresh();
          });
        }}
      >
        Delete draft
      </Button>
    </div>
  );
}
