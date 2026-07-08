import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";

import { prisma } from "./lib/prisma.js";

let io: Server;

/** Connected user IDs for presence tracking. */
const onlineUsers = new Set<string>();

export function initSocket(httpServer: HttpServer, corsOrigin: string) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin, methods: ["GET", "POST"] },
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.auth.userId as string | undefined;

    console.log(`[Socket] connected: ${socket.id} | userId: ${userId ?? "anonymous"}`);

    if (userId) {
      onlineUsers.add(userId);
      socket.join(`user:${userId}`);
      console.log(`[Socket] ${userId} joined room user:${userId}`);
    } else {
      console.warn(`[Socket] anonymous connection — call events won't work`);
    }

    broadcastPresence();

    // --- Feed room (all clients see new doubts) ---
    socket.join("feed");

    // --- Join a thread room for real-time chat ---
    socket.on("thread:join", (threadId: string) => {
      socket.join(`thread:${threadId}`);
    });

    socket.on("thread:leave", (threadId: string) => {
      socket.leave(`thread:${threadId}`);
    });

    // --- Chat message via socket (alternative to REST POST) ---
    socket.on(
      "message:send",
      async (data: { threadId: string; senderId: string; body: string }) => {
        try {
          const { threadId, senderId, body } = data;
          if (!threadId || !senderId || !body?.trim()) return;

          // Verify membership
          const member = await prisma.threadMember.findUnique({
            where: { threadId_userId: { threadId, userId: senderId } },
          });
          if (!member) return;

          const message = await prisma.message.create({
            data: { threadId, senderId, body: body.trim() },
            include: {
              sender: { select: { id: true, name: true, image: true } },
            },
          });

          await prisma.thread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() },
          });

          const payload = {
            id: message.id,
            threadId: message.threadId,
            senderId: message.senderId,
            senderName: message.sender.name,
            senderImage: message.sender.image,
            body: message.body,
            createdAt: message.createdAt.toISOString(),
          };

          // Broadcast to everyone in the thread room
          io.to(`thread:${threadId}`).emit("message:new", payload);
        } catch (e) {
          console.error("message:send error", e);
        }
      },
    );

    // --- Typing indicator ---
    socket.on(
      "typing:start",
      (data: { threadId: string; userName: string }) => {
        socket
          .to(`thread:${data.threadId}`)
          .emit("typing:update", { userName: data.userName, typing: true });
      },
    );

    socket.on(
      "typing:stop",
      (data: { threadId: string; userName: string }) => {
        socket
          .to(`thread:${data.threadId}`)
          .emit("typing:update", { userName: data.userName, typing: false });
      },
    );

    // --- Whiteboard real-time sync ---

    // Join whiteboard room
    socket.on("wb:join", (threadId: string) => {
      socket.join(`wb:${threadId}`);
    });

    socket.on("wb:leave", (threadId: string) => {
      socket.leave(`wb:${threadId}`);
    });

    // Open/close whiteboard — notify the other user in the thread
    socket.on("wb:open", (data: { threadId: string }) => {
      socket.to(`thread:${data.threadId}`).emit("wb:opened", { userId });
    });

    socket.on("wb:close", (data: { threadId: string }) => {
      socket.to(`thread:${data.threadId}`).emit("wb:closed", { userId });
    });

    // Stroke drawn — relay to other user
    socket.on(
      "wb:stroke",
      (data: { threadId: string; stroke: unknown }) => {
        socket.to(`wb:${data.threadId}`).emit("wb:stroke", data.stroke);
      },
    );

    // Text added
    socket.on(
      "wb:text",
      (data: { threadId: string; text: unknown }) => {
        socket.to(`wb:${data.threadId}`).emit("wb:text", data.text);
      },
    );

    // Shape added
    socket.on(
      "wb:shape",
      (data: { threadId: string; shape: unknown }) => {
        socket.to(`wb:${data.threadId}`).emit("wb:shape", data.shape);
      },
    );

    // Undo action
    socket.on(
      "wb:undo",
      (data: { threadId: string; userId: string }) => {
        socket.to(`wb:${data.threadId}`).emit("wb:undo", { userId: data.userId });
      },
    );

    // Redo action
    socket.on(
      "wb:redo",
      (data: { threadId: string; userId: string }) => {
        socket.to(`wb:${data.threadId}`).emit("wb:redo", { userId: data.userId });
      },
    );

    // Clear all
    socket.on(
      "wb:clear",
      (data: { threadId: string }) => {
        socket.to(`wb:${data.threadId}`).emit("wb:clear");
      },
    );

    // Grid mode change
    socket.on(
      "wb:grid",
      (data: { threadId: string; gridMode: string }) => {
        socket.to(`wb:${data.threadId}`).emit("wb:grid", { gridMode: data.gridMode });
      },
    );

    // Cursor position — lightweight, high frequency
    socket.on(
      "wb:cursor",
      (data: { threadId: string; x: number; y: number; userName: string }) => {
        socket.to(`wb:${data.threadId}`).emit("wb:cursor", {
          x: data.x,
          y: data.y,
          userName: data.userName,
          userId,
        });
      },
    );

    // --- WebRTC signaling (1:1 voice/video/screen share) ---

    // Caller initiates — notify the other user
    socket.on(
      "call:initiate",
      (data: {
        threadId: string;
        targetUserId: string;
        callerName: string;
        callType: "voice" | "video";
      }) => {
        // Check if target user is actually connected
        const targetRoom = io.sockets.adapter.rooms.get(`user:${data.targetUserId}`);
        console.log(`[Call] ${userId} calling ${data.targetUserId} | type: ${data.callType} | target online: ${!!targetRoom} | target sockets: ${targetRoom?.size ?? 0}`);

        io.to(`user:${data.targetUserId}`).emit("call:incoming", {
          threadId: data.threadId,
          callerId: userId,
          callerName: data.callerName,
          callType: data.callType,
        });
      },
    );

    // Callee accepts → notify ONLY the caller
    socket.on(
      "call:accept",
      (data: { threadId: string; targetUserId: string }) => {
        console.log(`[Call] ${userId} accepted → notifying caller ${data.targetUserId}`);
        io.to(`user:${data.targetUserId}`).emit("call:accepted", {
          threadId: data.threadId,
          acceptedBy: userId,
        });
      },
    );

    // Callee rejects
    socket.on(
      "call:reject",
      (data: { threadId: string; targetUserId: string }) => {
        io.to(`user:${data.targetUserId}`).emit("call:rejected", {
          threadId: data.threadId,
          rejectedBy: userId,
        });
      },
    );

    // WebRTC offer
    socket.on(
      "call:offer",
      (data: { targetUserId: string; offer: RTCSessionDescriptionInit }) => {
        io.to(`user:${data.targetUserId}`).emit("call:offer", {
          from: userId,
          offer: data.offer,
        });
      },
    );

    // WebRTC answer
    socket.on(
      "call:answer",
      (data: { targetUserId: string; answer: RTCSessionDescriptionInit }) => {
        io.to(`user:${data.targetUserId}`).emit("call:answer", {
          from: userId,
          answer: data.answer,
        });
      },
    );

    // ICE candidate exchange
    socket.on(
      "call:ice-candidate",
      (data: { targetUserId: string; candidate: RTCIceCandidateInit }) => {
        io.to(`user:${data.targetUserId}`).emit("call:ice-candidate", {
          from: userId,
          candidate: data.candidate,
        });
      },
    );

    // End call
    socket.on(
      "call:end",
      (data: { targetUserId: string; threadId: string }) => {
        io.to(`user:${data.targetUserId}`).emit("call:ended", {
          threadId: data.threadId,
          endedBy: userId,
        });
      },
    );

    // --- Disconnect ---
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] disconnected: ${socket.id} | userId: ${userId ?? "anonymous"} | reason: ${reason}`);
      if (userId) {
        onlineUsers.delete(userId);
      }
      broadcastPresence();
    });
  });

  return io;
}

function broadcastPresence() {
  if (!io) return;
  io.to("feed").emit("presence", {
    totalOnline: Math.max(onlineUsers.size, 1),
    activeHelpers: Math.max(Math.floor(onlineUsers.size * 0.4), 0),
  });
}

/** Emit a new doubt to all feed subscribers. Called from REST route. */
export function emitNewDoubt(doubt: Record<string, unknown>) {
  if (!io) return;
  io.to("feed").emit("doubt:new", doubt);
}

/** Emit doubt update (helper count, resolved, etc.). */
export function emitDoubtUpdate(doubtId: string, patch: Record<string, unknown>) {
  if (!io) return;
  io.to("feed").emit("doubt:update", { id: doubtId, ...patch });
}

/** Notify a specific user (e.g. "someone is helping your doubt"). */
export function emitToUser(userId: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/** Broadcast to everyone in a thread room (used by REST message endpoint). */
export function emitToThread(threadId: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`thread:${threadId}`).emit(event, data);
}

export { io };
