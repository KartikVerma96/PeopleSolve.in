import { io, Socket } from "socket.io-client";

import { API_BASE } from "./api";

let socket: Socket | null = null;

export function getSocket(userId?: string): Socket {
  if (socket?.connected) return socket;

  socket = io(API_BASE, {
    auth: { userId },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { socket };
