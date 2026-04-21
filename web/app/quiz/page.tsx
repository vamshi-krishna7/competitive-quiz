"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

type Question = { id: string; prompt: string; createdAt: number };
type Winner = { userId: string; username: string; solveMs: number };
type Entry = { userId: string; username: string; wins: number; bestSolveMs: number };

type SubmitResult =
  | { status: "correct"; winner: Winner }
  | { status: "stale" | "rate_limited" | "wrong" | "late" };

export default function QuizPage() {
  const [connected, setConnected] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [leaderboard, setLeaderboard] = useState<Entry[]>([]);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ping, setPing] = useState<number | null>(null);
  const [userId, setUserId] = useState<string>("");

  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId") ?? "");
    const s = getSocket();
    socketRef.current = s;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onSync = (payload: { question: Question; winner: Winner | null; leaderboard: Entry[] }) => {
      setQuestion(payload.question);
      setWinner(payload.winner);
      setLeaderboard(payload.leaderboard);
      setAnswer("");
      setFeedback(null);
    };
    const onNewQuestion = (q: Question) => {
      setQuestion(q);
      setWinner(null);
      setAnswer("");
      setFeedback(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    };
    const onWinner = (w: Winner) => setWinner(w);
    const onLeaderboard = (lb: Entry[]) => setLeaderboard(lb);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("sync", onSync);
    s.on("new_question", onNewQuestion);
    s.on("winner_announced", onWinner);
    s.on("leaderboard_update", onLeaderboard);

    const pingTimer = setInterval(() => {
      const start = performance.now();
      s.timeout(3000).emit("ping_check", null, (err: Error | null) => {
        if (!err) setPing(Math.round(performance.now() - start));
      });
    }, 5000);

    return () => {
      clearInterval(pingTimer);
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("sync", onSync);
      s.off("new_question", onNewQuestion);
      s.off("winner_announced", onWinner);
      s.off("leaderboard_update", onLeaderboard);
    };
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const s = socketRef.current;
    if (!s || !question || !answer.trim() || winner || submitting) return;

    setSubmitting(true);
    setFeedback("Submitting…");

    s.timeout(4000).emit(
      "submit_answer",
      { questionId: question.id, answer },
      (err: Error | null, result: SubmitResult) => {
        setSubmitting(false);
        if (err) {
          setFeedback("Network slow — try again.");
          return;
        }
        if (result.status === "correct") setFeedback("✓ Correct! You win this round.");
        else if (result.status === "wrong") setFeedback("Not quite — try again.");
        else if (result.status === "late") setFeedback("Someone beat you to it.");
        else if (result.status === "stale") setFeedback("Question already changed.");
        else if (result.status === "rate_limited") setFeedback("Slow down a bit.");
        if (result.status === "wrong" || result.status === "rate_limited") {
          setAnswer("");
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }
    );
  }

  const winnerIsMe = winner && winner.userId === userId;

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <Link href="/" className="text-accent-secondary hover:underline">← Home</Link>
        <div className="flex items-center gap-3 text-text-secondary">
          <span className={connected ? "text-accent-secondary" : "text-accent-primary"}>
            ● {connected ? "Connected" : "Reconnecting…"}
          </span>
          {ping !== null && <span>{ping}ms</span>}
        </div>
      </div>

      <div className="bg-bg-surface border border-border rounded-2xl p-8 space-y-6">
        <div className="text-xs uppercase tracking-wider text-text-secondary">Current problem</div>

        {question ? (
          <div className="text-5xl font-semibold text-center py-6 text-text-primary">{question.prompt} = ?</div>
        ) : (
          <div className="text-center text-text-secondary py-6">Loading…</div>
        )}

        <form onSubmit={submit} className="flex gap-2">
          <input
            ref={inputRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={!!winner || submitting || !connected}
            autoFocus
            inputMode="numeric"
            placeholder="Your answer"
            className="flex-1 bg-bg-primary border border-border rounded-lg px-4 py-3 text-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!!winner || submitting || !connected || !answer.trim()}
            className="bg-accent-primary hover:brightness-125 disabled:opacity-40 px-6 py-3 rounded-lg font-medium text-text-on-accent transition"
          >
            Submit
          </button>
        </form>

        {feedback && <div className="text-sm text-text-secondary">{feedback}</div>}

        {winner && (
          <div
            className={`rounded-lg p-4 text-center border ${
              winnerIsMe
                ? "bg-accent-primary/10 border-accent-primary"
                : "bg-bg-primary border-border"
            }`}
          >
            <div className="text-sm text-text-secondary">Winner</div>
            <div className="text-xl font-semibold mt-1 text-text-primary">
              {winnerIsMe ? "You!" : winner.username} — {winner.solveMs}ms
            </div>
            <div className="text-xs text-text-secondary mt-2">Next problem in a moment…</div>
          </div>
        )}
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-text-primary">Top players</h2>
        {leaderboard.length === 0 ? (
          <p className="text-text-secondary text-sm">No wins yet.</p>
        ) : (
          <ol className="space-y-1 text-sm">
            {leaderboard.map((e, i) => (
              <li key={e.userId} className="flex justify-between border-b border-border/60 py-1.5 text-text-primary">
                <span>
                  <span className="text-text-secondary mr-2">{i + 1}.</span>
                  {e.username}
                </span>
                <span className="text-text-secondary">
                  {e.wins} win{e.wins === 1 ? "" : "s"} · best {e.bestSolveMs}ms
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
