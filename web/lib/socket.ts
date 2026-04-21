"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  const url = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:5030";
  const userId = localStorage.getItem("userId") ?? crypto.randomUUID();
  const username = localStorage.getItem("username") ?? "Anonymous";
  localStorage.setItem("userId", userId);

  if (socket) {
    const auth = socket.auth as { userId?: string; username?: string };
    if (auth?.userId === userId && auth?.username === username) {
      if (!socket.connected && !socket.active) socket.connect();
      return socket;
    }
    socket.disconnect();
    socket = null;
  }

  socket = io(url, {
    auth: { userId, username },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function resetSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
