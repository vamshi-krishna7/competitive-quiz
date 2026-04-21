"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:5030";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("username") : null;
    if (saved) setUsername(saved);

    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "username_taken") {
      setError("That username is already in use. Try another.");
    }
  }, []);

  async function handleJoin(e: React.MouseEvent) {
    e.preventDefault();
    const clean = username.trim().slice(0, 24);

    if (!clean) {
      setError("Please enter a username.");
      return;
    }

    setError(null);
    setChecking(true);

    try {
      const res = await fetch(`${WS_URL}/username-available?name=${encodeURIComponent(clean)}`);
      const { available } = await res.json();
      if (!available) {
        setError("That username is already in use. Try another.");
        setChecking(false);
        return;
      }
    } catch {
      setError("Couldn't reach the server. Try again.");
      setChecking(false);
      return;
    }

    localStorage.setItem("username", clean);
    if (!localStorage.getItem("userId")) {
      localStorage.setItem("userId", crypto.randomUUID());
    }
    router.push("/quiz");
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
          onChange={(e) => {
            setUsername(e.target.value);
            if (error) setError(null);
          }}
          placeholder="e.g. mathwiz"
          className="w-full bg-bg-surface border border-border rounded-lg px-4 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-primary"
        />
        {error && <p className="text-sm text-warning">{error}</p>}
      </section>

      <section className="flex gap-3">
        <button
          onClick={handleJoin}
          disabled={checking}
          className="bg-accent-primary hover:brightness-125 disabled:opacity-50 px-5 py-2.5 rounded-lg font-medium text-text-on-accent transition"
        >
          {checking ? "Checking…" : "Join Quiz"}
        </button>
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
