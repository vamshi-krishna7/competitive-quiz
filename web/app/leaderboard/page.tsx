import Link from "next/link";

type Entry = {
  userId: string;
  username: string;
  wins: number;
  bestSolveMs: number;
  totalSolveMs: number;
  lastWinAt: number;
};

async function getLeaderboard(): Promise<Entry[]> {
  const url = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:5030";
  try {
    const res = await fetch(`${url}/leaderboard`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function LeaderboardPage() {
  const entries = await getLeaderboard();

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Leaderboard</h1>
        <Link href="/" className="text-accent-link hover:underline">← Home</Link>
      </div>

      {entries.length === 0 ? (
        <p className="text-text-secondary">No wins recorded yet. Be the first!</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-text-secondary border-b border-border">
              <th className="py-2">#</th>
              <th>Player</th>
              <th className="text-right">Wins</th>
              <th className="text-right">Best (ms)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.userId} className="border-b border-border/60 text-text-primary">
                <td className="py-2">{i + 1}</td>
                <td>{e.username}</td>
                <td className="text-right">{e.wins}</td>
                <td className="text-right">{e.bestSolveMs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
