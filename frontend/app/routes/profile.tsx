import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/profile";
import { Link, useNavigate } from "react-router";
import {
  Bell,
  User,
  LogOut,
  Target,
  Flame,
  Medal,
  Trophy,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { useAuth } from "~/context/AuthContext";
import { ThemeToggle } from "~/components/ThemeToggle";
import { profileClient, type UserProfileResponse } from "~/utils/profileClient";
import type { UiUser } from "~/types/auth";

import avatarImg from "~/assets/avatars/user-default.png";
import badgeFirstSteps from "~/assets/badges/first-steps.png";
import badgeWeekWarrior from "~/assets/badges/week-warrior.png";
import badgeStudyMaster from "~/assets/badges/study-master.png";
import badgePerfectWeek from "~/assets/badges/perfect-week.png";
import badgeTop10 from "~/assets/badges/top-10.png";
import badgeCounterKing from "~/assets/badges/counter-king.png";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Profile – Nihongo Count" },
    {
      name: "description",
      content: "Profile, progress and badges for your Nihongo Count account.",
    },
  ];
}

interface UiProfile {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  gems: number;
  joinedAt?: string;
  streakDays: number;
  badgesCount: number;
  reviewsCount: number;
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
  const badgesCount = profile.owned_profile_pictures?.length ?? 0;

  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    level,
    xp,
    nextLevelXp,
    gems: profile.gems ?? 0,
    joinedAt: profile.joined_at,
    streakDays: 7,
    badgesCount,
    reviewsCount: 1,
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
    gems: 42,
    joinedAt: "2025-01-01T00:00:00Z",
    streakDays: 7,
    badgesCount: 3,
    reviewsCount: 1,
  };
}

const weeks = 53;
const daysPerWeek = 7;
const contributionLevels: number[] = Array.from(
  { length: weeks * daysPerWeek },
  (_, i) => {
    const day = i % daysPerWeek;
    const week = Math.floor(i / daysPerWeek);

    let level = 0;
    const r = Math.random();
    if (r < 0.55) level = 1;
    if (r < 0.3) level = 2;
    if (r < 0.1) level = 3;

    if (week >= 18 && week <= 36 && day >= 1 && day <= 4 && level > 0) {
      level = Math.min(3, level + 1);
    }

    return level;
  }
);

const intensityClasses = [
  "bg-emerald-50 dark:bg-emerald-950",
  "bg-emerald-100 dark:bg-emerald-900",
  "bg-emerald-300 dark:bg-emerald-700",
  "bg-emerald-500 dark:bg-emerald-500",
];

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface BadgeConfig {
  label: string;
  image: string;
}

const badgeConfigs: BadgeConfig[] = [
  { label: "First Steps", image: badgeFirstSteps },
  { label: "Week Warrior", image: badgeWeekWarrior },
  { label: "Study Master", image: badgeStudyMaster },
  { label: "Perfect Week", image: badgePerfectWeek },
  { label: "Top 10", image: badgeTop10 },
  { label: "Counter King", image: badgeCounterKing },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, mode, loading: authLoading, logout } = useAuth();

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
      navigate("/login");
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
  }, [authUser, mode, authLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const xpPercent =
    uiProfile && uiProfile.nextLevelXp > 0
      ? Math.min(
          100,
          Math.round((uiProfile.xp / uiProfile.nextLevelXp) * 100)
        )
      : 0;

  const ownedBadgeCount = uiProfile?.badgesCount ?? 0;
  const avatarSrc = avatarImg;

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
            <Link
              to="/"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/reviews"
              className="hover:text-slate-900 transition-colors"
            >
              Reviews
            </Link>
            <Link
              to="/counters"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <span>Counters</span>
            </Link>
            <Link
              to="/badges"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Badges
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <Trophy className="h-3 w-3" />
              <span>Leaderboard</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

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

              {isProfileOpen && uiProfile && (
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
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-2 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <span className="text-lg">←</span>
            <span>Back to Dashboard</span>
          </button>

          {profileLoading && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Loading profile…
            </div>
          )}

          {profileError && !profileLoading && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              {profileError}
            </div>
          )}

          {uiProfile && !profileLoading && (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                    <img
                      src={avatarSrc}
                      alt="User avatar"
                      className="h-14 w-14 object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                      {uiProfile.username}
                    </h1>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      Level {uiProfile.level}
                    </div>
                    <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-300">
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden max-w-xs">
                        <div
                          className="h-full rounded-full bg-slate-900 dark:bg-slate-50"
                          style={{ width: `${xpPercent}%` }}
                        />
                      </div>
                      <div>
                        {uiProfile.xp}/{uiProfile.nextLevelXp} XP
                        <span className="ml-3 text-[0.7rem] text-slate-400 dark:text-slate-400">
                          Gems: {uiProfile.gems}
                        </span>
                      </div>
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
                    <span>{uiProfile.reviewsCount} Reviews Completed</span>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Contribution Activity
                </h2>

                <div className="mt-4 flex flex-col gap-4">
                  <div className="pl-8 text-[0.7rem] text-slate-400 flex justify-between max-w-full dark:text-slate-500">
                    {months.map((m) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex flex-col justify-between text-[0.7rem] text-slate-400 dark:text-slate-500">
                      {days.map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                    </div>

                    <div className="grid grid-cols-[repeat(53,0.75rem)] grid-rows-7 gap-1.5">
                      {contributionLevels.map((lvl, i) => {
                        const clamped = Math.max(0, Math.min(3, lvl));
                        const className =
                          "h-3 w-3 rounded-full " + intensityClasses[clamped];
                        return <div key={i} className={className} />;
                      })}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-end gap-2 text-[0.7rem] text-slate-400 dark:text-slate-500">
                    <span>Less</span>
                    <div className="flex gap-1">
                      <span className="h-3 w-3 rounded-full bg-emerald-50 dark:bg-emerald-950" />
                      <span className="h-3 w-3 rounded-full bg-emerald-100 dark:bg-emerald-900" />
                      <span className="h-3 w-3 rounded-full bg-emerald-300 dark:bg-emerald-700" />
                      <span className="h-3 w-3 rounded-full bg-emerald-500 dark:bg-emerald-500" />
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Earned Badges
                </h2>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  {badgeConfigs.map((badge, index) => (
                    <BadgeCard
                      key={badge.label}
                      label={badge.label}
                      image={badge.image}
                      highlighted={index < ownedBadgeCount}
                      locked={index >= ownedBadgeCount}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg
      className="h-4 w-4 text-slate-600 dark:text-slate-300"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        fill="currentColor"
      />
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

interface BadgeCardProps {
  label: string;
  image: string;
  highlighted?: boolean;
  locked?: boolean;
}

function BadgeCard({ label, image, highlighted, locked }: BadgeCardProps) {
  const base =
    "flex flex-col items-center justify-center gap-2 rounded-2xl border px-4 py-4";

  const highlightClasses = highlighted
    ? "border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-slate-800"
    : locked
    ? "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-900"
    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900";

  return (
    <div className={`${base} ${highlightClasses}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
        <img
          src={image}
          alt={label}
          className="h-10 w-10 object-contain"
        />
      </div>
      <span className="text-xs font-medium text-slate-800 text-center dark:text-slate-100">
        {label}
      </span>
    </div>
  );
}
