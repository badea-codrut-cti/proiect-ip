import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
    Bell,
    User,
    LogOut,
    Trophy,
    Medal,
    ShieldCheck,
    Settings as SettingsIcon,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/context/AuthContext";
import { MainHeader } from "~/components/MainHeader";
import { ThemeToggle } from "~/components/ThemeToggle";
import { apiFetch } from "~/utils/api";

export function meta() {
    return [
        { title: "Badges - Nihongo Count" },
        { name: "description", content: "View all available badges and your progress" },
    ];
}

interface Badge {
    id: string;
    code: string;
    name: string;
    description: string;
    earned_at: string | null;
}

const codeToImageName = (code: string): string => {
    return code.toLowerCase();
};

export default function BadgesPage() {
    const navigate = useNavigate();
    const { user: authUser, logout, loading: authLoading } = useAuth();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                setLoading(true);
                if (authUser) {
                    const data = await apiFetch<Badge[]>(`/api/profiles/badges/user/${authUser.id}`);
                    setBadges(data);
                } else {
                    const data = await apiFetch<Badge[]>("/api/profiles/badges/all");
                    const formattedData = data.map(b => ({ ...b, earned_at: null }));
                    setBadges(formattedData);
                }
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load badges");
                setLoading(false);
            }
        };

        fetchBadges();
    }, [authUser]);

    useEffect(() => {
        if (!authUser) return;

        const fetchNotifications = async () => {
            try {
                const data = await apiFetch<any[]>("/api/notifications");
                setNotifications(data);
                const unread = data.filter(n => !n.is_read).length;
                setUnreadCount(unread);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30 * 1000);
        return () => clearInterval(interval);
    }, [authUser]);

    const handleOpenNotifications = async () => {
        if (isNotificationsOpen) {
            setIsNotificationsOpen(false);
            return;
        }

        setIsNotificationsOpen(true);
        if (unreadCount > 0) {
            try {
                await apiFetch("/api/notifications/mark-read", { method: "POST" });
                setUnreadCount(0);
                const data = await apiFetch<any[]>("/api/notifications");
                setNotifications(data);
            } catch (error) {
                console.error("Failed to mark notifications as read:", error);
            }
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const earnedBadges = badges.filter(b => b.earned_at !== null);
    const lockedBadges = badges.filter(b => b.earned_at === null);

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="text-slate-500">Loading badges...</div>
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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col dark:bg-slate-950 dark:text-slate-50">
            <MainHeader activeNav="badges" />

            <main className="flex-1 bg-slate-50 dark:bg-slate-950">
                <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center justify-center gap-2">
                            <Medal className="h-8 w-8 text-amber-500" />
                            Badges
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            {authUser
                                ? `You have earned ${earnedBadges.length} of ${badges.length} badges`
                                : "Login to track your badge progress"}
                        </p>
                    </div>

                    {authUser && earnedBadges.length > 0 && (
                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-amber-500" />
                                    Earned Badges
                                </CardTitle>
                                <CardDescription>Congratulations on your achievements!</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {earnedBadges.map((badge) => (
                                        <div
                                            key={badge.id}
                                            className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={`/icons/badges/${codeToImageName(badge.code)}.png`}
                                                    alt={badge.name}
                                                    className="h-16 w-16 object-contain"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{badge.name}</h3>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{badge.description}</p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                                                    Earned {new Date(badge.earned_at!).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {lockedBadges.length > 0 && (
                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-slate-400" />
                                    {authUser ? "Locked Badges" : "Available Badges"}
                                </CardTitle>
                                <CardDescription>
                                    {authUser ? "Complete challenges to unlock these badges" : "These badges are available to earn"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {lockedBadges.map((badge) => (
                                        <div
                                            key={badge.id}
                                            className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-60 grayscale"
                                        >
                                            <div className="flex-shrink-0">
                                                <img
                                                    src={`/icons/badges/${codeToImageName(badge.code)}.png`}
                                                    alt={badge.name}
                                                    className="h-16 w-16 object-contain"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{badge.name}</h3>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{badge.description}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 font-medium">
                                                    🔒 Locked
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
