import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Bell, User, LogOut, Trophy } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/ThemeToggle";
import { useAuth } from "~/context/AuthContext";
import {
  profileClient,
  type UserProfileResponse,
} from "~/utils/profileClient";
import type { Role, UiUser } from "~/types/auth";

interface NavItem {
  id: string;
  label: string;
  to: string;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { id: "home", label: "HOME", to: "/" },
  { id: "reviews", label: "REVIEWS", to: "/__review" },
  { id: "counters", label: "COUNTERS", to: "/counters" },
  { id: "badges", label: "BADGES", to: "/badges" },
  { id: "leaderboard", label: "LEADERBOARD", to: "/leaderboard" },
  {
    id: "contrib",
    label: "CONTRIBUTIONS",
    to: "/contributions",
    roles: ["contributor", "admin"],
  },
  { id: "admin", label: "ADMIN", to: "/admin", roles: ["admin"] },
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
  email: string;
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
    email: profile.email,
    level,
    xp,
    nextLevelXp,
  };
}

function mapMockFromUiUser(user: UiUser): UiProfile {
  return {
    id: user.id,
    username: user.displayName,
    email: "mock@example.com",
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

  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!profileMenuRef.current) return;
      if (profileMenuRef.current.contains(event.target as Node)) return;
      setIsProfileOpen(false);
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
                  ) : (
                    item.label
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated && uiProfile ? (
            <>
              <button
                type="button"
                className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-slate-600 dark:text-slate-200" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
              </button>

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
