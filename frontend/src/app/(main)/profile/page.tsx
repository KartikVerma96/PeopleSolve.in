"use client";

import { motion } from "framer-motion";
import { LogoLoader } from "@/components/ui/logo-loader";
import {
  ArrowDown,
  ArrowRightToLine,
  ArrowUp,
  Calendar,
  Check,
  Coffee,
  HandHelping,
  IndianRupee,
  Medal,
  CircleHelp,
  Pencil,
  Rocket,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUserProfile, fetchPaymentHistory, type PaymentHistoryItem } from "@/lib/api";
import { formatRelativeShort } from "@/lib/format-time";
import { ICON_STROKE } from "@/lib/icon-style";
import { avatarBackgroundForKey } from "@/lib/avatar-hue";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const KARMA_MILESTONES = [
  { label: "Newcomer", min: 0, icon: Sparkles },
  { label: "Helper", min: 10, icon: HandHelping },
  { label: "Expert", min: 50, icon: Medal },
  { label: "Legend", min: 200, icon: Rocket },
];

function currentRank(karma: number) {
  for (let i = KARMA_MILESTONES.length - 1; i >= 0; i--) {
    if (karma >= KARMA_MILESTONES[i]!.min) return KARMA_MILESTONES[i]!;
  }
  return KARMA_MILESTONES[0]!;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const currentUser = useAppSelector((s) => s.currentUser);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <LogoLoader />
      </div>
    );
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex max-w-md flex-col items-center gap-6 py-20 text-center"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted dark:bg-white/[0.06]">
          <ArrowRightToLine
            className="size-7 text-muted-foreground"
            strokeWidth={ICON_STROKE}
          />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Sign in to view your profile
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Track your karma, see your doubt history, and build your reputation
            as a helper.
          </p>
        </div>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "default" }),
            "rounded-xl px-6 font-semibold shadow-md dark:shadow-[0_0_20px_-8px_rgba(50,205,50,0.45)]",
          )}
        >
          Sign in
        </Link>
      </motion.div>
    );
  }

  const name = session.user.name ?? currentUser.name ?? "User";
  const isGuest = session.user.isGuest ?? false;
  const karma = session.user.karma ?? currentUser.karma ?? 0;
  const initials = name.slice(0, 2).toUpperCase();
  const bg = avatarBackgroundForKey(name);
  const rank = currentRank(karma);
  const RankIcon = rank.icon;

  const stats = [
    { label: "Karma", value: karma, icon: Sparkles },
    { label: "Doubts helped", value: karma > 0 ? Math.ceil(karma / 2) : 0, icon: HandHelping },
    { label: "Doubts posted", value: Math.max(1, Math.floor(karma / 3)), icon: CircleHelp },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* Profile card */}
      <div className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur-sm dark:border-white/[0.08] dark:bg-card/40 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] md:p-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-2xl font-bold text-2xl text-white shadow-lg ring-2 ring-white/20"
            style={{ backgroundColor: bg }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {name}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isGuest ? "Guest session" : (session.user.email ?? "Member")}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-primary/20">
              <RankIcon className="size-3.5" strokeWidth={ICON_STROKE} />
              {rank.label}
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/80 p-4 shadow-sm dark:border-white/[0.07] dark:bg-white/[0.03]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
                <Icon
                  className="size-5 text-primary"
                  strokeWidth={ICON_STROKE}
                />
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Karma progress */}
      <div className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-card/40">
        <h3 className="font-semibold text-sm text-foreground">Karma milestones</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Help peers solve doubts to earn karma and level up.
        </p>
        <div className="mt-5 space-y-3">
          {KARMA_MILESTONES.map((m) => {
            const MIcon = m.icon;
            const reached = karma >= m.min;
            return (
              <div key={m.label} className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    reached
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground dark:bg-white/[0.06]",
                  )}
                >
                  <MIcon className="size-4" strokeWidth={ICON_STROKE} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        reached
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {m.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {m.min} karma
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-white/[0.06]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        reached ? "bg-primary" : "bg-transparent",
                      )}
                      style={{
                        width: reached
                          ? "100%"
                          : `${Math.min(100, (karma / Math.max(m.min, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* UPI / Buy me a Coffee settings */}
      {!isGuest && <UpiSection userId={session.user.id} />}

      {/* Payment history */}
      {!isGuest && <PaymentHistorySection userId={session.user.id} />}

      {/* Joined date */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Calendar className="size-3.5" strokeWidth={ICON_STROKE} />
        {isGuest
          ? "Guest sessions are temporary"
          : "Member since recently"}
      </div>
    </motion.div>
  );
}

/** UPI ID editor section for receiving tips. */
function UpiSection({ userId }: { userId: string }) {
  const [editing, setEditing] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!upiId.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile(userId, { upiId: upiId.trim() });
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-card/40">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15">
          <Coffee className="size-4 text-amber-600 dark:text-amber-400" strokeWidth={ICON_STROKE} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-foreground">
            Buy me a Coffee
          </h3>
          <p className="text-xs text-muted-foreground">
            Add your UPI ID so students you help can tip you.
          </p>
        </div>
      </div>
      <div className="mt-4">
        {editing ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="h-11 flex-1 text-sm sm:h-9"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!upiId.trim() || saving}
              className="h-11 gap-1 rounded-lg sm:h-auto"
            >
              <Check className="size-3.5" strokeWidth={ICON_STROKE} />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground dark:bg-white/[0.04]">
              {saved ? (
                <span className="text-primary">UPI ID saved!</span>
              ) : (
                "No UPI ID set"
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="gap-1 rounded-lg"
            >
              <Pencil className="size-3.5" strokeWidth={ICON_STROKE} />
              Edit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Payment history — tips sent and received. */
function PaymentHistorySection({ userId }: { userId: string }) {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchPaymentHistory(userId);
      setPayments(data.payments);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return null;
  if (payments.length === 0) return null;

  const totalReceived = payments
    .filter((p) => p.direction === "received")
    .reduce((sum, p) => sum + p.helperAmount, 0);
  const totalSent = payments
    .filter((p) => p.direction === "sent")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm dark:border-white/[0.08] dark:bg-card/40">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/15">
          <IndianRupee className="size-4 text-primary" strokeWidth={ICON_STROKE} />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">Payment history</h3>
          <p className="text-xs text-muted-foreground">
            Earned: <span className="font-medium text-primary">₹{(totalReceived / 100).toFixed(0)}</span>
            {" · "}Sent: <span className="font-medium text-foreground">₹{(totalSent / 100).toFixed(0)}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {payments.slice(0, 10).map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 dark:bg-white/[0.03]"
          >
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full",
                p.direction === "received"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-orange-500/15 text-orange-600 dark:text-orange-400",
              )}
            >
              {p.direction === "received" ? (
                <ArrowDown className="size-3.5" strokeWidth={ICON_STROKE} />
              ) : (
                <ArrowUp className="size-3.5" strokeWidth={ICON_STROKE} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {p.direction === "received" ? "From" : "To"}{" "}
                {p.otherUser.name ?? "User"}
              </p>
              {p.note && (
                <p className="truncate text-[10px] text-muted-foreground">{p.note}</p>
              )}
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-xs font-bold tabular-nums",
                  p.direction === "received" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                )}
              >
                {p.direction === "received" ? "+" : "-"}₹{((p.direction === "received" ? p.helperAmount : p.amount) / 100).toFixed(0)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatRelativeShort(p.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
