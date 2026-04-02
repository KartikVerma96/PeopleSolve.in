"use client";

import { motion } from "framer-motion";
import { RotateCw, Search, X, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DoubtCard } from "@/components/feed/doubt-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ICON_STROKE } from "@/lib/icon-style";
import { fetchDoubts } from "@/lib/api";
import { initialsFromName } from "@/lib/initials";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDoubts } from "@/store/slices/doubtsSlice";
import { setSidebarSearch } from "@/store/slices/uiSlice";
import type { Doubt } from "@/store/types/doubt";
import { cn } from "@/lib/utils";

function filterDoubts(items: Doubt[], q: string): Doubt[] {
  const s = q.trim().toLowerCase();
  if (!s) return items;
  return items.filter(
    (d) =>
      d.title.toLowerCase().includes(s) ||
      d.preview.toLowerCase().includes(s) ||
      d.exam.toLowerCase().includes(s) ||
      d.subject.toLowerCase().includes(s) ||
      d.authorName.toLowerCase().includes(s),
  );
}

function typingInField(target: EventTarget | null): boolean {
  const t = target as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable;
}

/**
 * Dense, keyboard-friendly feed: j/k move highlight, Enter triggers Help on highlighted row.
 * Fetches from API on mount, receives live updates via Socket.io (through Redux).
 */
export function LiveFeed({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.doubts.items);
  const fetched = useAppSelector((s) => s.doubts.fetched);
  const search = useAppSelector((s) => s.ui.sidebarSearch);
  const online = useAppSelector((s) => s.onlineUsers);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDoubts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDoubts();
      dispatch(
        setDoubts(
          data.items.map((d) => ({
            id: d.id,
            authorId: d.authorId,
            authorName: d.authorName,
            authorInitials: initialsFromName(d.authorName),
            exam: d.exam,
            subject: d.subject,
            title: d.title,
            preview: d.preview,
            createdAt: d.createdAt,
            viewerCount: d.viewerCount,
            helperCount: d.helperCount,
            urgent: d.urgent,
            resolved: d.resolved,
          })),
        ),
      );
    } catch {
      // If API is down, keep existing items (seed data or persisted)
      if (items.length === 0) {
        setError("Could not load doubts. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  }, [dispatch, items.length]);

  useEffect(() => {
    if (!fetched) {
      loadDoubts();
    }
  }, [fetched, loadDoubts]);

  const filtered = useMemo(() => filterDoubts(items, search), [items, search]);

  const searchRef = useRef<HTMLInputElement>(null);

  // Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const focusedIndexRef = useRef(0);
  focusedIndexRef.current = focusedIndex;

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, filtered.length);
  }, [filtered.length]);

  useEffect(() => {
    setFocusedIndex((i) =>
      filtered.length === 0 ? 0 : Math.min(i, filtered.length - 1),
    );
  }, [filtered.length]);

  useEffect(() => {
    const el = cardRefs.current[focusedIndex];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typingInField(e.target)) return;
      if (filtered.length === 0) return;

      if (e.key === "j" || e.key === "J") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        if ((e.target as HTMLElement).closest("button")) return;
        if ((e.target as HTMLElement).closest("a")) return;
        const id = filtered[focusedIndexRef.current]?.id;
        if (id) {
          e.preventDefault();
          window.location.href = `/doubt/${id}`;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, filtered]);

  return (
    <section className={cn("space-y-4", className)}>
      {/* Search bar */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={ICON_STROKE}
        />
        <Input
          ref={searchRef}
          value={search}
          onChange={(e) => dispatch(setSidebarSearch(e.target.value))}
          placeholder="Search doubts, exams, topics…"
          className={cn(
            "h-11 rounded-xl border border-border/80 bg-card/80 pl-10 pr-20 text-sm shadow-sm placeholder:text-muted-foreground/70",
            "dark:border-white/10 dark:bg-white/[0.04]",
            "focus:border-primary/40 focus:ring-2 focus:ring-primary/15",
          )}
          aria-label="Search doubts"
        />
        <div className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5">
          {search.trim() ? (
            <button
              type="button"
              className="pointer-events-auto rounded-md p-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => dispatch(setSidebarSearch(""))}
              aria-label="Clear search"
            >
              <X className="size-3.5" strokeWidth={ICON_STROKE} />
            </button>
          ) : (
            <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block dark:border-white/10 dark:bg-white/5">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Live feed
            </h2>
            <Badge
              variant="secondary"
              className="border border-border bg-muted/80 font-normal text-muted-foreground dark:border-white/10 dark:bg-white/5"
            >
              <Zap
                className="mr-1 size-3 text-primary"
                strokeWidth={ICON_STROKE}
                aria-hidden
              />
              {filtered.length} active
            </Badge>
            {loading && (
              <RotateCw className="size-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {online.totalOnline.toLocaleString()} online ·{" "}
            {online.activeHelpers} helping now
            <span className="hidden sm:inline">
              {" "}
              ·{" "}
              <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px] dark:border-white/10 dark:bg-white/5">
                j
              </kbd>{" "}
              <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px] dark:border-white/10 dark:bg-white/5">
                k
              </kbd>{" "}
              move ·{" "}
              <kbd className="rounded border border-border bg-muted px-1 font-mono text-[10px] dark:border-white/10 dark:bg-white/5">
                Enter
              </kbd>{" "}
              help
            </span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={loadDoubts}
          disabled={loading}
        >
          <RotateCw className={cn("mr-1 size-3", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200/90">
          {error}
          <Button
            variant="link"
            size="sm"
            className="ml-2 text-amber-700 dark:text-amber-200"
            onClick={loadDoubts}
          >
            Retry
          </Button>
        </div>
      )}

      <motion.div
        layout
        role="list"
        aria-label="Live doubts"
        className="flex flex-col gap-2"
      >
        {filtered.map((doubt, index) => (
          <div key={doubt.id} role="listitem">
            <DoubtCard
              doubt={doubt}
              index={index}
              isFocused={index === focusedIndex}
              onHover={() => setFocusedIndex(index)}
              onFocusCard={() => setFocusedIndex(index)}
              cardRef={(el) => {
                cardRefs.current[index] = el;
              }}
            />
          </div>
        ))}
      </motion.div>

      {!loading && filtered.length === 0 && !error && (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center text-muted-foreground text-sm dark:border-white/15 dark:bg-white/[0.02]">
          No doubts match your search. Clear the sidebar search or try another
          keyword.
        </p>
      )}
    </section>
  );
}
