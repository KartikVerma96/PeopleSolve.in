"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightToLine,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  SendHorizonal,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ICON_STROKE } from "@/lib/icon-style";
import { avatarBackgroundForKey } from "@/lib/avatar-hue";
import { formatRelativeShort } from "@/lib/format-time";
import { initialsFromName } from "@/lib/initials";
import { fetchThreads, fetchMessages, sendMessage, resolveDoubt, type ApiThread, type ApiMessage } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAppDispatch } from "@/store/hooks";
import { patchDoubt } from "@/store/slices/doubtsSlice";
import { cn } from "@/lib/utils";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeThreadId = searchParams.get("thread");
  const { data: session, status } = useSession();

  const [threads, setThreads] = useState<ApiThread[]>([]);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const reduxDispatch = useAppDispatch();
  const userId = session?.user?.id;
  const userName = session?.user?.name ?? "User";

  // Load threads
  const loadThreads = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await fetchThreads(userId);
      setThreads(data.threads);
    } catch {
      // Silent fail — empty state shown
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (status === "authenticated") loadThreads();
  }, [status, loadThreads]);

  // Load messages for active thread
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

    setMsgLoading(true);
    fetchMessages(activeThreadId)
      .then((data) => setMessages(data.messages))
      .catch(() => {})
      .finally(() => setMsgLoading(false));

    // Join socket room for real-time messages
    const socket = getSocket(userId);
    socket.emit("thread:join", activeThreadId);

    const onNewMessage = (msg: ApiMessage) => {
      if (msg.threadId === activeThreadId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // Update thread last message
      setThreads((prev) =>
        prev.map((t) =>
          t.id === msg.threadId
            ? {
                ...t,
                lastMessage: {
                  id: msg.id,
                  body: msg.body,
                  senderName: msg.senderName,
                  senderId: msg.senderId,
                  createdAt: msg.createdAt,
                },
                updatedAt: msg.createdAt,
              }
            : t,
        ),
      );
    };

    const onTyping = (data: { userName: string; typing: boolean }) => {
      if (data.typing) {
        setTypingUser(data.userName);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    };

    socket.on("message:new", onNewMessage);
    socket.on("typing:update", onTyping);

    return () => {
      socket.emit("thread:leave", activeThreadId);
      socket.off("message:new", onNewMessage);
      socket.off("typing:update", onTyping);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [activeThreadId, userId]);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !activeThreadId || !userId || sending) return;
    const body = input.trim();
    setInput("");
    setSending(true);

    try {
      // Send via socket for real-time delivery
      const socket = getSocket(userId);
      socket.emit("message:send", {
        threadId: activeThreadId,
        senderId: userId,
        body,
      });

      // Also send via REST as fallback (socket handler will deduplicate)
      await sendMessage(activeThreadId, userId, body).catch(() => {});
    } catch {
      // Restore input on total failure
      setInput(body);
    } finally {
      setSending(false);
    }
  };

  // Typing indicator
  const handleInputChange = (value: string) => {
    setInput(value);
    if (activeThreadId && userId) {
      const socket = getSocket(userId);
      socket.emit("typing:start", { threadId: activeThreadId, userName });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", { threadId: activeThreadId, userName });
      }, 2000);
    }
  };

  // Resolve doubt from chat
  const handleResolve = async () => {
    if (!activeThread || !userId) return;
    const doubtId = activeThread.doubt.id;
    setResolving(true);
    try {
      await resolveDoubt(doubtId, userId);
      // Update local thread state
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, doubt: { ...t.doubt, resolved: true } }
            : t,
        ),
      );
      // Update feed
      reduxDispatch(patchDoubt({ id: doubtId, resolved: true }));
    } catch {
      // silent
    } finally {
      setResolving(false);
    }
  };

  // Auth guard
  if (status === "loading") {
    return <p className="py-20 text-center text-muted-foreground text-sm">Loading...</p>;
  }

  if (status !== "authenticated") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex max-w-md flex-col items-center gap-6 py-20 text-center"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted dark:bg-white/[0.06]">
          <ArrowRightToLine className="size-7 text-muted-foreground" strokeWidth={ICON_STROKE} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Sign in to view messages
          </h2>
          <p className="text-muted-foreground text-sm">
            Help peers with their doubts to start conversations.
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

  const activeThread = threads.find((t) => t.id === activeThreadId);

  // Thread list + Chat split view
  return (
    <div className="flex h-[calc(100dvh-14rem)] flex-col gap-4 md:h-[calc(100dvh-12rem)]">
      <AnimatePresence mode="wait">
        {!activeThreadId ? (
          // --- Thread list ---
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {loading ? (
              <p className="py-20 text-center text-muted-foreground text-sm">
                Loading threads...
              </p>
            ) : threads.length === 0 ? (
              <EmptyThreads />
            ) : (
              <ScrollArea className="min-h-0 flex-1">
                <div className="flex flex-col gap-2">
                  {threads.map((thread) => (
                    <ThreadRow
                      key={thread.id}
                      thread={thread}
                      userId={userId!}
                      onClick={() => router.push(`/messages?thread=${thread.id}`)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        ) : (
          // --- Chat view ---
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border/60 pb-3 dark:border-white/[0.06]">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.push("/messages")}
                aria-label="Back to threads"
              >
                <ArrowLeft className="size-4" strokeWidth={ICON_STROKE} />
              </Button>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {activeThread?.doubt.title ?? "Thread"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {activeThread?.doubt.exam} · {activeThread?.doubt.subject}
                  {activeThread?.members && (
                    <>
                      {" · "}
                      {activeThread.members
                        .filter((m) => m.userId !== userId)
                        .map((m) => m.name ?? "User")
                        .join(", ")}
                    </>
                  )}
                </p>
              </div>
              {/* Resolve button — only for doubt author */}
              {activeThread && !activeThread.doubt.resolved &&
                activeThread.members.some(
                  (m) => m.userId === userId && m.role === "author",
                ) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 rounded-lg border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                    onClick={handleResolve}
                    disabled={resolving}
                  >
                    <CheckCircle2 className="size-3.5" strokeWidth={ICON_STROKE} />
                    {resolving ? "Resolving…" : "Resolve"}
                  </Button>
                )}
              {activeThread?.doubt.resolved && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-3.5" strokeWidth={ICON_STROKE} />
                  Resolved
                </span>
              )}
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto py-4"
            >
              {msgLoading ? (
                <p className="py-10 text-center text-muted-foreground text-sm">
                  Loading messages...
                </p>
              ) : messages.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.senderId === userId}
                    />
                  ))}
                </div>
              )}
              {typingUser && (
                <p className="mt-2 px-2 text-xs italic text-muted-foreground">
                  {typingUser} is typing...
                </p>
              )}
            </div>

            {/* Input */}
            <form
              className="flex items-center gap-2 border-t border-border/60 pt-3 dark:border-white/[0.06]"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <Input
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Type a message..."
                className="h-10 flex-1 rounded-xl"
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || sending}
                className="shrink-0 rounded-xl"
              >
                <SendHorizonal className="size-4" strokeWidth={ICON_STROKE} />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Single thread row in the list. */
function ThreadRow({
  thread,
  userId,
  onClick,
}: {
  thread: ApiThread;
  userId: string;
  onClick: () => void;
}) {
  const otherMembers = thread.members.filter((m) => m.userId !== userId);
  const otherName = otherMembers[0]?.name ?? "User";
  const bg = avatarBackgroundForKey(otherMembers[0]?.userId ?? "");
  const initials = initialsFromName(otherName);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border/80 bg-card/80 p-3 text-left transition-colors hover:bg-muted/60",
        "dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]",
      )}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold text-white shadow-inner ring-1 ring-white/10"
        style={{ backgroundColor: bg }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {thread.doubt.title}
          </p>
          {thread.lastMessage && (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatRelativeShort(thread.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {thread.lastMessage
            ? `${thread.lastMessage.senderId === userId ? "You" : thread.lastMessage.senderName}: ${thread.lastMessage.body}`
            : `with ${otherName} · ${thread.doubt.exam}`}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/** Single chat message bubble. */
function ChatBubble({
  message,
  isOwn,
}: {
  message: ApiMessage;
  isOwn: boolean;
}) {
  const bg = avatarBackgroundForKey(message.senderId);
  const initials = initialsFromName(message.senderName ?? "U");

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      {!isOwn && (
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white ring-1 ring-white/10"
          style={{ backgroundColor: bg }}
        >
          {initials}
        </div>
      )}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          isOwn
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border/80 bg-card dark:border-white/[0.08] dark:bg-white/[0.05]",
        )}
      >
        {!isOwn && (
          <p className="mb-0.5 text-[10px] font-medium text-muted-foreground">
            {message.senderName}
          </p>
        )}
        <p>{message.body}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isOwn ? "text-primary-foreground/60" : "text-muted-foreground",
          )}
        >
          {formatRelativeShort(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

/** Empty state when no threads exist. */
function EmptyThreads() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/15">
        <MessageCircle className="size-8 text-primary" strokeWidth={ICON_STROKE} />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          No conversations yet
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tap <span className="font-medium text-foreground">Help Now</span> on a doubt in the live
          feed to start a conversation.
        </p>
      </div>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "default" }),
          "group gap-2 rounded-xl px-5 font-semibold shadow-md dark:shadow-[0_0_20px_-8px_rgba(50,205,50,0.45)]",
        )}
      >
        Browse live feed
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          strokeWidth={ICON_STROKE}
        />
      </Link>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-muted-foreground text-sm">Loading...</p>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
