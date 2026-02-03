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
            <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-400" />
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-slate-100">
                            nihongo count
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        <Link to="/" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Home</Link>
                        <Link to="/reviews" className="hover:text-slate-900 transition-colors">Reviews</Link>
                        <Link to="/counters" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Counters</Link>
                        <Link to="/badges" className="text-slate-900 dark:text-slate-100">Badges</Link>
                        <Link to="/leaderboard" className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                            <Trophy className="h-3 w-3" />
                            <span>Leaderboard</span>
                        </Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        {authUser && (
                            <>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={handleOpenNotifications}
                                        className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        aria-label="Notifications"
                                    >
                                        <Bell className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-500 text-white text-[0.65rem] font-bold flex items-center justify-center">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {isNotificationsOpen && (
                                        <div className="absolute right-0 mt-3 w-80 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 z-50 max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                                    No notifications
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                    {notifications.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className={`p-3 text-sm ${!notification.is_read
                                                                ? 'bg-blue-50 dark:bg-slate-800'
                                                                : 'bg-white dark:bg-slate-900'
                                                                }`}
                                                        >
                                                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                                                {notification.message}
                                                            </div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                                {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        {authUser && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileOpen((o) => !o)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                                >
                                    <User className="h-4 w-4" />
                                </button>
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-3 w-64 rounded-xl border border-slate-200 bg-white py-3 shadow-lg text-left dark:border-slate-700 dark:bg-slate-900 z-50">
                                        <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                                            <div className="text-xs font-semibold text-slate-900 dark:text-slate-50">{authUser.username}</div>
                                            <div className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-300">Level {Math.floor((authUser.xp || 0) / 100)}</div>
                                        </div>
                                        <div className="mt-2 flex flex-col gap-1 px-1 text-sm">
                                            <Link to={`/profile/${authUser.id}`} className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-100">
                                                <User className="h-4 w-4" />
                                                <span className="text-xs">Profile</span>
                                            </Link>
                                            <Link to="/settings" className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-100">
                                                <SettingsIcon className="h-4 w-4" />
                                                <span className="text-xs">Settings</span>
                                            </Link>
                                            <button onClick={handleLogout} className="mt-1 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950 w-full text-left">
                                                <LogOut className="h-4 w-4" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {!authUser && (
                            <Button onClick={() => navigate("/login")} size="sm">
                                Login
                            </Button>
                        )}
                    </div>
                </div>
            </header>

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
