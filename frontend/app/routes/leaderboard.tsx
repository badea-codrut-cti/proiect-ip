import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
    Trophy,
    Medal,
    Crown,
    Timer,
    Gem,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/context/AuthContext";
import { MainHeader } from "~/components/MainHeader";
import { apiFetch } from "~/utils/api";

export function meta() {
    return [
        { title: "Weekly Leaderboard - Nihongo Count" },
        { name: "description", content: "Compete with other learners in the weekly leaderboard" },
    ];
}

interface LeaderboardUser {
    id: string;
    username: string;
    display_name: string | null;
    points: number;
    rank: number;
    profile_picture_name: string | null;
}

interface LeaderboardResponse {
    week_start: string;
    top_users: LeaderboardUser[];
    user_rank: {
        rank: number | null;
        points: number;
    } | null;
}

interface CountdownTime {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function getNextMonday(): Date {
    const now = new Date();
    const day = now.getDay();
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
}

function calculateCountdown(): CountdownTime {
    const now = new Date();
    const nextMonday = getNextMonday();
    const diff = nextMonday.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
}

function getRankIcon(rank: number) {
    switch (rank) {
        case 1:
            return <Crown className="h-5 w-5 text-yellow-500" />;
        case 2:
            return <Medal className="h-5 w-5 text-slate-400" />;
        case 3:
            return <Medal className="h-5 w-5 text-amber-600" />;
        default:
            return null;
    }
}

function getRankBackgroundClass(rank: number) {
    switch (rank) {
        case 1:
            return "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-300 dark:border-yellow-700";
        case 2:
            return "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-slate-300 dark:border-slate-600";
        case 3:
            return "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-300 dark:border-amber-700";
        default:
            return "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700";
    }
}

export default function LeaderboardPage() {
    const navigate = useNavigate();
    const { user: authUser, loading: authLoading } = useAuth();
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [countdown, setCountdown] = useState<CountdownTime>(calculateCountdown());

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const data = await apiFetch<LeaderboardResponse>("/api/leaderboard/weekly");
                setLeaderboardData(data);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load leaderboard");
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(calculateCountdown());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-slate-500">Loading leaderboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                        <Button className="mt-4 w-full" onClick={() => navigate("/")}>Go Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const topUsers = leaderboardData?.top_users || [];
    const userRank = leaderboardData?.user_rank;
    const userInTop10 = authUser && userRank?.rank && userRank.rank <= 10;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col dark:bg-slate-950 dark:text-slate-50">
            <MainHeader activeNav="leaderboard" />

            <main className="flex-1 bg-slate-50 dark:bg-slate-950">
                <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center justify-center gap-2">
                            <Trophy className="h-8 w-8 text-amber-500" />
                            Weekly Leaderboard
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Compete with other learners and earn weekly badges!
                        </p>
                    </div>

                    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Timer className="h-5 w-5 text-blue-500" />
                                Week Ends In
                            </CardTitle>
                            <CardDescription>The week resets every Monday at midnight</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 justify-center">
                                <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 min-w-[80px]">
                                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                                        {countdown.days}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 uppercase">
                                        Days
                                    </div>
                                </div>
                                <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 min-w-[80px]">
                                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                                        {countdown.hours}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 uppercase">
                                        Hours
                                    </div>
                                </div>
                                <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 min-w-[80px]">
                                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                                        {countdown.minutes}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 uppercase">
                                        Minutes
                                    </div>
                                </div>
                                <div className="flex flex-col items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 min-w-[80px]">
                                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                                        {countdown.seconds}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 uppercase">
                                        Seconds
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Crown className="h-5 w-5 text-amber-500" />
                                Top 10 This Week
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {topUsers.slice(0, 10).map((user) => {
                                    const isCurrentUser = authUser?.id === user.id;
                                    let gemReward = 0;
                                    if (user.rank === 1) gemReward = 500;
                                    else if (user.rank === 2) gemReward = 200;
                                    else if (user.rank === 3) gemReward = 100;

                                    return (
                                        <div
                                            key={user.id}
                                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankBackgroundClass(user.rank)} ${isCurrentUser ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}`}
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-50">
                                                {user.rank <= 3 ? (
                                                    getRankIcon(user.rank)
                                                ) : (
                                                    <span className="text-sm">#{user.rank}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                                                <img
                                                    src={`/icons/profile_pictures/${user.profile_picture_name || 'default'}.png`}
                                                    alt="Avatar"
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
                                                        {user.display_name || user.username}
                                                    </h3>
                                                    {isCurrentUser && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                                    @{user.username}
                                                </p>
                                            </div>

                                            {gemReward > 0 && (
                                                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                                                    <Gem className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">+{gemReward}</span>
                                                </div>
                                            )}

                                            <div className="text-right ml-2">
                                                <div className="text-xl font-bold text-slate-900 dark:text-slate-50">
                                                    {user.points}
                                                </div>
                                                <div className="text-xs text-slate-600 dark:text-slate-400">
                                                    points
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {topUsers.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                        No one has earned points this week yet. Be the first!
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {authUser && userRank && !userInTop10 && userRank.rank && (
                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Your Position</CardTitle>
                                <CardDescription>Keep going to climb the leaderboard!</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 ring-2 ring-blue-500 dark:ring-blue-400">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 font-bold text-blue-700 dark:text-blue-300">
                                        <span className="text-sm">#{userRank.rank}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                                                {authUser.displayName}
                                            </h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                                                You
                                            </span>
                                        </div>

                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-slate-900 dark:text-slate-50">
                                            {userRank.points}
                                        </div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400">
                                            points
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!authUser && (
                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                            <CardContent className="pt-6">
                                <div className="text-center space-y-4">
                                    <p className="text-slate-600 dark:text-slate-400">
                                        Login to see your position on the leaderboard and compete with other learners!
                                    </p>
                                    <Button onClick={() => navigate("/login")} className="w-full sm:w-auto">
                                        Login to Compete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
