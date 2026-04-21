"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("username") : null;
    if (saved) setUsername(saved);
  }, []);

  function save() {
    const clean = username.trim().slice(0, 24);
    if (!clean) return;
    localStorage.setItem("username", clean);
    if (!localStorage.getItem("userId")) {
      localStorage.setItem("userId", crypto.randomUUID());
    }
  }

  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-text-primary">Competitive Math Quiz</h1>
        <p className="text-text-secondary mt-2">First player to solve wins the round.</p>
      </header>

      <section className="space-y-3">
        <label className="block text-sm text-text-secondary">Pick a username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onBlur={save}
          placeholder="e.g. mathwiz"
          className="w-full bg-bg-surface border border-border rounded-lg px-4 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-primary"
        />
      </section>

      <section className="flex gap-3">
        <Link
          href="/quiz"
          onClick={save}
          className="bg-accent-primary hover:brightness-125 px-5 py-2.5 rounded-lg font-medium text-text-on-accent transition"
        >
          Join Quiz
        </Link>
        <Link
          href="/leaderboard"
          className="border border-border hover:bg-bg-surface px-5 py-2.5 rounded-lg text-text-primary transition"
        >
          Leaderboard
        </Link>
      </section>
    </main>
  );
}
