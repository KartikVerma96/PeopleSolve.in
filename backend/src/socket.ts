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

    if (userId) {
      onlineUsers.add(userId);
      socket.join(`user:${userId}`);
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

    // --- Disconnect ---
    socket.on("disconnect", () => {
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

export { io };
