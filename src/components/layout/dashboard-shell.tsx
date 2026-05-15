"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import {
  Bell,
  LayoutDashboard,
  Layers,
  LogOut,
  Megaphone,
  Menu,
  PenSquare,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/layout/mode-toggle";
import type { NavIconKey, NavItem } from "@/constants/navigation";

const NAV_ICONS: Record<NavIconKey, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  megaphone: Megaphone,
  "pen-square": PenSquare,
  "user-round": UserRound,
  bell: Bell,
  settings: Settings,
};

type ShellUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
};

function initials(name?: string | null, email?: string | null) {
  const base = name?.trim() || email?.trim() || "?";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function NavLinks({
  items,
  pathname,
  unreadNotificationCount,
}: {
  items: NavItem[];
  pathname: string;
  unreadNotificationCount: number;
}) {
  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const showBadge = item.href === "/dashboard/notifications" && unreadNotificationCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/25 font-semibold text-sidebar-foreground ring-1 ring-primary/50"
                : "text-sidebar-foreground/75 hover:bg-white/10 hover:text-sidebar-foreground",
            )}
          >
            <Icon
              className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-primary/80 group-hover:text-primary")}
            />
            <span className="flex-1 font-medium">{item.title}</span>
            {showBadge ? (
              <Badge className="h-5 min-w-5 justify-center px-1.5 text-[10px]" variant="default">
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  user,
  items,
  unreadNotificationCount = 0,
  children,
}: {
  user: ShellUser;
  items: NavItem[];
  unreadNotificationCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const title = "Internal portal";
  const subtitle = "Announcements, reads, and acknowledgments";

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold tracking-tight text-sidebar-foreground">Notify Bridge</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{title}</p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-sidebar-foreground/65">{subtitle}</p>
      </div>
      <Separator className="bg-sidebar-border" />
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks items={items} pathname={pathname} unreadNotificationCount={unreadNotificationCount} />
      </div>
      <div className="p-4">
        <div className="rounded-xl border border-sidebar-border bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-1 ring-white/10">
              {user.image ? <AvatarImage src={user.image} alt="" /> : null}
              <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name ?? "Member"}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-white/10 text-sidebar-foreground">
              {user.role}
            </Badge>
            <Button asChild size="sm" variant="outline" className="h-8 border-sidebar-border bg-transparent text-xs">
              <Link href="/dashboard">Home</Link>
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <ModeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background">
      <div className="lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="sticky top-0 hidden h-dvh border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
          {sidebar}
        </aside>
        <div className="min-h-dvh">
          <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/20">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-foreground">Notify Bridge</p>
                <p className="text-xs text-muted-foreground">{title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
                  {sidebar}
                </SheetContent>
              </Sheet>
            </div>
          </div>
          <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
