"use client";

import { motion } from "framer-motion";
import { Crown, Medal, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { LogoLoader } from "@/components/ui/logo-loader";
import { ICON_STROKE } from "@/lib/icon-style";
import { avatarBackgroundForKey } from "@/lib/avatar-hue";
import { initialsFromName } from "@/lib/initials";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";

type Leader = {
  rank: number;
  id: string;
  name: string | null;
  image: string | null;
  karma: number;
  isVerified: boolean;
  answersCount: number;
  tipsReceived: number;
};

const EXAM_FILTERS = ["All", "SSC CGL", "IBPS PO", "JEE Main", "NEET UG", "UPSC CSE Prelims", "RRB NTPC"];

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState("All");

  useEffect(() => {
    setLoading(true);
    const params = exam !== "All" ? `?exam=${encodeURIComponent(exam)}` : "";
    fetch(`${API_BASE}/leaderboard${params}`)
      .then((r) => r.json())
      .then((d) => setLeaders(d.leaders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [exam]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Top helpers this week — earn karma by solving doubts.
        </p>
      </div>

      {/* Exam filter pills */}
      <div className="flex flex-wrap gap-2">
        {EXAM_FILTERS.map((e) => (
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

      {loading ? (
        <div className="flex justify-center py-16"><LogoLoader /></div>
      ) : leaders.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No helpers found for this exam yet. Be the first!
        </p>
      ) : (
        <div className="space-y-2">
          {leaders.map((leader) => {
            const bg = avatarBackgroundForKey(leader.id + (leader.name ?? ""));
            const initials = initialsFromName(leader.name ?? "U");
            const isTop3 = leader.rank <= 3;

            return (
              <div
                key={leader.id}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-4 transition-colors",
                  isTop3
                    ? "border-primary/20 bg-primary/[0.04] dark:border-primary/15 dark:bg-primary/[0.03]"
                    : "border-border/80 bg-card/80 dark:border-white/[0.07] dark:bg-white/[0.03]",
                )}
              >
                {/* Rank */}
                <div className="flex size-10 shrink-0 items-center justify-center">
                  {leader.rank === 1 ? (
                    <Trophy className="size-6 text-amber-500" strokeWidth={ICON_STROKE} />
                  ) : leader.rank === 2 ? (
                    <Medal className="size-6 text-gray-400" strokeWidth={ICON_STROKE} />
                  ) : leader.rank === 3 ? (
                    <Medal className="size-6 text-amber-700" strokeWidth={ICON_STROKE} />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">{leader.rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold text-white ring-1 ring-white/10"
                  style={{ backgroundColor: bg }}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {leader.name ?? "Anonymous"}
                    </p>
                    {leader.isVerified && (
                      <ShieldCheck className="size-3.5 text-primary" strokeWidth={ICON_STROKE} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {leader.answersCount} answers · {leader.tipsReceived} tips received
                  </p>
                </div>

                {/* Karma */}
                <div className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary">
                  <Sparkles className="size-3.5" strokeWidth={ICON_STROKE} />
                  {leader.karma}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
