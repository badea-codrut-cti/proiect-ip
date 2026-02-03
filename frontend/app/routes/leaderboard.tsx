import { useEffect, useState } from "react";
import { MainHeader } from "~/components/MainHeader";
import { apiFetch } from "~/utils/api";
import { useAuth } from "~/context/AuthContext";

interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string;
  points: number;
  rank: number;
}

interface LeaderboardData {
  week_start: string;
  top_users: LeaderboardEntry[];
  user_rank: {
    rank: number | null;
    points: number;
  };
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const result = await apiFetch<LeaderboardData>("/api/leaderboard/weekly");
        
        if (result.user_rank.rank === null && user) {
          const isUserInTopUsers = result.top_users.some(entry => entry.id === user.id);
          if (!isUserInTopUsers) {
            const userEntry: LeaderboardEntry = {
              id: user.id,
              username: user.displayName,
              display_name: user.displayName,
              points: result.user_rank.points,
              rank: result.top_users.length + 1
            };
            result.top_users.push(userEntry);
          }
        }
        
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <MainHeader activeNav={undefined} />

      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Weekly Leaderboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Top performers this week
        </p>

        {loading && (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">Loading leaderboard...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {data.user_rank && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">YOUR RANK</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {data.user_rank.rank ? `#${data.user_rank.rank}` : "Unranked"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600 dark:text-blue-400">Points</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                      {data.user_rank.points}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                        User
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_users.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                              index === 0
                                ? "bg-yellow-400 text-yellow-900"
                                : index === 1
                                  ? "bg-gray-300 text-gray-900"
                                  : index === 2
                                    ? "bg-orange-400 text-orange-900"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {entry.rank}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                          <div>
                            <p className="font-medium">{entry.display_name || entry.username}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">@{entry.username}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {entry.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.top_users.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <p className="text-slate-500 dark:text-slate-400">No leaderboard data yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
