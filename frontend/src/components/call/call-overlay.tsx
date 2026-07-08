"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  MonitorUp,
  PhoneIncoming,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";

import { ICON_STROKE } from "@/lib/icon-style";
import { avatarBackgroundForKey } from "@/lib/avatar-hue";
import { initialsFromName } from "@/lib/initials";
import type { CallState, CallType } from "@/hooks/use-webrtc";
import { cn } from "@/lib/utils";

type CallOverlayProps = {
  callState: CallState;
  callType: CallType;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  peerName: string;
  peerId: string;
  incomingCall: {
    callerName: string;
    callType: CallType;
  } | null;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
};

export function CallOverlay({
  callState,
  callType,
  isMuted,
  isCameraOff,
  isScreenSharing,
  peerName,
  peerId,
  incomingCall,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
}: CallOverlayProps) {
  const isActive =
    callState === "calling" ||
    callState === "ringing" ||
    callState === "connecting" ||
    callState === "connected";

  if (!isActive) return null;

  const peerBg = avatarBackgroundForKey(peerId + peerName);
  const peerInitials = initialsFromName(peerName);
  const isVideoCall = callType === "video";
  const showRemoteVideo = isVideoCall && callState === "connected";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col bg-zinc-950/95 backdrop-blur-md"
      >
        {/*
          ALWAYS render audio + video elements so refs are available
          when ontrack fires during "connecting" (before UI shows them).
        */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={cn(
            "absolute inset-0 z-0 h-full w-full object-cover",
            showRemoteVideo ? "block" : "hidden",
          )}
        />

        {/* Avatar area — shown for voice calls or before video connects */}
        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center">
          {!showRemoteVideo && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {(callState === "calling" || callState === "ringing" || callState === "connecting") && (
                  <>
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" style={{ animationDuration: "2s" }} />
                    <div className="absolute -inset-3 animate-pulse rounded-full border-2 border-primary/30" style={{ animationDuration: "1.5s" }} />
                  </>
                )}
                <div
                  className="relative flex size-24 items-center justify-center rounded-full text-2xl font-bold text-white shadow-2xl ring-4 ring-white/10 md:size-28"
                  style={{ backgroundColor: peerBg }}
                >
                  {peerInitials}
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white">{peerName}</p>
                <p className="mt-1 text-sm text-white/60">
                  {callState === "calling" && "Calling..."}
                  {callState === "ringing" && "Incoming call..."}
                  {callState === "connecting" && "Connecting..."}
                  {callState === "connected" && (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="size-2 animate-pulse rounded-full bg-primary" />
                      Voice call
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Local video PIP — always rendered for video calls so ref is available */}
          {isVideoCall && (
            <div
              className={cn(
                "absolute right-4 bottom-4 z-20 h-36 w-28 overflow-hidden rounded-xl border-2 border-white/20 shadow-2xl md:h-44 md:w-32",
                callState !== "connected" && "hidden",
              )}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "h-full w-full object-cover",
                  isCameraOff && "hidden",
                )}
              />
              {isCameraOff && (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                  <VideoOff className="size-6 text-white/40" strokeWidth={ICON_STROKE} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="relative z-10 shrink-0 border-t border-white/10 bg-zinc-900/80 px-4 py-5 backdrop-blur-sm">
          {callState === "ringing" && incomingCall ? (
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={onReject}
                className="flex size-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                aria-label="Reject call"
              >
                <PhoneOff className="size-6" strokeWidth={ICON_STROKE} />
              </button>
              <div className="text-center">
                <p className="text-sm font-medium text-white">
                  {incomingCall.callerName}
                </p>
                <p className="text-xs text-white/50">
                  {incomingCall.callType === "video" ? "Video" : "Voice"} call
                </p>
              </div>
              <button
                type="button"
                onClick={onAccept}
                className="flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                aria-label="Accept call"
              >
                <PhoneIncoming className="size-6" strokeWidth={ICON_STROKE} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <ControlButton
                active={isMuted}
                onClick={onToggleMute}
                icon={isMuted ? MicOff : Mic}
                label={isMuted ? "Unmute" : "Mute"}
                disabled={callState !== "connected"}
              />
              {isVideoCall && (
                <ControlButton
                  active={isCameraOff}
                  onClick={onToggleCamera}
                  icon={isCameraOff ? VideoOff : Video}
                  label={isCameraOff ? "Turn on camera" : "Turn off camera"}
                  disabled={callState !== "connected"}
                />
              )}
              <ControlButton
                active={isScreenSharing}
                activeColor="primary"
                onClick={onToggleScreenShare}
                icon={MonitorUp}
                label={isScreenSharing ? "Stop sharing" : "Share screen"}
                disabled={callState !== "connected"}
              />
              <button
                type="button"
                onClick={onEnd}
                className="flex size-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                aria-label="End call"
              >
                <PhoneOff className="size-5" strokeWidth={ICON_STROKE} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ControlButton({
  active,
  activeColor = "destructive",
  onClick,
  icon: Icon,
  label,
  disabled,
}: {
  active: boolean;
  activeColor?: "destructive" | "primary";
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-12 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100",
        active
          ? activeColor === "primary"
            ? "bg-primary text-white"
            : "bg-red-500/20 text-red-400"
          : "bg-white/10 text-white hover:bg-white/20",
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="size-5" strokeWidth={ICON_STROKE} />
    </button>
  );
}
