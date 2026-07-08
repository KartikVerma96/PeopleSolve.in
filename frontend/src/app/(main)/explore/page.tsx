"use client";

import { motion } from "framer-motion";
import { Search, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LogoLoader } from "@/components/ui/logo-loader";
import { ICON_STROKE } from "@/lib/icon-style";
import { EXAM_CATEGORIES } from "@/lib/exam-data";
import { fetchDoubts, type ApiDoubt } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ExplorePage() {
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [doubts, setDoubts] = useState<ApiDoubt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchDoubts({
      exam: selectedExam ?? undefined,
      q: search.trim() || undefined,
    })
      .then((d) => setDoubts(d.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedExam, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Explore doubts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse by exam category or search for specific topics.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={ICON_STROKE} />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by topic, question, or keyword..."
          className="h-11 rounded-xl pl-10 text-sm"
        />
      </div>

      {/* Exam category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedExam(null)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            selectedExam === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground dark:bg-white/[0.06]",
          )}
        >
          All exams
        </button>
        {EXAM_CATEGORIES.flatMap((cat) =>
          cat.exams.slice(0, 2).map((exam) => (
            <button
              key={exam.name}
              type="button"
              onClick={() => setSelectedExam(exam.name)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                selectedExam === exam.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground dark:bg-white/[0.06]",
              )}
            >
              {exam.name}
            </button>
          )),
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16"><LogoLoader /></div>
      ) : doubts.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No doubts found. Try a different search or exam.
        </p>
      ) : (
        <div className="space-y-2">
          {doubts.map((doubt) => (
            <Link
              key={doubt.id}
              href={`/doubt/${doubt.id}`}
              className="block rounded-xl border border-border/80 bg-card/80 p-4 transition-colors hover:border-primary/30 dark:border-white/[0.07] dark:bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px]">{doubt.exam}</Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">{doubt.subject}</Badge>
                {doubt.urgent && (
                  <Badge variant="secondary" className="badge-urgent bg-amber-500/15 text-amber-700 text-[10px] dark:text-amber-300">
                    Urgent
                  </Badge>
                )}
                {doubt.resolved && (
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 text-[10px] dark:text-emerald-300">
                    Resolved
                  </Badge>
                )}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-foreground">{doubt.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{doubt.preview}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{doubt.authorName}</span>
                <span className="flex items-center gap-1">
                  <Zap className="size-3 text-primary" strokeWidth={ICON_STROKE} />
                  {doubt.helperCount} helping
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}
