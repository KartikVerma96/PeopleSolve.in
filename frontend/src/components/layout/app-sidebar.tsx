"use client";

import { motion } from "framer-motion";
import {
  Crown,
  Filter,
  MessageCircle,
  PanelLeftClose,
  PanelLeft,
  PenSquare,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ICON_STROKE } from "@/lib/icon-style";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUnread } from "@/store/slices/notificationsSlice";
import { toggleSidebarCollapsed } from "@/store/slices/uiSlice";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Live feed",
    icon: Zap,
    hint: "Real-time doubts from peers",
  },
  {
    href: "/post",
    label: "Post doubt",
    icon: PenSquare,
    hint: "Text, image, or voice",
  },
  {
    href: "/messages",
    label: "Messages",
    icon: MessageCircle,
    hint: "1:1 and group threads",
  },
  {
    href: "/profile",
    label: "Profile & karma",
    icon: Crown,
    hint: "Reputation & history",
  },
] as const;

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0 },
};

type AppSidebarProps = {
  className?: string;
  /** When rendered inside mobile Sheet, always show expanded. */
  forceExpanded?: boolean;
};

/**
 * Raycast-style rail: glass surface, thin icons, semantic Lucide metaphors for exam help.
 */
export function AppSidebar({ className, forceExpanded }: AppSidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const rawCollapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const collapsed = forceExpanded ? false : rawCollapsed;
  const unreadThreads = useAppSelector((s) => s.notifications.unreadThreads);
  const { data: session, status } = useSession();

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-sidebar-border border-r bg-sidebar/90 shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.04)] backdrop-blur-2xl dark:bg-sidebar/85 dark:shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.04)]",
        collapsed ? "w-[72px]" : "w-[260px]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3 pt-4 pb-3",
          collapsed && "flex-col px-2",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {collapsed ? (
            <span className="flex size-9 shrink-0 items-center justify-center font-extrabold text-[15px] text-[#32cd32] select-none">
              P<span className="text-[#ff4444]">.</span>
            </span>
          ) : (
            <div className="min-w-0">
              <Logo size="md" />
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="inline-block size-1.5 animate-pulse rounded-full bg-[#32cd32] shadow-[0_0_10px_rgba(50,205,50,0.85)]"
                  aria-hidden
                />
                Live · peer-to-peer
              </p>
            </div>
          )}
        </div>
        {!forceExpanded && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => dispatch(toggleSidebarCollapsed())}
          >
            {collapsed ? (
              <PanelLeft className="size-4" strokeWidth={ICON_STROKE} />
            ) : (
              <PanelLeftClose className="size-4" strokeWidth={ICON_STROKE} />
            )}
          </Button>
        )}
      </div>

      <Separator className="bg-sidebar-border/90" />

      <ScrollArea className="min-h-0 flex-1 px-2 py-3">
        <motion.nav
          className="flex flex-col gap-0.5"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          <p
            className={cn(
              "px-2.5 pb-2 font-medium text-[11px] text-muted-foreground/90 uppercase tracking-[0.12em]",
              collapsed && "sr-only",
            )}
          >
            Navigate
          </p>
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <motion.div key={item.href} variants={itemVariants} className="relative">
                {/* Animated background pill that slides between active items */}
                {active && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className={cn(
                      "absolute inset-0 rounded-xl",
                      /* Light mode: solid branded green */
                      "bg-[#32cd32]",
                      /* Dark mode: deeper green with inner glow */
                      "dark:bg-gradient-to-r dark:from-[#1a8a1a] dark:to-[#28b928]",
                      /* Shadow: soft green glow beneath */
                      "shadow-[0_4px_16px_-4px_rgba(50,205,50,0.4)]",
                      "dark:shadow-[0_4px_20px_-4px_rgba(50,205,50,0.5)]",
                    )}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? `${item.label} — ${item.hint}` : undefined}
                  onClick={() => {
                    if (item.href === "/messages") dispatch(clearUnread());
                  }}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm transition-all duration-200",
                    active && [
                      "text-white",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                    ],
                    !active &&
                      "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <span className="relative z-[1]">
                    <Icon
                      strokeWidth={ICON_STROKE}
                      className={cn(
                        "size-[18px] shrink-0 transition-colors duration-200",
                        active
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {/* Notification dot badge (collapsed mode) */}
                    {item.href === "/messages" && unreadThreads > 0 && !active && collapsed && (
                      <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#ff4444] text-[9px] font-bold text-white shadow-sm">
                        {unreadThreads > 9 ? "9+" : unreadThreads}
                      </span>
                    )}
                  </span>
                  {!collapsed && (
                    <span
                      className={cn(
                        "relative z-[1] flex-1 truncate tracking-tight",
                        active ? "font-semibold" : "font-medium",
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                  {/* Inline badge when expanded */}
                  {!collapsed && item.href === "/messages" && unreadThreads > 0 && !active && (
                    <span className="relative z-[1] flex size-5 items-center justify-center rounded-full bg-[#ff4444] text-[10px] font-bold text-white">
                      {unreadThreads > 9 ? "9+" : unreadThreads}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>

        <Separator className="my-4 bg-sidebar-border/80" />

        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-0.5"
        >
          <p
            className={cn(
              "px-2.5 pb-2 font-medium text-[11px] text-muted-foreground/90 uppercase tracking-[0.12em]",
              collapsed && "sr-only",
            )}
          >
            Soon
          </p>
          <motion.div variants={itemVariants}>
            <Link
              href="/"
              title={collapsed ? "Exam & syllabus filters" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-muted-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-muted-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <Filter
                className="size-[18px] shrink-0"
                strokeWidth={ICON_STROKE}
              />
              {!collapsed && (
                <span className="truncate font-medium tracking-tight">
                  Exam filters
                </span>
              )}
            </Link>
          </motion.div>
        </motion.div>
      </ScrollArea>

      <div className="mt-auto border-sidebar-border border-t p-3">
        {!collapsed && (
          <div className="mb-3 rounded-xl border border-border/80 bg-gradient-to-b from-muted/60 to-transparent p-3 text-[12px] shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:from-white/[0.06] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <p className="font-medium text-foreground">Always free</p>
            <p className="mt-0.5 text-muted-foreground leading-snug">
              No subscriptions. Built for serious exam prep.
            </p>
          </div>
        )}
        <div className={cn("flex flex-col gap-2", collapsed && "items-center")}>
          {status === "authenticated" && session?.user && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl bg-sidebar-accent/60 px-2 py-2 text-[12px] ring-1 ring-white/5",
                collapsed && "justify-center p-2",
              )}
            >
              <span className="relative flex size-8 items-center justify-center rounded-full bg-white/10 font-medium text-[11px] text-foreground">
                {(session.user.name ?? "?").slice(0, 2).toUpperCase()}
                {!session.user.isGuest && (
                  <span
                    className="absolute right-0 bottom-0 size-2 rounded-full border-2 border-sidebar bg-[#32cd32] shadow-[0_0_6px_rgba(50,205,50,0.9)]"
                    title="Online"
                  />
                )}
              </span>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {session.user.name ?? "User"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {session.user.isGuest
                      ? "Guest session"
                      : `Karma ${session.user.karma ?? 0}`}
                  </p>
                </div>
              )}
            </div>
          )}
          {status === "authenticated" && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-center rounded-lg text-muted-foreground text-xs hover:text-foreground",
                collapsed && "size-9 p-0",
              )}
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              {collapsed ? "×" : "Sign out"}
            </Button>
          )}
          {status !== "authenticated" && (
            <div className="flex w-full flex-col gap-2">
              <Link
                href="/login"
                title="Sign in or continue as guest"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full justify-center rounded-xl font-medium shadow-[0_0_20px_-8px_rgba(50,205,50,0.45)]",
                  collapsed && "size-9 p-0",
                )}
              >
                {collapsed ? "→" : "Sign in"}
              </Link>
              <Button
                className={cn(
                  "w-full rounded-xl font-medium",
                  collapsed && "size-9 p-0",
                )}
                onClick={() => signIn("guest")}
                variant="outline"
                title="Continue as guest"
              >
                {collapsed ? "G" : "Continue as guest"}
              </Button>
              {!collapsed && (
                <Link
                  href="/register"
                  className="text-center text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Create account
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
