import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Trophy } from "lucide-react";

import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/context/AuthContext";
import { leaderboardClient, type WeeklyLeaderboardResponse } from "~/utils/leaderboardClient";

export function meta({}) {
  return [
    { title: "Leaderboard – Nihongo Count" },
    { name: "description", content: "Weekly leaderboard and your ranking." },
  ];
}

function formatWeekStart(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function medalForRank(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();

  const [data, setData] = useState<WeeklyLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const myId = authUser?.id ?? null;

  const myRow = useMemo(() => {
    if (!data || !myId) return null;
    return data.top_users.find((u) => u.id === myId) ?? null;
  }, [data, myId]);

  const displayName = (u: { display_name: string | null; username: string }) =>
    (u.display_name && u.display_name.trim()) || u.username;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await leaderboardClient.weekly();
      setData(resp);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leaderboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col dark:bg-slate-950 dark:text-slate-50">
      <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-slate-100">
              nihongo count
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Home
            </Link>
            <Link to="/reviews" className="hover:text-slate-900 transition-colors">
              Reviews
            </Link>
            <Link to="/counters" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Counters
            </Link>
            <Link to="/badges" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Badges
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-1 text-slate-900 dark:text-slate-100"
            >
              <Trophy className="h-3 w-3" />
              <span>Leaderboard</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="outline" className="text-xs">
              <Link to="/profile">Profile</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-2 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <span className="text-lg">←</span>
            <span>Back to Dashboard</span>
          </button>

          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Weekly leaderboard
                </h1>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Week starting{" "}
                  <span className="font-medium">
                    {data ? formatWeekStart(data.week_start) : "—"}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={load}
                className="text-[0.7rem] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                title="Refresh"
              >
                Refresh
              </button>
            </div>

            {loading && (
              <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">Loading…</div>
            )}

            {error && !loading && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            {data && !loading && !error && (
              <>
                {/* Your rank card */}
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Your standing
                  </div>

                  {!authLoading && !authUser && (
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      Log in to see your personal rank.
                    </div>
                  )}

                  {authUser && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-700 dark:text-slate-200">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400">Rank</span>
                        <span className="font-semibold">
                          {data.user_rank?.rank ?? "—"}
                        </span>
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
                        <span className="text-slate-500 dark:text-slate-400">Points</span>
                        <span className="font-semibold">
                          {data.user_rank?.points ?? 0}
                        </span>
                      </span>

                      {myRow && (
                        <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                          You are in the top 20 this week 🎉
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Table */}
                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950">
                      <tr className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        <th className="px-4 py-3 w-16">Rank</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3 w-28 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900">
                      {data.top_users.map((u) => {
                        const isMe = myId && u.id === myId;
                        return (
                          <tr
                            key={u.id}
                            className={
                              "border-t border-slate-100 dark:border-slate-800 " +
                              (isMe ? "bg-emerald-50/60 dark:bg-emerald-950/40" : "")
                            }
                          >
                            <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                              <span className="mr-2">{medalForRank(u.rank)}</span>
                              {u.rank}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-slate-900 dark:text-slate-50">
                                {displayName(u)}
                                {isMe && (
                                  <span className="ml-2 text-[0.7rem] text-emerald-700 dark:text-emerald-300">
                                    (you)
                                  </span>
                                )}
                              </div>
                              <div className="text-[0.7rem] text-slate-400 dark:text-slate-500">
                                @{u.username}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-50">
                              {u.points}
                            </td>
                          </tr>
                        );
                      })}
                      {data.top_users.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                            No leaderboard data yet for this week.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
