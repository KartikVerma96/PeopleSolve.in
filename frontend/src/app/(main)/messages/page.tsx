"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightToLine,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Eye,
  HandHelping,
  MessageCircle,
  PenTool,
  Phone,
  SendHorizonal,
  Video,
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

import { CallOverlay } from "@/components/call/call-overlay";
import { Whiteboard } from "@/components/call/whiteboard";
import { TipModal } from "@/components/payment/tip-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogoLoader } from "@/components/ui/logo-loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useWhiteboard } from "@/hooks/use-whiteboard";
import { ICON_STROKE } from "@/lib/icon-style";
import { avatarBackgroundForKey } from "@/lib/avatar-hue";
import { formatRelativeShort } from "@/lib/format-time";
import { initialsFromName } from "@/lib/initials";
import {
  fetchThreads,
  fetchMessages,
  sendMessage,
  resolveDoubt,
  type ApiThread,
  type ApiMessage,
} from "@/lib/api";
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
  const [tipOpen, setTipOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const reduxDispatch = useAppDispatch();
  const userId = session?.user?.id;
  const userName = session?.user?.name ?? "User";

  // Derive target user from active thread (safe before auth guard — just undefined)
  const activeThread = threads.find((t) => t.id === activeThreadId);
  const targetUserId = activeThread?.members.find(
    (m) => m.userId !== userId,
  )?.userId;
  const peerName =
    activeThread?.members.find((m) => m.userId !== userId)?.name ?? "User";

  // WebRTC — must be called unconditionally (React hooks rule)
  const webrtc = useWebRTC({
    userId,
    userName,
    threadId: activeThreadId ?? undefined,
    targetUserId,
  });

  // Whiteboard
  const wb = useWhiteboard({
    userId,
    userName,
    threadId: activeThreadId ?? undefined,
  });
  const [wbFullscreen, setWbFullscreen] = useState(false);

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
    if (!activeThreadId || !userId) {
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
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages]);

  // Send message — use only REST, socket broadcasts to room
  const handleSend = async () => {
    if (!input.trim() || !activeThreadId || !userId || sending) return;
    const body = input.trim();
    setInput("");
    setSending(true);

    try {
      await sendMessage(activeThreadId, userId, body);
    } catch {
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
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? { ...t, doubt: { ...t.doubt, resolved: true } }
            : t,
        ),
      );
      reduxDispatch(patchDoubt({ id: doubtId, resolved: true }));
    } catch {
      // silent
    } finally {
      setResolving(false);
    }
  };

  // Auth guard
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <LogoLoader size="sm" />
      </div>
    );
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
          className="btn-shiny inline-flex h-10 items-center justify-center rounded-xl px-6 text-sm"
        >
          Sign in
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col md:h-[calc(100dvh-8rem)]">
      {/* Call overlay */}
      <CallOverlay
        callState={webrtc.callState}
        callType={webrtc.callType}
        isMuted={webrtc.isMuted}
        isCameraOff={webrtc.isCameraOff}
        isScreenSharing={webrtc.isScreenSharing}
        peerName={peerName}
        peerId={targetUserId ?? ""}
        incomingCall={webrtc.incomingCall}
        localVideoRef={webrtc.localVideoRef}
        remoteVideoRef={webrtc.remoteVideoRef}
        remoteAudioRef={webrtc.remoteAudioRef}
        onAccept={webrtc.acceptCall}
        onReject={webrtc.rejectCall}
        onEnd={webrtc.endCall}
        onToggleMute={webrtc.toggleMute}
        onToggleCamera={webrtc.toggleCamera}
        onToggleScreenShare={webrtc.toggleScreenShare}
      />
      {/* Tip modal */}
      <TipModal
        open={tipOpen}
        onClose={() => setTipOpen(false)}
        fromUserId={userId ?? ""}
        fromUserName={userName}
        fromUserEmail={session?.user?.email ?? undefined}
        toUserId={targetUserId ?? ""}
        toUserName={peerName}
        threadId={activeThreadId ?? undefined}
      />
      <AnimatePresence mode="wait">
        {!activeThreadId ? (
          /* ============ THREAD LIST ============ */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
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
          /* ============ CHAT VIEW ============ */
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Chat header */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-3 dark:border-white/[0.06] sm:gap-3">
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
                  {activeThread?.doubt.title ?? "Loading..."}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {activeThread
                    ? `${activeThread.doubt.exam} · ${activeThread.doubt.subject} · with ${activeThread.members
                        .filter((m) => m.userId !== userId)
                        .map((m) => m.name ?? "User")
                        .join(", ")}`
                    : "Loading thread..."}
                </p>
              </div>
              {/* Action toolbar */}
              {activeThread && (
                <div className="flex shrink-0 items-center rounded-xl border border-border/60 bg-muted/40 p-0.5 dark:border-white/[0.08] dark:bg-white/[0.03]">
                  {!activeThread.doubt.resolved && (
                    <>
                      <button
                        type="button"
                        title="Voice call"
                        onClick={() => webrtc.startCall("voice")}
                        disabled={webrtc.callState !== "idle"}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-primary disabled:opacity-40"
                      >
                        <Phone className="size-[15px]" strokeWidth={ICON_STROKE} />
                      </button>
                      <button
                        type="button"
                        title="Video call"
                        onClick={() => webrtc.startCall("video")}
                        disabled={webrtc.callState !== "idle"}
                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-primary disabled:opacity-40"
                      >
                        <Video className="size-[15px]" strokeWidth={ICON_STROKE} />
                      </button>
                      <div className="mx-0.5 h-4 w-px bg-border/60 dark:bg-white/10" />
                    </>
                  )}
                  <button
                    type="button"
                    title="Whiteboard"
                    onClick={() => wb.setIsOpen(!wb.isOpen)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg transition-colors",
                      wb.isOpen
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-background hover:text-primary",
                    )}
                  >
                    <PenTool className="size-[15px]" strokeWidth={ICON_STROKE} />
                  </button>
                  {targetUserId && (
                    <button
                      type="button"
                      title="Buy me a Coffee"
                      onClick={() => setTipOpen(true)}
                      className="flex size-8 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-500/10 dark:text-amber-400"
                    >
                      <Coffee className="size-[15px]" strokeWidth={ICON_STROKE} />
                    </button>
                  )}
                </div>
              )}
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

            {/* Split layout: messages + whiteboard */}
            <div className={cn("flex min-h-0 flex-1 gap-0", wb.isOpen && "flex-col gap-2 md:flex-row md:gap-3")}>
            {/* Messages area */}
            <div
              ref={scrollRef}
              className={cn("min-h-0 flex-1 overflow-y-auto py-4", wb.isOpen && "max-h-[40%] md:max-h-none md:max-w-[50%]")}
            >
              {/* Doubt context card — pinned at top of chat */}
              {activeThread && (
                <div className="mx-auto mb-6 max-w-md rounded-xl border border-border/60 bg-muted/40 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
                      <Eye className="size-4 text-primary" strokeWidth={ICON_STROKE} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Doubt by{" "}
                        {activeThread.members.find((m) => m.role === "author")?.name ?? "Author"}
                      </p>
                      <Link
                        href={`/doubt/${activeThread.doubt.id}`}
                        className="mt-0.5 block text-sm font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {activeThread.doubt.title}
                      </Link>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground ring-1 ring-border dark:bg-white/[0.06] dark:ring-white/10">
                          {activeThread.doubt.exam}
                        </span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/20">
                          {activeThread.doubt.subject}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {msgLoading ? (
                <div className="flex items-center justify-center py-10">
                  <LogoLoader size="sm" />
                </div>
              ) : messages.length === 0 ? (
                <div className="mx-auto max-w-xs py-6 text-center">
                  <HandHelping className="mx-auto mb-3 size-8 text-primary/40" strokeWidth={ICON_STROKE} />
                  <p className="text-sm font-medium text-foreground">Start the conversation</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Say hi, ask for clarification, or jump straight into solving the doubt.
                  </p>
                </div>
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
                <div className="mt-2 flex items-center gap-2 px-2">
                  <div className="flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {typingUser} is typing
                  </p>
                </div>
              )}
            </div>

            {/* Whiteboard panel */}
            {wb.isOpen && (
              <div className={cn("min-h-0", wb.isOpen ? "flex-1" : "hidden")}>
                <Whiteboard
                  isOpen={wb.isOpen}
                  isFullscreen={wbFullscreen}
                  onClose={() => wb.setIsOpen(false)}
                  onToggleFullscreen={() => setWbFullscreen((f) => !f)}
                  canvasRef={wb.canvasRef}
                  tool={wb.tool}
                  setTool={wb.setTool}
                  color={wb.color}
                  setColor={wb.setColor}
                  brushSize={wb.brushSize}
                  setBrushSize={wb.setBrushSize}
                  fillMode={wb.fillMode}
                  setFillMode={wb.setFillMode}
                  gridMode={wb.gridMode}
                  setGridMode={wb.setGridMode}
                  remoteCursor={wb.remoteCursor}
                  onPointerDown={wb.onPointerDown}
                  onPointerMove={wb.onPointerMove}
                  onPointerUp={wb.onPointerUp}
                  undo={wb.undo}
                  redo={wb.redo}
                  clearAll={wb.clearAll}
                  saveAsImage={wb.saveAsImage}
                  canUndo={wb.canUndo}
                  canRedo={wb.canRedo}
                />
              </div>
            )}
            </div>

            {/* Message input */}
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
                placeholder="Type your message..."
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

/* ============ THREAD ROW ============ */
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
  const myRole = thread.members.find((m) => m.userId === userId)?.role;

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
          <div className="flex shrink-0 items-center gap-1.5">
            {thread.doubt.resolved && (
              <CheckCircle2 className="size-3 text-emerald-500" strokeWidth={ICON_STROKE} />
            )}
            {thread.lastMessage && (
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeShort(thread.lastMessage.createdAt)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "rounded px-1 py-0.5 text-[9px] font-medium",
            myRole === "author"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "bg-primary/10 text-primary",
          )}>
            {myRole === "author" ? "Your doubt" : "Helping"}
          </span>
          <p className="truncate text-xs text-muted-foreground">
            {thread.lastMessage
              ? `${thread.lastMessage.senderId === userId ? "You" : thread.lastMessage.senderName}: ${thread.lastMessage.body}`
              : `with ${otherName} · ${thread.doubt.exam}`}
          </p>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

/* ============ CHAT BUBBLE ============ */
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
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
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

/* ============ EMPTY STATE ============ */
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
        className="btn-shiny group inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm"
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
        <div className="flex items-center justify-center py-20">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
