"use client";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  if (socket) return socket;

  const url = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:5030";
  const userId = localStorage.getItem("userId") ?? crypto.randomUUID();
  const username = localStorage.getItem("username") ?? "Anonymous";
  localStorage.setItem("userId", userId);

  socket = io(url, {
    auth: { userId, username },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  });

  return socket;
}
