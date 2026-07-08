import { io, Socket } from "socket.io-client";

import { API_BASE } from "./api";

let socket: Socket | null = null;
let currentUserId: string | undefined;

/**
 * Returns the singleton socket, creating or reconnecting if needed.
 * IMPORTANT: Always pass userId when available — anonymous sockets can't receive calls.
 */
export function getSocket(userId?: string): Socket {
  // Case 1: socket exists but was anonymous, and we now have a real userId → recreate
  if (socket && userId && !currentUserId) {
    socket.disconnect();
    socket = null;
  }

  // Case 2: userId changed → recreate
  if (socket && userId && currentUserId && userId !== currentUserId) {
    socket.disconnect();
    socket = null;
  }

  // Case 3: no socket yet → create
  if (!socket) {
    currentUserId = userId;
    socket = io(API_BASE, {
      auth: { userId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    // Suppress connection errors — don't let them crash the app
    socket.on("connect_error", (err) => {
      console.warn("[Socket] connection error:", err.message);
    });

    socket.on("error", (err) => {
      console.warn("[Socket] error:", err);
    });

    return socket;
  }

  // Case 4: socket exists but disconnected → reconnect
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

/**
 * Full disconnect — only call on sign out.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = undefined;
  }
}

export { socket };
