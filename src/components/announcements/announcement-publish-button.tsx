"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { publishAnnouncement } from "@/actions/announcement-actions";

export function AnnouncementPublishButton({
  announcementId,
  size = "default",
  variant = "default",
  className,
  label = "Publish",
}: {
  announcementId: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "outline";
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      disabled={pending}
      onClick={() => {
        start(async () => {
          const res = await publishAnnouncement({ id: announcementId });
          if (!res.success) {
            toast.error(res.error);
            return;
          }
          toast.success("Published — employees can now see this announcement");
          router.push(`/dashboard/announcements/${announcementId}`);
          router.refresh();
        });
      }}
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}
