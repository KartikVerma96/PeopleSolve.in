import Link from "next/link";
import { ArrowRight, HandHelping, PenSquare, Zap } from "lucide-react";

import { LiveFeed } from "@/components/feed/live-feed";
import { ICON_STROKE } from "@/lib/icon-style";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Compact hero banner */}
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.03] p-5 dark:border-white/[0.06] dark:from-primary/[0.08] dark:to-primary/[0.02] md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          {/* Left */}
          <div className="min-w-0 flex-1 space-y-2.5">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
              Stuck on a doubt?{" "}
              <span className="text-primary">Get help in seconds.</span>
            </h1>
            <p className="max-w-lg text-[13px] leading-relaxed text-muted-foreground">
              Post your doubt and get peer help instantly — students helping students across{" "}
              <span className="font-medium text-foreground">SSC</span>,{" "}
              <span className="font-medium text-foreground">Bank</span>,{" "}
              <span className="font-medium text-foreground">Railway</span>,{" "}
              <span className="font-medium text-foreground">IIT-JEE</span>,{" "}
              <span className="font-medium text-foreground">NEET</span>,{" "}
              <span className="font-medium text-foreground">UPSC</span> & more. No tutors, no subscriptions.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Link
                href="/post"
                className="btn-shiny group inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-[13px]"
              >
                <PenSquare className="size-3.5" strokeWidth={ICON_STROKE} />
                Post your doubt
                <ArrowRight
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={ICON_STROKE}
                />
              </Link>
              <a
                href="#feed"
                className="btn-shiny group inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-[13px]"
              >
                <Zap className="size-3.5" strokeWidth={ICON_STROKE} />
                Browse doubts
              </a>
            </div>
          </div>

          {/* Right: how it works — inline steps */}
          <div className="hidden shrink-0 md:flex md:gap-5 lg:gap-6">
            {[
              { icon: PenSquare, label: "Post doubt", sub: "Describe & add images" },
              { icon: HandHelping, label: "Get help", sub: "Peer joins your thread" },
              { icon: Zap, label: "Earn karma", sub: "Resolve & build rep" },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/15">
                    <Icon className="size-[18px] text-primary" strokeWidth={ICON_STROKE} />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{step.label}</p>
                  <p className="text-[10px] leading-tight text-muted-foreground">{step.sub}</p>
                  {i < 2 && (
                    <div className="absolute" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div id="feed">
        <LiveFeed />
      </div>
    </div>
  );
}
