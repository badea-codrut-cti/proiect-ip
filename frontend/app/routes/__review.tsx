import { useEffect, useRef, useState } from "react";
import { Input } from "~/components/ui/input";
import { Link, useNavigate } from "react-router";
import { Trophy, User } from "lucide-react";

import { ThemeToggle } from "~/components/ThemeToggle";
import { NotificationsDropdown } from "~/components/NotificationsDropdown";
import { useAuth } from "~/context/AuthContext";

type Exercise = {
  id: string;
  sentence: string;
  translation: string;
  answer: string;
};

const HARDCODED_EXERCISES: Exercise[] = [
  {
    id: "1",
    sentence: "ペンを _____ ください。",
    translation: "Please give me three pens.",
    answer: "さんぼん",
  },
  {
    id: "2",
    sentence: "本を _____ ください。",
    translation: "Please give me two books.",
    answer: "にさつ",
  },
  {
    id: "3",
    sentence: "ノートを _____ 買いました。",
    translation: "I bought four notebooks.",
    answer: "よんさつ",
  },
];

function normalizeJapanese(input: string) {
  return input
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/\u3000/g, "")
    .trim();
}

export default function ReviewExercise() {
  const navigate = useNavigate();
  const { user: authUser, mode, loading: authLoading, logout } = useAuth();

  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [badge, setBadge] = useState<string | null>(null);
  const [xp, setXp] = useState<number | null>(null);

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

  const exercises = HARDCODED_EXERCISES;
  const exercise = exercises[current];

  const progress = Math.round(((current + 1) / exercises.length) * 100);

  function handleSubmit() {
    if (!answer.trim()) return;

    const userAnswer = normalizeJapanese(answer);
    const expected = normalizeJapanese(exercise.answer);

    if (userAnswer !== expected) {
      setMessage("❌ Wrong answer");
      return;
    }

    setMessage("✅ Correct!");
    setXp(20);

    if (current === 0) {
      setBadge("First exercise");
    }

    setAnswer("");

    setTimeout(() => {
      setMessage(null);
      setXp(null);
      setBadge(null);
      setCurrent((c) => c + 1);
    }, 1500);
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!exercise) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col dark:bg-slate-950 dark:text-slate-50">
        {/* Header styled like other pages */}
        <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-slate-100">
                nihongo count
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <NotificationsDropdown />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              🎉 Review completed!
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Nice work — you finished this session.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="px-6 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  setCurrent(0);
                  setAnswer("");
                  setMessage(null);
                  setBadge(null);
                  setXp(null);
                }}
                className="px-6 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Restart
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col dark:bg-slate-950 dark:text-slate-50">
      {/* Header styled like /profile */}
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
            <Link to="/reviews" className="text-slate-900 dark:text-slate-100">
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
              className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <Trophy className="h-3 w-3" />
              <span>Leaderboard</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationsDropdown />

            {/* Simple profile menu button like other pages */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((o) => !o)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                aria-haspopup="true"
                aria-expanded={isProfileOpen}
                aria-label="Profile menu"
              >
                <User className="h-4 w-4" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg text-left dark:border-slate-700 dark:bg-slate-900">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                      {authLoading
                        ? "Loading…"
                        : authUser
                        ? authUser.displayName
                        : "Guest"}
                    </div>
                    <div className="mt-1 text-[0.7rem] text-slate-500 dark:text-slate-300">
                      {mode === "mock" ? "Mock mode" : authUser ? "Signed in" : "Not signed in"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 px-1 text-sm">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-100"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span className="text-xs">Profile</span>
                    </Link>

                    <button
                      type="button"
                      className="mt-1 flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={handleLogout}
                    >
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
          {/* Top line like other pages */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <span className="text-lg">←</span>
              <span>Back to Dashboard</span>
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400">
              {current} completed
            </span>
          </div>

          {/* Progress bar styled like profile */}
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Review session
                </h1>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Question {current + 1} of {exercises.length}
                </p>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                {progress}%
              </div>
            </div>

            <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-900 dark:bg-slate-50 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          {/* Main card */}
          <section className="rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-2xl mb-2 tracking-wide text-slate-900 dark:text-slate-50">
              {exercise.sentence}
            </div>

            <div className="text-sm text-slate-500 dark:text-slate-300 mb-6">
              {exercise.translation}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-3"
            >
              <Input
                autoFocus
                placeholder="Type answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="text-center"
              />
              <div className="text-xs text-slate-400 dark:text-slate-500">
                Press Enter to submit
              </div>
            </form>

            {message && (
              <div
                className={`mt-4 text-sm font-semibold ${
                  message.includes("Correct")
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-red-600 dark:text-red-300"
                }`}
              >
                {message}
              </div>
            )}

            {badge && (
              <div className="mt-2 text-emerald-600 dark:text-emerald-300 text-sm">
                🏆 You unlocked a badge: {badge}
              </div>
            )}

            {xp && (
              <div className="mt-1 text-sky-600 dark:text-sky-300 text-sm">
                ⭐ +{xp} XP
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
