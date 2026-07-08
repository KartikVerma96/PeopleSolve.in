"use client";

import { motion } from "framer-motion";
import { Clock, Lightbulb, Search, ShieldCheck, Sparkles, Star, Tag, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { LogoLoader } from "@/components/ui/logo-loader";
import { ICON_STROKE } from "@/lib/icon-style";
import { fetchTricks, type ApiTrick } from "@/lib/api";
import { EXAM_CATEGORIES } from "@/lib/exam-data";
import { cn } from "@/lib/utils";

const TOP_EXAMS = [
  "All", "SSC CGL", "SSC CHSL", "IBPS PO", "SBI Clerk", "RRB NTPC",
  "JEE Main", "JEE Advanced", "NEET UG", "UPSC CSE Prelims",
];

export default function TricksPage() {
  const [tricks, setTricks] = useState<ApiTrick[]>([]);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchTricks({
      exam: exam !== "All" ? exam : undefined,
      q: search.trim() || undefined,
    })
      .then((d) => setTricks(d.tricks))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [exam, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Zap className="size-6 text-primary" strokeWidth={ICON_STROKE} />
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Tricks & Shortcuts
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Top-rated exam shortcuts from helpers — the fastest approaches, not textbook methods.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={ICON_STROKE} />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search tricks... e.g. "successive discount", "remainder theorem"'
          className="h-11 rounded-xl pl-10 text-sm"
        />
      </div>

      {/* Exam filter pills */}
      <div className="flex flex-wrap gap-2">
        {TOP_EXAMS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setExam(e)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              exam === e
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground dark:bg-white/[0.06]",
            )}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16"><LogoLoader /></div>
      ) : tricks.length === 0 ? (
        <div className="py-16 text-center">
          <Lightbulb className="mx-auto size-10 text-muted-foreground/30" strokeWidth={ICON_STROKE} />
          <p className="mt-3 text-sm text-muted-foreground">
            No tricks found yet. Solve doubts and share your shortcuts — top-rated ones appear here!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tricks.map((trick) => (
            <TrickCard key={trick.id} trick={trick} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TrickCard({ trick }: { trick: ApiTrick }) {
  return (
    <Link
      href={`/doubt/${trick.doubt.id}`}
      className="block rounded-xl border border-border/80 bg-card/80 p-4 transition-colors hover:border-primary/30 dark:border-white/[0.08] dark:bg-card/40"
    >
      {/* Approach name + meta */}
      <div className="flex flex-wrap items-center gap-2">
        {trick.approachName && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <Lightbulb className="size-3" strokeWidth={ICON_STROKE} />
            {trick.approachName}
          </span>
        )}
        {trick.solveTime && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            <Clock className="size-3" strokeWidth={ICON_STROKE} />
            {trick.solveTime}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <Star className="size-3" strokeWidth={ICON_STROKE} fill="currentColor" />
          {trick.rating.toFixed(1)} ({trick.ratingCount})
        </span>
      </div>

      {/* One-liner trick */}
      {trick.oneLinerTrick && (
        <div className="mt-2 rounded-lg border border-primary/20 bg-primary/[0.05] px-3 py-2 dark:bg-primary/[0.04]">
          <p className="text-sm font-semibold text-foreground">{trick.oneLinerTrick}</p>
        </div>
      )}

      {/* Quick solution preview */}
      <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{trick.quickSolution}</p>

      {/* Footer: exam, subject, author */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground ring-1 ring-border dark:bg-white/[0.06] dark:ring-white/10">
          {trick.doubt.exam}
        </span>
        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary ring-1 ring-primary/20">
          {trick.doubt.subject}
        </span>
        <span className="flex items-center gap-0.5">
          by {trick.authorName ?? "Anonymous"}
          {trick.authorVerified && <ShieldCheck className="size-3 text-primary" strokeWidth={ICON_STROKE} />}
        </span>
        {trick.examTags && (
          <span className="flex items-center gap-0.5">
            <Tag className="size-3" strokeWidth={ICON_STROKE} />
            {trick.examTags}
          </span>
        )}
      </div>
    </Link>
  );
}
