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

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/leaderboard", (_req, res) => res.json(leaderboard.top(10)));

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
  let username = (socket.handshake.auth?.username as string) || "Anonymous";

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

  socket.on("set_username", (name: string) => {
    if (typeof name === "string" && name.trim()) username = name.trim().slice(0, 24);
  });

  socket.on("ping_check", (_, ack) => ack?.({ serverTime: Date.now() }));
});

server.listen(PORT, () => {
  console.log(`[server] listening on :${PORT} (CORS: ${CORS_ORIGIN})`);
});
