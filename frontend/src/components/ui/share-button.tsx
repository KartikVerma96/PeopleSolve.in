"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ICON_STROKE } from "@/lib/icon-style";
import { cn } from "@/lib/utils";

type ShareButtonProps = {
  title: string;
  text: string;
  url: string;
  className?: string;
};

/**
 * Share button — uses Web Share API if available, falls back to
 * WhatsApp/Telegram/Copy links.
 */
export function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined"
    ? `${window.location.origin}${url}`
    : url;

  const shareText = `${text}\n${fullUrl}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: fullUrl });
        return;
      } catch {
        // User cancelled or not supported
      }
    }
    setShowMenu((v) => !v);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(text)}`;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleShare}
        className={cn("text-muted-foreground hover:text-foreground", className)}
        title="Share"
      >
        <Share2 className="size-4" strokeWidth={ICON_STROKE} />
      </Button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-border bg-card p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
              onClick={() => setShowMenu(false)}
            >
              <span className="text-[#25D366] text-base">💬</span>
              WhatsApp
            </a>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
              onClick={() => setShowMenu(false)}
            >
              <span className="text-base">📨</span>
              Telegram
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <span className="text-base">📋</span>
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
