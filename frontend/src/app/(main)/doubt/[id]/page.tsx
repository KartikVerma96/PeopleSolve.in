"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  HandHelping,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { AnswerSection } from "@/components/answers/answer-section";
import { buttonVariants } from "@/components/ui/button";
import { LogoLoader } from "@/components/ui/logo-loader";
import { ICON_STROKE } from "@/lib/icon-style";
import { avatarBackgroundForKey } from "@/lib/avatar-hue";
import { formatRelativeShort } from "@/lib/format-time";
import { initialsFromName } from "@/lib/initials";
import { fetchDoubt, createThread, type ApiDoubtDetail } from "@/lib/api";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function DoubtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [doubt, setDoubt] = useState<ApiDoubtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [helping, setHelping] = useState(false);

  const loadDoubt = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDoubt(id);
      setDoubt(data);
    } catch {
      setError("Could not load this doubt.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDoubt();
  }, [loadDoubt]);

  const handleStartHelping = async () => {
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }

    setHelping(true);
    try {
      const res = await createThread(id, session.user.id);
      router.push(`/messages?thread=${res.thread.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start helping");
      setHelping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LogoLoader />
      </div>
    );
  }

  if (error && !doubt) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-4 rounded-xl",
          )}
        >
          Back to feed
        </Link>
      </div>
    );
  }

  if (!doubt) return null;

  const isAuthor = session?.user?.id === doubt.authorId;
  const isGuest = session?.user?.id?.startsWith("guest-");
  const authorBg = avatarBackgroundForKey(doubt.authorId + (doubt.authorName ?? ""));
  const authorInitials = initialsFromName(doubt.authorName ?? "A");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={ICON_STROKE} />
        Back to feed
      </Link>

      {/* Main card */}
      <div className="rounded-2xl border border-border/80 bg-card/80 shadow-sm dark:border-white/[0.08] dark:bg-card/40">
        {/* Header */}
        <div className="border-b border-border/60 p-4 dark:border-white/[0.06] sm:p-6 md:p-8">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-foreground ring-1 ring-border dark:bg-white/[0.06] dark:ring-white/10">
              {doubt.exam}
            </span>
            <span className="rounded-lg bg-primary/12 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-primary/30 dark:bg-primary/15 dark:text-[#86efac] dark:ring-primary/25">
              {doubt.subject}
            </span>
            {doubt.urgent && (
              <span className="badge-urgent inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1 text-xs font-bold text-amber-700 dark:text-amber-200/95">
                <Flame className="size-3" strokeWidth={ICON_STROKE} />
                Urgent
              </span>
            )}
            {doubt.needFasterMethod && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <Clock className="size-3" strokeWidth={ICON_STROKE} />
                Need faster method
                {doubt.mySolveTime && (
                  <span className="font-normal text-blue-600/70 dark:text-blue-400/70">
                    · currently {doubt.mySolveTime}
                  </span>
                )}
              </span>
            )}
            {doubt.resolved && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-3" strokeWidth={ICON_STROKE} />
                Resolved
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            {doubt.title}
          </h1>

          {/* Author & meta */}
          <div className="mt-4 flex items-center gap-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold text-white ring-1 ring-white/10"
              style={{ backgroundColor: authorBg }}
            >
              {authorInitials}
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-medium text-foreground">
                {doubt.authorName ?? "Anonymous"}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="size-3" strokeWidth={ICON_STROKE} />
                  {doubt.authorKarma} karma
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" strokeWidth={ICON_STROKE} />
                  {formatRelativeShort(doubt.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-3" strokeWidth={ICON_STROKE} />
                  {doubt.viewerCount} views
                </span>
                <span className="inline-flex items-center gap-1">
                  <HandHelping className="size-3" strokeWidth={ICON_STROKE} />
                  {doubt.helperCount} helping
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 md:p-8">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {doubt.description}
          </p>

          {/* Image */}
          {doubt.imageUrl && (
            <div className="mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${API_BASE}${doubt.imageUrl}`}
                alt="Doubt attachment"
                className="max-h-96 rounded-xl border border-border/60 object-contain dark:border-white/[0.08]"
              />
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="border-t border-border/60 p-4 dark:border-white/[0.06] sm:p-6 md:p-8">
          {doubt.resolved ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-5 shrink-0" strokeWidth={ICON_STROKE} />
              <div>
                <p className="font-medium">This doubt has been resolved</p>
                <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-400/70">
                  The author marked this as solved. You can still view the discussion threads.
                </p>
              </div>
            </div>
          ) : isAuthor ? (
            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground dark:bg-white/[0.03]">
              <p className="font-medium text-foreground">This is your doubt</p>
              <p className="mt-0.5 text-xs">
                Check your{" "}
                <Link href="/messages" className="text-primary underline-offset-4 hover:underline">
                  messages
                </Link>{" "}
                to see if anyone has started helping. You can resolve this doubt from the chat.
              </p>
            </div>
          ) : status !== "authenticated" ? (
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="btn-shiny inline-flex h-11 w-full items-center justify-center rounded-2xl px-6 text-sm sm:w-auto"
              >
                Sign in to help
              </Link>
              <p className="text-xs text-muted-foreground">
                Sign in or create an account to start helping with this doubt.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Ready to help?
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  This will create a chat thread with the author. You&apos;ll earn karma for helping.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartHelping}
                disabled={helping || isGuest}
                className="btn-shiny inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-8 text-sm disabled:pointer-events-none disabled:opacity-50"
              >
                <HandHelping className="size-4" strokeWidth={ICON_STROKE} />
                {helping ? "Starting…" : "Start helping"}
              </button>
            </div>
          )}
          {error && (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          )}
        </div>
      </div>

      {/* Thread count info */}
      {doubt.threadCount > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {doubt.threadCount} helper{doubt.threadCount !== 1 ? "s" : ""} already engaged with this doubt
        </p>
      )}

      {/* Answers section */}
      <AnswerSection doubtId={doubt.id} doubtAuthorId={doubt.authorId} />
    </motion.div>
  );
}
