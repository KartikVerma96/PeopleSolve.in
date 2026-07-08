"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, Eye, Flame, HandHelping } from "lucide-react";
import Link from "next/link";

import { ShareButton } from "@/components/ui/share-button";
import { ICON_STROKE } from "@/lib/icon-style";
import { avatarBackgroundForKey } from "@/lib/avatar-hue";
import { formatRelativeShort } from "@/lib/format-time";
import type { Doubt } from "@/store/types/doubt";
import { cn } from "@/lib/utils";

export type DoubtCardProps = {
  doubt: Doubt;
  index: number;
  isFocused: boolean;
  onHover: () => void;
  onFocusCard: () => void;
  cardRef: (el: HTMLElement | null) => void;
};

/**
 * Dense row: metadata left, actions right, full row focusable.
 * Title + "Help Now" both navigate to /doubt/[id] detail page.
 */
export function DoubtCard({
  doubt,
  index,
  isFocused,
  onHover,
  onFocusCard,
  cardRef,
}: DoubtCardProps) {
  const bg = avatarBackgroundForKey(doubt.authorId + doubt.authorName);
  const resolved = (doubt as Doubt & { resolved?: boolean }).resolved ?? false;

  return (
    <motion.div
      ref={cardRef}
      layout
      role="article"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      tabIndex={0}
      data-doubt-card
      onMouseEnter={onHover}
      onFocus={onFocusCard}
      className={cn(
        "group relative grid gap-3 rounded-xl border border-border/90 bg-card/70 p-3 shadow-sm transition-[box-shadow,background-color,border-color] duration-200 md:grid-cols-[1fr_auto] md:items-start md:gap-4 md:p-3.5",
        "dark:border-white/[0.07] dark:bg-white/[0.03] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
        "outline-none hover:border-border focus-visible:ring-2 focus-visible:ring-primary/45 dark:hover:border-white/10",
        isFocused &&
          "border-primary/45 bg-primary/[0.09] ring-1 ring-primary/25 dark:border-primary/40 dark:bg-primary/[0.08] dark:ring-primary/30",
        doubt.urgent && !resolved && "border-amber-500/30 dark:border-amber-500/15",
        resolved && "opacity-75",
      )}
    >
      {doubt.urgent && !resolved && (
        <div
          className="badge-urgent absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-200/95 md:hidden"
          aria-label="Urgent"
        >
          <Flame className="size-3" strokeWidth={ICON_STROKE} />
          Urgent
        </div>
      )}

      <div className="flex min-w-0 gap-3 pr-14 md:pr-0">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg font-semibold text-[11px] text-white shadow-inner ring-1 ring-white/10"
          style={{ backgroundColor: bg }}
          aria-hidden
        >
          {doubt.authorInitials}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-[11px] text-foreground ring-1 ring-border dark:bg-white/[0.06] dark:text-foreground/90 dark:ring-white/10">
              {doubt.exam}
            </span>
            <span className="rounded-md bg-primary/12 px-1.5 py-0.5 font-medium text-[11px] text-green-800 ring-1 ring-primary/30 dark:bg-primary/15 dark:text-[#86efac] dark:ring-primary/25">
              {doubt.subject}
            </span>
            {doubt.urgent && !resolved && (
              <span className="badge-urgent hidden items-center gap-0.5 rounded-md bg-amber-500/15 px-1.5 py-0.5 font-bold text-[11px] text-amber-700 dark:text-amber-200/95 md:inline-flex">
                <Flame className="size-3" strokeWidth={ICON_STROKE} />
                Urgent
              </span>
            )}
            {resolved && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-medium text-[11px] text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-3" strokeWidth={ICON_STROKE} />
                Resolved
              </span>
            )}
            {doubt.needFasterMethod && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-500/10 px-1.5 py-0.5 font-medium text-[11px] text-blue-700 dark:text-blue-300">
                <Clock className="size-3" strokeWidth={ICON_STROKE} />
                Need faster method
                {doubt.mySolveTime && (
                  <span className="font-normal text-blue-600/60 dark:text-blue-400/60">
                    · {doubt.mySolveTime}
                  </span>
                )}
              </span>
            )}
          </div>
          <Link href={`/doubt/${doubt.id}`}>
            <h3 className="font-medium text-[15px] text-foreground leading-snug tracking-tight hover:text-primary transition-colors">
              {doubt.title}
            </h3>
          </Link>
          <p className="line-clamp-2 text-[13px] text-muted-foreground leading-relaxed">
            {doubt.preview}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="text-foreground/70">{doubt.authorName}</span>
            <span aria-hidden>·</span>
            <time dateTime={doubt.createdAt} title={doubt.createdAt}>
              {formatRelativeShort(doubt.createdAt)}
            </time>
            <span className="inline-flex items-center gap-1" title="Viewing now">
              <Eye className="size-3 opacity-70" strokeWidth={ICON_STROKE} />
              {doubt.viewerCount}
            </span>
            <span className="inline-flex items-center gap-1" title="Helpers active">
              <HandHelping className="size-3 opacity-70" strokeWidth={ICON_STROKE} />
              {doubt.helperCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 justify-end md:pt-0.5">
        <ShareButton
          title={doubt.title}
          text={`Help me with: ${doubt.title} (${doubt.exam} - ${doubt.subject})`}
          url={`/doubt/${doubt.id}`}
        />
        {resolved ? (
          <span className="inline-flex h-9 items-center rounded-lg bg-emerald-500/10 px-4 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mr-1.5 size-3.5" strokeWidth={ICON_STROKE} />
            Solved
          </span>
        ) : (
          <Link
            href={`/doubt/${doubt.id}`}
            className="btn-shiny inline-flex h-9 min-w-[7.5rem] items-center justify-center rounded-xl px-4 text-sm"
          >
            Help Now
          </Link>
        )}
      </div>
    </motion.div>
  );
}
