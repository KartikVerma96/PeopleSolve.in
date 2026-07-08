"use client";

import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Lightbulb,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ICON_STROKE } from "@/lib/icon-style";
import { avatarBackgroundForKey } from "@/lib/avatar-hue";
import { formatRelativeShort } from "@/lib/format-time";
import { initialsFromName } from "@/lib/initials";
import {
  fetchAnswers,
  postAnswer,
  voteAnswer,
  rateAnswer,
  type ApiAnswer,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type AnswerSectionProps = {
  doubtId: string;
  doubtAuthorId: string;
};

export function AnswerSection({ doubtId, doubtAuthorId }: AnswerSectionProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [answers, setAnswers] = useState<ApiAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [approachName, setApproachName] = useState("");
  const [oneLinerTrick, setOneLinerTrick] = useState("");
  const [quickSolution, setQuickSolution] = useState("");
  const [detailedExplanation, setDetailedExplanation] = useState("");
  const [solveTime, setSolveTime] = useState("");
  const [examTags, setExamTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAnswers = useCallback(async () => {
    try {
      const data = await fetchAnswers(doubtId, userId);
      // Sort: best rated first, then by net votes
      const sorted = [...data.answers].sort((a, b) => {
        const ra = a.rating ?? 0;
        const rb = b.rating ?? 0;
        if (rb !== ra) return rb - ra;
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      });
      setAnswers(sorted);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [doubtId, userId]);

  useEffect(() => { loadAnswers(); }, [loadAnswers]);

  const handleSubmit = async () => {
    if (!userId || !quickSolution.trim() || submitting) return;
    setSubmitting(true);
    try {
      const answer = await postAnswer({
        doubtId,
        authorId: userId,
        approachName: approachName.trim() || undefined,
        oneLinerTrick: oneLinerTrick.trim() || undefined,
        quickSolution: quickSolution.trim(),
        detailedExplanation: detailedExplanation.trim() || undefined,
        solveTime: solveTime.trim() || undefined,
        examTags: examTags.trim() || undefined,
      });
      setAnswers((prev) => [answer, ...prev]);
      // Reset form
      setApproachName("");
      setOneLinerTrick("");
      setQuickSolution("");
      setDetailedExplanation("");
      setSolveTime("");
      setExamTags("");
      setShowForm(false);
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  const handleVote = async (answerId: string, value: number) => {
    if (!userId) return;
    try {
      const result = await voteAnswer(answerId, userId, value);
      setAnswers((prev) =>
        prev.map((a) => a.id === answerId ? { ...a, ...result } : a),
      );
    } catch { /* silent */ }
  };

  const handleRate = async (answerId: string, rating: number) => {
    if (!userId) return;
    try {
      const result = await rateAnswer(answerId, userId, rating);
      setAnswers((prev) =>
        prev.map((a) => a.id === answerId ? { ...a, rating: result.rating, ratingCount: result.count } : a),
      );
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-5 text-primary" strokeWidth={ICON_STROKE} />
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Solutions
            {answers.length > 0 && (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                ({answers.length})
              </span>
            )}
          </h2>
        </div>
        {userId && !showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-1.5 rounded-lg"
          >
            <Lightbulb className="size-3.5" strokeWidth={ICON_STROKE} />
            Share your approach
          </Button>
        )}
      </div>

      {/* Guideline banner */}
      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-xs text-muted-foreground dark:bg-primary/[0.03]">
          <p className="font-medium text-foreground">
            <Zap className="mr-1 inline size-3 text-primary" strokeWidth={ICON_STROKE} />
            This is for competitive exams — share the fastest approach, not the textbook method.
          </p>
          <p className="mt-1">
            Mention the trick/shortcut name if it has one. Think: &quot;How would a topper solve this in 30 seconds?&quot;
          </p>
        </div>
      )}

      {/* Answer form */}
      {showForm && userId && (
        <div className="space-y-3 rounded-xl border border-border/80 bg-card/80 p-4 dark:border-white/[0.08] dark:bg-card/40">
          {/* Approach name + solve time — inline */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Approach / Trick name
              </label>
              <Input
                value={approachName}
                onChange={(e) => setApproachName(e.target.value.slice(0, 100))}
                placeholder='e.g. "Successive discount formula"'
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Solve time with this trick
              </label>
              <Input
                value={solveTime}
                onChange={(e) => setSolveTime(e.target.value.slice(0, 20))}
                placeholder='e.g. "~20 sec"'
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* One-liner trick */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              One-liner shortcut <span className="text-muted-foreground/60">(the actual trick in 1 line)</span>
            </label>
            <Input
              value={oneLinerTrick}
              onChange={(e) => setOneLinerTrick(e.target.value.slice(0, 300))}
              placeholder='e.g. "a + b - (a×b)/100 for two successive discounts"'
              className="h-9 text-sm"
            />
          </div>

          {/* Quick solution — required */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-foreground">
              Quick solution <span className="text-destructive">*</span>
              <span className="ml-1 font-normal text-muted-foreground/60">(apply the trick to this question)</span>
            </label>
            <Textarea
              value={quickSolution}
              onChange={(e) => setQuickSolution(e.target.value)}
              placeholder="Show the shortcut applied step by step (2-3 lines)..."
              className="min-h-20 rounded-lg text-sm"
            />
          </div>

          {/* Detailed explanation — collapsible */}
          <details className="group">
            <summary className="cursor-pointer text-[11px] font-medium text-muted-foreground hover:text-foreground">
              + Add detailed explanation <span className="font-normal">(optional — for students who want to understand why)</span>
            </summary>
            <Textarea
              value={detailedExplanation}
              onChange={(e) => setDetailedExplanation(e.target.value)}
              placeholder="Explain WHY the trick works, derivation, edge cases..."
              className="mt-2 min-h-20 rounded-lg text-sm"
            />
          </details>

          {/* Exam tags */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Exam relevance <span className="text-muted-foreground/60">(where is this asked?)</span>
            </label>
            <Input
              value={examTags}
              onChange={(e) => setExamTags(e.target.value.slice(0, 300))}
              placeholder='e.g. "SSC CGL 2023, IBPS PO Prelims, RRB NTPC"'
              className="h-9 text-sm"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!quickSolution.trim() || submitting}
              className="gap-1.5 rounded-lg"
            >
              <Send className="size-3.5" strokeWidth={ICON_STROKE} />
              {submitting ? "Posting..." : "Post solution"}
            </Button>
          </div>
        </div>
      )}

      {!userId && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            {" "}to share your approach.
          </p>
        </div>
      )}

      {/* Answers list */}
      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading solutions...</p>
      ) : answers.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No solutions yet. Be the first to share your approach!
        </p>
      ) : (
        <div className="space-y-4">
          {answers.map((answer, i) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              rank={i + 1}
              isDoubtAuthor={userId === doubtAuthorId}
              currentUserId={userId}
              onVote={handleVote}
              onRate={handleRate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerCard({
  answer, rank, isDoubtAuthor, currentUserId, onVote, onRate,
}: {
  answer: ApiAnswer;
  rank: number;
  isDoubtAuthor: boolean;
  currentUserId: string | undefined;
  onVote: (id: string, value: number) => void;
  onRate: (id: string, rating: number) => void;
}) {
  const [showDetailed, setShowDetailed] = useState(false);
  const bg = avatarBackgroundForKey(answer.authorId + (answer.authorName ?? ""));
  const initials = initialsFromName(answer.authorName ?? "A");
  const isBestRated = rank === 1 && (answer.rating ?? 0) >= 4;
  const netVotes = answer.upvotes - answer.downvotes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-4",
        isBestRated
          ? "border-primary/30 bg-primary/[0.04] dark:border-primary/20 dark:bg-primary/[0.03]"
          : "border-border/80 bg-card/80 dark:border-white/[0.08] dark:bg-card/40",
      )}
    >
      {/* Best rated badge */}
      {isBestRated && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Star className="size-3" strokeWidth={ICON_STROKE} fill="currentColor" />
          Best approach
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Vote column — horizontal on mobile, vertical on desktop */}
        <div className="flex items-center gap-1 sm:flex-col sm:items-center sm:gap-0.5">
          <button
            type="button"
            onClick={() => onVote(answer.id, answer.userVote === 1 ? 0 : 1)}
            disabled={!currentUserId || answer.authorId === currentUserId}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg transition-colors sm:size-8",
              answer.userVote === 1 ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              (!currentUserId || answer.authorId === currentUserId) && "opacity-40",
            )}
          >
            <ChevronUp className="size-5" strokeWidth={2.5} />
          </button>
          <span className={cn(
            "text-sm font-bold tabular-nums",
            netVotes > 0 ? "text-primary" : netVotes < 0 ? "text-destructive" : "text-muted-foreground",
          )}>
            {netVotes}
          </span>
          <button
            type="button"
            onClick={() => onVote(answer.id, answer.userVote === -1 ? 0 : -1)}
            disabled={!currentUserId || answer.authorId === currentUserId}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg transition-colors sm:size-8",
              answer.userVote === -1 ? "bg-destructive/15 text-destructive" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              (!currentUserId || answer.authorId === currentUserId) && "opacity-40",
            )}
          >
            <ChevronDown className="size-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Author row */}
          <div className="flex items-center gap-2">
            <div
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-[8px] font-semibold text-white ring-1 ring-white/10"
              style={{ backgroundColor: bg }}
            >
              {initials}
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-[11px]">
              <span className="font-medium text-foreground">{answer.authorName ?? "Anonymous"}</span>
              {answer.authorVerified && <ShieldCheck className="size-3 text-primary" strokeWidth={ICON_STROKE} />}
              <span className="text-muted-foreground">·</span>
              <span className="flex items-center gap-0.5 text-muted-foreground">
                <Sparkles className="size-2.5" strokeWidth={ICON_STROKE} />{answer.authorKarma}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{formatRelativeShort(answer.createdAt)}</span>
            </div>
          </div>

          {/* Approach name + solve time */}
          {(answer.approachName || answer.solveTime) && (
            <div className="flex flex-wrap items-center gap-2">
              {answer.approachName && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  <Lightbulb className="size-3" strokeWidth={ICON_STROKE} />
                  {answer.approachName}
                </span>
              )}
              {answer.solveTime && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                  <Clock className="size-3" strokeWidth={ICON_STROKE} />
                  {answer.solveTime}
                </span>
              )}
            </div>
          )}

          {/* One-liner trick — the money line */}
          {answer.oneLinerTrick && (
            <div className="rounded-lg border border-primary/20 bg-primary/[0.05] px-3 py-2 dark:bg-primary/[0.04]">
              <p className="text-[11px] font-medium text-primary">Shortcut</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {answer.oneLinerTrick}
              </p>
            </div>
          )}

          {/* Quick solution */}
          <div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {answer.quickSolution}
            </p>
          </div>

          {/* Exam tags */}
          {answer.examTags && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Tag className="size-3" strokeWidth={ICON_STROKE} />
              {answer.examTags}
            </div>
          )}

          {/* Detailed explanation — collapsible */}
          {answer.detailedExplanation && (
            <div>
              <button
                type="button"
                onClick={() => setShowDetailed(!showDetailed)}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                {showDetailed ? "Hide" : "Show"} detailed explanation
              </button>
              {showDetailed && (
                <div className="mt-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm leading-relaxed text-foreground/80 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  {answer.detailedExplanation}
                </div>
              )}
            </div>
          )}

          {/* Rating — only doubt author can rate */}
          <div className="flex items-center gap-3 pt-1">
            {isDoubtAuthor && answer.authorId !== currentUserId && (
              <div className="flex items-center gap-1">
                <span className="mr-1 text-[11px] text-muted-foreground">Rate:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => onRate(answer.id, star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "size-5 sm:size-4",
                        answer.rating !== null && star <= Math.round(answer.rating)
                          ? "text-amber-500" : "text-muted-foreground/30",
                      )}
                      strokeWidth={ICON_STROKE}
                      fill={answer.rating !== null && star <= Math.round(answer.rating) ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            )}
            {answer.rating !== null && (
              <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                <Star className="size-3" strokeWidth={ICON_STROKE} fill="currentColor" />
                {answer.rating.toFixed(1)} ({answer.ratingCount})
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
