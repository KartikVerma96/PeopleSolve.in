"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

export type CallState =
  | "idle"
  | "calling"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended";

export type CallType = "voice" | "video";

type UseWebRTCOptions = {
  userId: string | undefined;
  userName: string;
  threadId: string | undefined;
  targetUserId: string | undefined;
};

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC({
  userId,
  userName,
  threadId,
  targetUserId,
}: UseWebRTCOptions) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType>("voice");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    callType: CallType;
    threadId: string;
  } | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Refs for stable access in socket callbacks
  const callStateRef = useRef<CallState>("idle");
  const callTypeRef = useRef<CallType>("voice");
  const targetUserIdRef = useRef(targetUserId);
  const roleRef = useRef<"caller" | "callee" | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const pendingOffer = useRef<{ from: string; offer: RTCSessionDescriptionInit } | null>(null);

  callStateRef.current = callState;
  callTypeRef.current = callType;
  targetUserIdRef.current = targetUserId;

  const attachRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
  }, []);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    localStreamRef.current = null;
    screenStreamRef.current = null;
    pcRef.current = null;
    pendingCandidates.current = [];
    pendingOffer.current = null;
    roleRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
  }, []);

  const getMedia = useCallback(async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    localStreamRef.current = stream;
    if (localVideoRef.current && type === "video") {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, []);

  const createPC = useCallback(
    (stream: MediaStream) => {
      if (pcRef.current) pcRef.current.close();

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      const remoteStream = new MediaStream();

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate && targetUserIdRef.current && userId) {
          getSocket(userId).emit("call:ice-candidate", {
            targetUserId: targetUserIdRef.current,
            candidate: e.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (e) => {
        e.streams[0]?.getTracks().forEach((track) => {
          if (!remoteStream.getTracks().find((t) => t.id === track.id)) {
            remoteStream.addTrack(track);
          }
        });
        attachRemoteStream(remoteStream);
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log("[WebRTC] ICE:", state);
        if (state === "connected" || state === "completed") {
          setCallState("connected");
        }
        if (state === "failed" || state === "disconnected") {
          setTimeout(() => {
            if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
              cleanup();
              setCallState("ended");
              setTimeout(() => setCallState("idle"), 2000);
            }
          }, 3000);
        }
      };

      // Process any offer that arrived before PC was ready
      if (pendingOffer.current && roleRef.current === "callee") {
        const { from, offer } = pendingOffer.current;
        pendingOffer.current = null;
        console.log("[WebRTC] processing queued offer");
        (async () => {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const candidates = [...pendingCandidates.current];
          pendingCandidates.current = [];
          for (const c of candidates) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (userId) {
            getSocket(userId).emit("call:answer", { targetUserId: from, answer });
          }
        })();
      }

      return pc;
    },
    [userId, attachRemoteStream, cleanup],
  );

  const flushCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc?.remoteDescription) return;
    const queued = [...pendingCandidates.current];
    pendingCandidates.current = [];
    for (const c of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch { /* ignore */ }
    }
  }, []);

  // ===== ACTIONS =====

  const startCall = useCallback(
    (type: CallType) => {
      if (!userId || !targetUserId || !threadId) return;
      if (callStateRef.current !== "idle") return;

      roleRef.current = "caller";
      callStateRef.current = "calling";
      setCallType(type);
      setCallState("calling");

      console.log("[WebRTC] initiating", type, "call to", targetUserId);
      getSocket(userId).emit("call:initiate", {
        threadId,
        targetUserId,
        callerName: userName,
        callType: type,
      });
    },
    [userId, targetUserId, threadId, userName],
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall || !userId) return;

    const type = incomingCall.callType;
    roleRef.current = "callee";
    callStateRef.current = "connecting";
    setCallType(type);
    setCallState("connecting");
    setIncomingCall(null);

    try {
      // Get media + create PC FIRST, before telling the caller
      console.log("[WebRTC] accepting call, getting media...");
      const stream = await getMedia(type);
      createPC(stream);
      console.log("[WebRTC] callee PC ready, notifying caller...");

      // NOW tell the caller we're ready — they will send the offer
      getSocket(userId).emit("call:accept", {
        threadId: incomingCall.threadId,
        targetUserId: incomingCall.callerId,
      });
    } catch {
      cleanup();
      callStateRef.current = "idle";
      setCallState("idle");
    }
  }, [incomingCall, userId, getMedia, createPC, cleanup]);

  const rejectCall = useCallback(() => {
    if (!incomingCall || !userId) return;
    getSocket(userId).emit("call:reject", {
      threadId: incomingCall.threadId,
      targetUserId: incomingCall.callerId,
    });
    setIncomingCall(null);
    callStateRef.current = "idle";
    setCallState("idle");
  }, [incomingCall, userId]);

  const endCall = useCallback(() => {
    if (userId && targetUserIdRef.current) {
      getSocket(userId).emit("call:end", {
        targetUserId: targetUserIdRef.current,
        threadId,
      });
    }
    cleanup();
    callStateRef.current = "ended";
    setCallState("ended");
    setTimeout(() => {
      callStateRef.current = "idle";
      setCallState("idle");
    }, 2000);
  }, [userId, threadId, cleanup]);

  const toggleMute = useCallback(() => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
  }, []);

  const toggleCamera = useCallback(() => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsCameraOff(!t.enabled); }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const vt = localStreamRef.current?.getVideoTracks()[0];
      if (vt) {
        const s = pc.getSenders().find((s) => s.track?.kind === "video");
        if (s) await s.replaceTrack(vt);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screen;
        const st = screen.getVideoTracks()[0];
        if (st) {
          const s = pc.getSenders().find((s) => s.track?.kind === "video");
          if (s) await s.replaceTrack(st);
          st.onended = () => toggleScreenShare();
        }
        setIsScreenSharing(true);
      } catch { /* cancelled */ }
    }
  }, [isScreenSharing]);

  // ===== SOCKET LISTENERS =====
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket(userId);

    // --- INCOMING (only for callee, only when idle) ---
    const onIncoming = (data: {
      threadId: string;
      callerId: string;
      callerName: string;
      callType: CallType;
    }) => {
      // GUARD: only accept if truly idle
      if (callStateRef.current !== "idle") {
        console.log("[WebRTC] ignoring incoming — state:", callStateRef.current);
        socket.emit("call:reject", { threadId: data.threadId, targetUserId: data.callerId });
        return;
      }
      console.log("[WebRTC] incoming from", data.callerName);
      callStateRef.current = "ringing"; // immediate ref update
      setIncomingCall(data);
      setCallState("ringing");
    };

    // --- ACCEPTED (only for CALLER) ---
    const onAccepted = async () => {
      // GUARD: only the caller processes this
      if (roleRef.current !== "caller") {
        console.log("[WebRTC] ignoring call:accepted — I'm not the caller");
        return;
      }
      if (callStateRef.current !== "calling") {
        console.log("[WebRTC] ignoring call:accepted — state:", callStateRef.current);
        return;
      }

      console.log("[WebRTC] callee accepted, creating offer...");
      callStateRef.current = "connecting";
      setCallState("connecting");

      try {
        const stream = await getMedia(callTypeRef.current);
        const pc = createPC(stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log("[WebRTC] sending offer");
        socket.emit("call:offer", {
          targetUserId: targetUserIdRef.current,
          offer,
        });
      } catch (err) {
        console.error("[WebRTC] offer failed:", err);
        callStateRef.current = "idle";
        setCallState("idle");
      }
    };

    // --- REJECTED ---
    const onRejected = () => {
      console.log("[WebRTC] call rejected");
      cleanup();
      callStateRef.current = "ended";
      setCallState("ended");
      setTimeout(() => { callStateRef.current = "idle"; setCallState("idle"); }, 2000);
    };

    // --- OFFER (only for CALLEE) ---
    const onOffer = async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      if (roleRef.current !== "callee") {
        console.log("[WebRTC] ignoring offer — I'm not the callee");
        return;
      }
      const pc = pcRef.current;
      if (!pc) {
        // PC isn't ready yet (getMedia still in progress) — queue it
        console.log("[WebRTC] PC not ready, queuing offer");
        pendingOffer.current = data;
        return;
      }

      console.log("[WebRTC] received offer, creating answer...");
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      await flushCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log("[WebRTC] sending answer");
      socket.emit("call:answer", { targetUserId: data.from, answer });
    };

    // --- ANSWER (only for CALLER) ---
    const onAnswer = async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      if (roleRef.current !== "caller") {
        console.log("[WebRTC] ignoring answer — I'm not the caller");
        return;
      }
      const pc = pcRef.current;
      if (!pc) return;

      console.log("[WebRTC] received answer, setting remote desc...");
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      await flushCandidates();
    };

    // --- ICE CANDIDATE ---
    const onIce = async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (!pc || !pc.remoteDescription) {
        pendingCandidates.current.push(data.candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch { /* ignore */ }
    };

    // --- ENDED ---
    const onEnded = () => {
      console.log("[WebRTC] peer ended call");
      cleanup();
      callStateRef.current = "ended";
      setCallState("ended");
      setTimeout(() => { callStateRef.current = "idle"; setCallState("idle"); }, 2000);
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice-candidate", onIce);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice-candidate", onIce);
      socket.off("call:ended", onEnded);
    };
  }, [userId, getMedia, createPC, cleanup, flushCandidates]);

  return {
    callState,
    callType,
    isMuted,
    isCameraOff,
    isScreenSharing,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  };
}
