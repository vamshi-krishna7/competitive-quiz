export type LeaderboardEntry = {
  userId: string;
  username: string;
  wins: number;
  totalSolveMs: number;
  bestSolveMs: number;
  lastWinAt: number;
};

export class Leaderboard {
  private entries = new Map<string, LeaderboardEntry>();

  recordWin(userId: string, username: string, solveMs: number) {
    const existing = this.entries.get(userId);
    if (existing) {
      existing.username = username;
      existing.wins += 1;
      existing.totalSolveMs += solveMs;
      existing.bestSolveMs = Math.min(existing.bestSolveMs, solveMs);
      existing.lastWinAt = Date.now();
    } else {
      this.entries.set(userId, {
        userId,
        username,
        wins: 1,
        totalSolveMs: solveMs,
        bestSolveMs: solveMs,
        lastWinAt: Date.now(),
      });
    }
  }

  top(n = 10): LeaderboardEntry[] {
    return [...this.entries.values()]
      .sort((a, b) => b.wins - a.wins || a.bestSolveMs - b.bestSolveMs)
      .slice(0, n);
  }
}
