import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Bell, User, LogOut, Trophy, ChevronDown, ShieldCheck, FileText, LayoutDashboard, BookOpen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/ThemeToggle";
import { useAuth } from "~/context/AuthContext";
import {
  profileClient,
  type UserProfileResponse,
} from "~/utils/profileClient";
import { apiFetch } from "~/utils/api";
import type { Role, UiUser } from "~/types/auth";

interface NavItem {
  id: string;
  label: string;
  to: string;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { id: "home", label: "HOME", to: "/" },
  { id: "reviews", label: "REVIEWS", to: "/reviews" },
  { id: "counters", label: "COUNTERS", to: "/counters" },
  { id: "badges", label: "BADGES", to: "/badges" },
  { id: "leaderboard", label: "LEADERBOARD", to: "/leaderboard" },
  {
    id: "contrib",
    label: "CONTRIBUTIONS",
    to: "/contributions",
    roles: ["contributor", "admin"],
  },
  {
    id: "apply-contrib",
    label: "BECOME CONTRIBUTOR",
    to: "/contributor/apply",
    roles: ["learner"],
  },
];

interface MainHeaderProps {
  activeNav?: string;
  backLink?: {
    to: string;
    label: string;
  };
}

interface UiProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
  nextLevelXp: number;
}

function computeLevelFromXp(xp: number): { level: number; nextLevelXp: number } {
  if (!Number.isFinite(xp) || xp < 0) {
    return { level: 1, nextLevelXp: 500 };
  }
  const level = Math.max(1, Math.floor(xp / 500) + 1);
  const nextLevelXp = level * 500;
  return { level, nextLevelXp };
}

function mapRealProfileToUi(profile: UserProfileResponse): UiProfile {
  const xp = profile.xp ?? 0;
  const { level, nextLevelXp } = computeLevelFromXp(xp);

  return {
    id: profile.id,
    username: profile.username,
    level,
    xp,
    nextLevelXp,
  };
}

function mapMockFromUiUser(user: UiUser): UiProfile {
  return {
    id: user.id,
    username: user.displayName,
    level: user.level,
    xp: user.xp,
    nextLevelXp: user.nextLevelXp,
  };
}


export function MainHeader({ activeNav, backLink }: MainHeaderProps) {
  const {
    user: authUser,
    mode,
    loading: authLoading,
    loginMock,
    logout,
  } = useAuth();

  const [uiProfile, setUiProfile] = useState<UiProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const adminMenuRef = useRef<HTMLDivElement | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const adminMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setIsAdminOpen(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!authUser) {
      setUiProfile(null);
      setProfileLoading(false);
      setProfileError(null);
      return;
    }

    if (mode === "mock") {
      setUiProfile(mapMockFromUiUser(authUser));
      setProfileError(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;

    setProfileLoading(true);
    setProfileError(null);

    (async () => {
      try {
        const profileData = await profileClient.getProfile(authUser.id);
        if (cancelled) return;
        setUiProfile(mapRealProfileToUi(profileData));
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Failed to load profile";
        setProfileError(msg);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authUser, mode, authLoading]);

  const isAuthenticated = !!authUser;
  const xpPercent =
    uiProfile && uiProfile.nextLevelXp > 0
      ? Math.min(
        100,
        Math.round((uiProfile.xp / uiProfile.nextLevelXp) * 100)
      )
      : 0;

  const visibleNavItems =
    isAuthenticated && authUser
      ? navItems.filter(
        (item) => !item.roles || item.roles.includes(authUser.role)
      )
      : [];

  const handleMockLogin = () => {
    loginMock();
    setIsProfileOpen(false);
  };

  const handleSignOut = async () => {
    await logout();
    setIsProfileOpen(false);
  };

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

  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated || mode === "mock") return;

    const fetchPendingCount = async () => {
      try {
        const data = await apiFetch<{ count: number }>("/api/exercise-attempts/pending");
        setPendingReviewsCount(data.count);
      } catch (error) {
        console.error("Failed to fetch pending reviews count:", error);
      }
    };

    fetchPendingCount();
    // Fetch every 5 minutes
    const interval = setInterval(fetchPendingCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, mode]);

  useEffect(() => {
    if (!isAuthenticated || mode === "mock") return;

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
  }, [isAuthenticated, mode]);

  return (
    <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {backLink && (
            <Link
              to={backLink.to}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <span className="text-lg">←</span>
              <span>{backLink.label}</span>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-slate-100">
              nihongo count
            </span>
          </div>
        </div>

        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {visibleNavItems.map((item) => {
              const isActive = item.id === activeNav;
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className={
                    "transition-colors" +
                    (isActive
                      ? " text-slate-900 dark:text-slate-100"
                      : " hover:text-slate-900 dark:hover:text-slate-100")
                  }
                >
                  {item.id === "leaderboard" ? (
                    <span className="inline-flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {item.label}
                    </span>
                  ) : item.id === "reviews" ? (
                    <span className="inline-flex items-center gap-2">
                      {item.label}
                      {pendingReviewsCount > 0 && (
                        <span className="inline-flex items-center justify-center bg-red-500 text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem]">
                          {pendingReviewsCount}
                        </span>
                      )}
                    </span>
                  ) : (
                    item.label
                  )}
                </Link>
              );
            })}

            {isAuthenticated && authUser?.role === "admin" && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAdminOpen((o) => !o)}
                  className={
                    "flex items-center gap-1 transition-colors hover:text-slate-900 dark:hover:text-slate-100" +
                    (isAdminOpen || activeNav?.startsWith("admin")
                      ? " text-slate-900 dark:text-slate-100"
                      : " text-slate-500 dark:text-slate-400")
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    ADMIN
                  </span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${isAdminOpen ? "rotate-180" : ""}`} />
                </button>

                {isAdminOpen && (
                  <div className="absolute left-0 mt-4 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-lg text-left dark:border-slate-700 dark:bg-slate-900 z-50 animate-in fade-in zoom-in duration-200">
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => setIsAdminOpen(false)}
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/contributor-applications"
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => setIsAdminOpen(false)}
                    >
                      <User className="h-3.5 w-3.5" />
                      Applications
                    </Link>
                    <Link
                      to="/admin/counter-edits"
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => setIsAdminOpen(false)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Counter Edits
                    </Link>
                    <Link
                      to="/admin/exercises"
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      onClick={() => setIsAdminOpen(false)}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      New Exercises
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated && uiProfile ? (
            <>
              <div className="relative" ref={notificationsMenuRef}>
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

              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((o) => !o)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  aria-haspopup="true"
                  aria-expanded={isProfileOpen}
                >
                  <User className="h-4 w-4" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-xl border border-slate-200 bg-white py-3 shadow-lg text-left dark:border-slate-700 dark:bg-slate-900">
                    <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                        {uiProfile.username}
                      </div>
                      <div className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-300">
                        Level {uiProfile.level}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                          style={{ width: `${xpPercent}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[0.7rem] text-slate-400 dark:text-slate-400">
                        {uiProfile.xp}/{uiProfile.nextLevelXp} XP
                      </div>
                      {profileError && (
                        <div className="mt-1 text-[0.68rem] text-red-500">
                          {profileError}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex flex-col gap-1 px-1 text-sm">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span className="text-xs">Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <SettingsIcon />
                        <span className="text-xs">Settings</span>
                      </Link>

                      <button
                        type="button"
                        className="mt-1 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={handleSignOut}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : !authLoading ? (
            <>
              <Button
                asChild
                size="sm"
                className="rounded-full px-4 text-xs font-semibold tracking-[0.18em] uppercase"
              >
                <Link to="/login">Login / Register</Link>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-4 text-xs font-semibold tracking-[0.18em] uppercase"
                onClick={handleMockLogin}
              >
                Mock user
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-600 dark:text-slate-300"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill="currentColor" />
      <path
        d="M4 13.5v-3l2-.5.7-1.7-1.2-1.7 2.1-2.1 1.7 1.2L11 3h3l.5 2 1.7.7 1.7-1.2 2.1 2.1-1.2 1.7.7 1.7 2 .5v3l-2 .5-.7 1.7 1.2 1.7-2.1 2.1-1.7-1.2-1.7.7-.5 2h-3l-.5-2-1.7-.7-1.7 1.2-2.1-2.1 1.2-1.7-.7-1.7-2-.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
