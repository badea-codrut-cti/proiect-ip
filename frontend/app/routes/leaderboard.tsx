import { useEffect, useState } from "react";
import { MainHeader } from "~/components/MainHeader";
import { apiFetch } from "~/utils/api";

type LeaderRow = {
  id: string;
  username: string;
  display_name: string | null;
  points: number;
  rank: number;
};

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topUsers, setTopUsers] = useState<LeaderRow[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number | null; points: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{
          week_start: string;
          top_users: LeaderRow[];
          user_rank: { rank: number | null; points: number } | null;
        }>("/api/leaderboard/weekly");

        if (cancelled) return;
        setTopUsers(data.top_users || []);
        setUserRank(data.user_rank || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <MainHeader activeNav="leaderboard" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-slate-500 dark:text-slate-400">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <MainHeader activeNav="leaderboard" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-red-600 dark:text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <MainHeader activeNav="leaderboard" />

      <main className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Weekly Leaderboard</h1>
          {userRank && (
            <div className="text-sm text-slate-500 dark:text-slate-300">
              Your rank: {userRank.rank ?? "—"} • {userRank.points} pts
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="text-[0.75rem] uppercase text-slate-500 dark:text-slate-300 tracking-wider">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u) => (
                <tr key={u.id} className="border-t last:border-b border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-3 w-16 font-medium text-slate-700 dark:text-slate-200">{u.rank}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{u.display_name || u.username}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{u.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
