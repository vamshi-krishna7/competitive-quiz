import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { GameEngine } from "./game.js";
import { Leaderboard } from "./leaderboard.js";

const PORT = Number(process.env.PORT ?? 5030);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3030";

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));

const leaderboard = new Leaderboard();

const activeUsernames = new Map<string, string>();

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function isTaken(name: string, userId: string): boolean {
  const owner = activeUsernames.get(normalize(name));
  return owner !== undefined && owner !== userId;
}

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/leaderboard", (_req, res) => res.json(leaderboard.top(10)));
app.get("/username-available", (req, res) => {
  const name = String(req.query.name ?? "").trim();
  if (!name) return res.json({ available: false, reason: "empty" });
  const taken = activeUsernames.has(normalize(name));
  res.json({ available: !taken });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN },
});

const game = new GameEngine();
const ROOM = "quiz";

game.on("winner", (winner) => {
  leaderboard.recordWin(winner.userId, winner.username, winner.solveMs);
  io.to(ROOM).emit("winner_announced", winner);
  io.to(ROOM).emit("leaderboard_update", leaderboard.top(10));
});

game.on("question", (question) => {
  io.to(ROOM).emit("new_question", question);
});

io.on("connection", (socket) => {
  const userId = (socket.handshake.auth?.userId as string) || socket.id;
  const rawUsername = (socket.handshake.auth?.username as string) || "Anonymous";
  let username = rawUsername.trim().slice(0, 24) || "Anonymous";

  if (isTaken(username, userId)) {
    socket.emit("username_taken", { username });
    socket.disconnect(true);
    return;
  }

  activeUsernames.set(normalize(username), userId);
  socket.join(ROOM);

  socket.emit("sync", {
    question: game.getPublicQuestion(),
    winner: game.getWinner(),
    leaderboard: leaderboard.top(10),
  });

  socket.on("submit_answer", (payload: { questionId: string; answer: string }, ack) => {
    const result = game.submit(userId, username, payload.questionId, payload.answer);
    ack?.(result);
  });

  socket.on(
    "set_username",
    (name: string, ack?: (r: { ok: boolean; reason?: string }) => void) => {
      if (typeof name !== "string" || !name.trim()) {
        ack?.({ ok: false, reason: "empty" });
        return;
      }
      const next = name.trim().slice(0, 24);
      if (normalize(next) === normalize(username)) {
        ack?.({ ok: true });
        return;
      }
      if (isTaken(next, userId)) {
        ack?.({ ok: false, reason: "taken" });
        return;
      }
      activeUsernames.delete(normalize(username));
      username = next;
      activeUsernames.set(normalize(username), userId);
      ack?.({ ok: true });
    }
  );

  socket.on("ping_check", (_, ack) => ack?.({ serverTime: Date.now() }));

  socket.on("disconnect", () => {
    if (activeUsernames.get(normalize(username)) === userId) {
      activeUsernames.delete(normalize(username));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[server] listening on :${PORT} (CORS: ${CORS_ORIGIN})`);
});
