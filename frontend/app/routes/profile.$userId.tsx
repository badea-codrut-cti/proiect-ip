import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ActivityCalendar } from "react-activity-calendar";
import {
  Bell,
  User,
  LogOut,
  Target,
  Flame,
  Medal,
  Trophy,
  ShieldCheck,
  Settings as SettingsIcon,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/context/AuthContext";
import { ThemeToggle } from "~/components/ThemeToggle";
import { profileClient } from "~/utils/profileClient";
import { mapRealProfileToUi, computeLevelFromXp } from "~/utils/profileHelpers";
import { apiFetch } from "~/utils/api";
import type { UiProfile } from "~/types/profile";

import avatarImg from "~/assets/avatars/user-default.png";
import badgeFirstSteps from "~/assets/badges/first-steps.png";
import badgeWeekWarrior from "~/assets/badges/week-warrior.png";
import badgeStudyMaster from "~/assets/badges/study-master.png";
import badgePerfectWeek from "~/assets/badges/perfect-week.png";
import badgeTop10 from "~/assets/badges/top-10.png";
import badgeCounterKing from "~/assets/badges/counter-king.png";

export function meta() {
  return [
    { title: "User Profile" },
    { name: "description", content: "View user profile" },
  ];
}

const badgeConfigs = [
  { label: "First Steps", image: badgeFirstSteps },
  { label: "Week Warrior", image: badgeWeekWarrior },
  { label: "Study Master", image: badgeStudyMaster },
  { label: "Perfect Week", image: badgePerfectWeek },
  { label: "Top 10", image: badgeTop10 },
  { label: "Counter King", image: badgeCounterKing },
];

export default function UserProfile() {
  const params = useParams();
  const navigate = useNavigate();
  const { user: authUser, logout, loading: authLoading } = useAuth();
  const userId = params.userId;

  const [uiProfile, setUiProfile] = useState<UiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isOwnProfile = authUser?.id === userId;

  useEffect(() => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    profileClient.getProfile(userId)
      .then((data) => {
        setUiProfile(mapRealProfileToUi(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load profile");
        setLoading(false);
      });
  }, [userId]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30 * 1000);
    return () => clearInterval(interval);
  }, [authUser]);

  const handleOpenNotifications = async () => {
    // Toggle the notifications dropdown
    if (isNotificationsOpen) {
      setIsNotificationsOpen(false);
      return;
    }

    setIsNotificationsOpen(true);
    if (unreadCount > 0) {
      try {
        await apiFetch("/api/notifications/mark-read", { method: "POST" });
        setUnreadCount(0);
        // Refetch to update read status
        const data = await apiFetch<any[]>("/api/notifications");
        setNotifications(data);
      } catch (error) {
        console.error("Failed to mark notifications as read:", error);
      }
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">Loading profile...</div>
      </div>
    );
  }

  if (error || !uiProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "Profile not found"}</p>
            <Button className="mt-4 w-full" onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const xpPercent = uiProfile.nextLevelXp > 0
    ? Math.min(100, Math.round((uiProfile.xp / uiProfile.nextLevelXp) * 100))
    : 0;

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
            <Link to="/badges" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Badges</Link>
            <Link to="/leaderboard" className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <Trophy className="h-3 w-3" />
              <span>Leaderboard</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isOwnProfile && (
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
                              className={`p-3 text-sm ${
                                !notification.is_read
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
            {isOwnProfile && (
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
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-50">{uiProfile.username}</div>
                      <div className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-300">Level {uiProfile.level}</div>
                    </div>
                    <div className="mt-2 flex flex-col gap-1 px-1 text-sm">
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
          </div>
        </div>
      </header>

      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <img src={avatarImg} alt="Avatar" className="h-14 w-14 object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-slate-900 dark:text-slate-50">{uiProfile.username}</h1>
                  {uiProfile.is_admin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[0.65rem] font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                      <ShieldCheck className="h-3 w-3" />
                      ADMIN
                    </span>
                  )}
                  {uiProfile.is_contributor && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                      <Medal className="h-3 w-3" />
                      CONTRIBUTOR
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">Level {uiProfile.level}</div>
                <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-300">
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden max-w-xs">
                    <div className="h-full rounded-full bg-slate-900 dark:bg-slate-50" style={{ width: `${xpPercent}%` }} />
                  </div>
                  <div>{uiProfile.xp}/{uiProfile.nextLevelXp} XP</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
                <Flame className="h-3 w-3" />
                <span>{uiProfile.streakDays} Day Streak</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sky-700 dark:bg-sky-900 dark:text-sky-200">
                <Medal className="h-3 w-3" />
                <span>{uiProfile.badgesCount} Badges</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                <Target className="h-3 w-3" />
                <span>{uiProfile.reviewsCount} Reviews</span>
              </div>
            </div>
          </section>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Contribution Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center overflow-x-auto pb-6">
              {Object.keys(uiProfile.reviewHistory).length > 0 ? (
                <ActivityCalendar
                  data={Object.entries(uiProfile.reviewHistory).map(([date, count]) => ({
                    date,
                    count: count as number,
                    level: Math.min(4, count as number) as 0 | 1 | 2 | 3 | 4,
                  }))}
                  theme={{
                    light: ["#f0fdf4", "#dcfce7", "#86efac", "#22c55e", "#15803d"],
                    dark: ["#022c22", "#064e3b", "#059669", "#10b981", "#34d399"],
                  }}
                  labels={{ totalCount: "{{count}} reviews in the last year" }}
                  fontSize={12}
                  blockSize={12}
                  blockMargin={4}
                />
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  No activity recorded in the last year.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Earned Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                {badgeConfigs.map((badge, index) => (
                  <div key={badge.label} className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${index < uiProfile.badgesCount ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'opacity-40 grayscale border-transparent'}`}>
                    <img src={badge.image} alt={badge.label} className="h-10 w-10 object-contain" />
                    <span className="text-[0.65rem] font-medium text-center">{badge.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
