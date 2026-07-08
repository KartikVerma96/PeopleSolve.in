"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video } from "lucide-react";

import { getSocket } from "@/lib/socket";
import { avatarBackgroundForKey } from "@/lib/avatar-hue";
import { initialsFromName } from "@/lib/initials";
import { ICON_STROKE } from "@/lib/icon-style";
import type { CallType } from "@/hooks/use-webrtc";

type IncomingCallData = {
  threadId: string;
  callerId: string;
  callerName: string;
  callType: CallType;
};

/**
 * Global incoming call banner — shows when user is NOT on the messages page.
 * When on /messages?thread=X, the useWebRTC hook handles it directly.
 */
export function IncomingCallProvider() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [incoming, setIncoming] = useState<IncomingCallData | null>(null);

  const userId = session?.user?.id;
  const isOnMessages = pathname.startsWith("/messages");

  useEffect(() => {
    if (status !== "authenticated" || !userId) return;
    // Don't show the global banner if user is on messages page
    // (the useWebRTC hook in the messages page handles it)
    if (isOnMessages) return;

    const socket = getSocket(userId);

    const onIncoming = (data: IncomingCallData) => {
      setIncoming(data);
    };

    const onEnded = () => setIncoming(null);

    socket.on("call:incoming", onIncoming);
    socket.on("call:ended", onEnded);
    socket.on("call:rejected", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:ended", onEnded);
      socket.off("call:rejected", onEnded);
    };
  }, [status, userId, isOnMessages]);

  const accept = () => {
    if (!incoming) return;
    // Navigate to the thread — the useWebRTC hook will re-receive the call
    // via a fresh call:initiate from the caller (or the call will timeout)
    // Better approach: just navigate, the caller's UI shows "calling..."
    router.push(`/messages?thread=${incoming.threadId}`);
    setIncoming(null);
  };

  const reject = () => {
    if (!incoming || !userId) return;
    const socket = getSocket(userId);
    socket.emit("call:reject", {
      threadId: incoming.threadId,
      targetUserId: incoming.callerId,
    });
    setIncoming(null);
  };

  const bg = incoming ? avatarBackgroundForKey(incoming.callerId + incoming.callerName) : "";
  const initials = incoming ? initialsFromName(incoming.callerName) : "";

  return (
    <AnimatePresence>
      {incoming && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-4 left-1/2 z-[10000] -translate-x-1/2"
        >
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/95 px-5 py-3 shadow-2xl backdrop-blur-xl">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" style={{ animationDuration: "2s" }} />
              <div
                className="relative flex size-10 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white/20"
                style={{ backgroundColor: bg }}
              >
                {initials}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{incoming.callerName}</p>
              <p className="flex items-center gap-1 text-xs text-white/50">
                {incoming.callType === "video" ? (
                  <><Video className="size-3" strokeWidth={ICON_STROKE} /> Video call</>
                ) : (
                  <><Phone className="size-3" strokeWidth={ICON_STROKE} /> Voice call</>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reject}
                className="flex size-10 items-center justify-center rounded-full bg-red-600 text-white transition-transform hover:scale-105 active:scale-95"
                aria-label="Reject"
              >
                <PhoneOff className="size-4" strokeWidth={ICON_STROKE} />
              </button>
              <button
                type="button"
                onClick={accept}
                className="flex size-10 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105 active:scale-95"
                aria-label="Accept"
              >
                <Phone className="size-4" strokeWidth={ICON_STROKE} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
