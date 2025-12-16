import { useEffect, useRef } from "react";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Bell, User, LayoutDashboard, LogOut, Trophy } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/context/AuthContext";
import type { Role } from "~/types/auth";
import React from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nihongo Count" },
    {
      name: "description",
      content: "Practice Japanese counters with Nihongo Count.",
    },
  ];
}

interface NavItem {
  id: string;
  label: string;
  to: string;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", to: "/" },
  { id: "reviews", label: "Reviews", to: "/reviews" },
  { id: "counters", label: "Counters", to: "/counters" },
  { id: "badges", label: "Badges", to: "/badges" },
  { id: "leaderboard", label: "Leaderboard", to: "/leaderboard" },
  { id: "contrib", label: "Contributions", to: "/contributions", roles: ["contributor", "admin"] },
  { id: "admin", label: "Admin Panel", to: "/admin", roles: ["admin"] },
];

export default function Home() {
  const { user, mode, loading, loginMock, logout } = useAuth();
  const isAuthenticated = !!user;

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const xpPercent =
    user && user.nextLevelXp > 0
      ? Math.min(100, Math.round((user.xp / user.nextLevelXp) * 100))
      : 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!profileMenuRef.current) return;
      if (profileMenuRef.current.contains(event.target as Node)) return;
      setIsProfileOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleNavItems = isAuthenticated
    ? navItems.filter((item) => !item.roles || item.roles.includes(user.role))
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
    <div className="home-page min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em]">
              nihongo count
            </span>
          </div>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-500">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  className="hover:text-slate-900 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <button
                  type="button"
                  className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4 text-slate-600" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
                </button>

                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((open) => !open)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
                    aria-haspopup="true"
                    aria-expanded={isProfileOpen}
                  >
                    <User className="h-4 w-4" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-64 rounded-xl border border-slate-200 bg-white py-3 shadow-lg text-left">
                      <div className="px-4 pb-3 border-b border-slate-100">
                        <div className="text-xs font-semibold text-slate-900">
                          {user.displayName}
                        </div>
                        <div className="mt-1 text-[0.7rem] text-slate-500">
                          Level {user.level}
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                            style={{ width: `${xpPercent}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[0.7rem] text-slate-400">
                          {user.xp}/{user.nextLevelXp} XP
                        </div>
                      </div>

                      <div className="mt-2 flex flex-col gap-1 px-1 text-sm">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          <span className="text-xs">Profile</span>
                        </Link>

                        <Link
                          to="/settings"
                          className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          <span className="text-xs">Settings</span>
                        </Link>

                        <button
                          type="button"
                          className="mt-1 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
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
            ) : (
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
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-slate-50">
        <section className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col items-center justify-center px-4 py-8 text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-[0.35em] uppercase text-slate-900">
            NIHONGO COUNT
          </h1>
          <p className="mt-3 text-[0.7rem] uppercase tracking-[0.28em] text-slate-400">
            In progress
          </p>

          {!isAuthenticated && !loading && (
            <Button
              asChild
              className="mt-8 rounded-full px-6 text-xs font-semibold tracking-[0.18em] uppercase"
            >
              <Link to="/login">Login / Register</Link>
            </Button>
          )}
        </section>
      </main>
    </div>
  );
}
