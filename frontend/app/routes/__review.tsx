import { useEffect, useState, useRef } from "react";
import { Input } from "~/components/ui/input";
import { Link, useNavigate } from "react-router";
import * as wanakana from "wanakana";
import { apiFetch } from "~/utils/api";
import { WalkthroughStep } from "~/components/WalkthroughStep";
import { useWalkthrough } from "~/context/WalkthroughContext";
import { MainHeader } from "~/components/MainHeader";
import { Sparkles, Zap } from "lucide-react";

type ExerciseData = {
  review_id: string;
  exercise: {
    id: string;
    sentence: string;
    translation?: string;
    counter_id: string;
    decimal_points: number;
  };
  generated_number: number;
};

function normalizeJapanese(input: string) {
  return input
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/\u3000/g, "")
    .trim();
}

function XpCelebration({ xp, correct, onComplete }: { xp: number; correct: boolean; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [showXp, setShowXp] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setShowXp(true), 100);
    const timer2 = setTimeout(() => setProgress(100), 300);
    const timer3 = setTimeout(() => onComplete(), 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300">
        <div className={`text-6xl ${correct ? 'animate-bounce' : ''}`}>
          {correct ? '🎉' : '💪'}
        </div>

        <div className="text-center space-y-1">
          <h2 className={`text-2xl font-bold ${correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {correct ? 'Perfect!' : 'Keep Going!'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {correct ? 'You nailed it!' : 'Learning from mistakes is progress'}
          </p>
        </div>

        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              XP Earned
            </span>
            <span className={`font-bold text-lg transition-all duration-500 ${showXp ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              +{xp} XP
            </span>
          </div>

          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${correct ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400'}`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
            <div className="absolute inset-0 rounded-full shadow-inner pointer-events-none" />
          </div>

          <div className="flex justify-center">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-500 ${showXp ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} ${correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
              <Sparkles className="h-3 w-3" />
              {correct ? 'Streak maintained!' : 'Keep practicing!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewExercise() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dueCounterIds, setDueCounterIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentReview, setCurrentReview] = useState<ExerciseData | null>(null);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ xp: number; correct: boolean } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { currentStep, nextStep } = useWalkthrough();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchPending() {
      try {
        const data = await apiFetch<{ due_counters: string[] }>("/api/exercise-attempts/pending");
        setDueCounterIds(data.due_counters || []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    }
    fetchPending();
  }, []);

  useEffect(() => {
    if (loading || dueCounterIds.length === 0 || currentIndex >= dueCounterIds.length) return;

    async function fetchExercise() {
      try {
        const data = await apiFetch<ExerciseData>("/api/exercise-attempts/request", {
          method: "POST",
          body: JSON.stringify({ counterId: dueCounterIds[currentIndex] }),
        });
        setCurrentReview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load exercise");
      }
    }
    fetchExercise();
  }, [loading, dueCounterIds, currentIndex]);

  const totalReviews = dueCounterIds.length;
  const progress = totalReviews > 0 ? Math.round((currentIndex / totalReviews) * 100) : 0;
  const nextProgress = totalReviews > 0 ? Math.round(((currentIndex + 1) / totalReviews) * 100) : 0;

  async function handleSubmit() {
    if (!answer.trim() || !currentReview) return;

    try {
      const result = await apiFetch<{ xp_awarded: number; correct: boolean; expected_answer: string }>("/api/exercise-attempts/submit", {
        method: "POST",
        body: JSON.stringify({
          reviewId: currentReview.review_id,
          answer: answer.trim(),
        }),
      });

      setStats({ xp: result.xp_awarded, correct: result.correct });
      setShowCelebration(true);

      if (result.correct) {
        setMessage("✅ Correct!");
      } else {
        setMessage(`❌ Wrong. Correct: ${result.expected_answer}`);
      }

      setAnswer("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      if (currentStep === "answer_exercise") {
        nextStep();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  }

  function handleCelebrationComplete() {
    setShowCelebration(false);
    setMessage(null);
    setStats(null);
    setCurrentReview(null);
    setCurrentIndex((prev) => prev + 1);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <MainHeader activeNav="reviews" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 border-4 border-slate-300 dark:border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
            <div className="text-slate-500 dark:text-slate-400">Loading reviews...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <MainHeader activeNav="reviews" />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="text-red-500 font-semibold">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (totalReviews === 0 || currentIndex >= totalReviews) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <MainHeader activeNav="reviews" />
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="text-6xl mb-2">
            {totalReviews === 0 ? '✨' : '🎊'}
          </div>
          <div className="text-2xl font-semibold text-slate-700 dark:text-slate-200 text-center">
            {totalReviews === 0 ? "No reviews due right now!" : "Review session completed!"}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
            {totalReviews === 0
              ? "Great job staying on top of your learning! Check back later for more reviews."
              : "Amazing work! You've completed all your pending reviews. Keep up the great progress!"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transition shadow-lg shadow-indigo-500/25 font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentReview) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <MainHeader activeNav="reviews" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 border-4 border-slate-300 dark:border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
            <div className="text-slate-500 dark:text-slate-400">Preparing next exercise...</div>
          </div>
        </div>
      </div>
    );
  }

  const sentenceWithBlank = currentReview.exercise.sentence.replace("<ans>", "_______");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader activeNav="reviews" />

      {showCelebration && stats && (
        <XpCelebration
          xp={stats.xp}
          correct={stats.correct}
          onComplete={handleCelebrationComplete}
        />
      )}

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-slate-700 dark:hover:text-slate-300 transition">
              ← Back to Dashboard
            </Link>
            <span className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                ✓ {currentIndex}
              </span>
              completed
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Review {currentIndex + 1} of {totalReviews}
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                {nextProgress}%
              </span>
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${showCelebration ? nextProgress : progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-12 text-center shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50">
            <div className="mb-8 space-y-4">
              <div className="text-4xl font-medium tracking-wide text-slate-800 dark:text-slate-100">
                {sentenceWithBlank}
              </div>
              {currentReview.exercise.translation && (
                <div className="text-base text-slate-500 dark:text-slate-400 italic">
                  {currentReview.exercise.translation.split('<ans>').map((part, index, arr) => (
                    <span key={index}>
                      {part}
                      {index < arr.length - 1 && (
                        <span className="font-bold text-slate-700 dark:text-slate-200 not-italic">
                          {currentReview.generated_number}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-sm text-slate-400 dark:text-slate-500">
                How do you say{' '}
                <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {currentReview.generated_number}
                </span>
                {' '}using the correct counter?
              </div>
            </div>

            <WalkthroughStep
              step="answer_exercise"
              title="Your First Exercise"
              description="Type the Japanese reading for the number in Romaji (e.g., 'ippon'). It will automatically convert to Hiragana."
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="max-w-xs mx-auto space-y-4"
              >
                <Input
                  autoFocus
                  placeholder="Type in Romaji (e.g. 'sanbon')..."
                  value={answer}
                  onChange={(e) => setAnswer(wanakana.toKana(e.target.value, { IMEMode: true }))}
                  className="text-center text-xl h-14 text-slate-900 bg-white border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  disabled={!!message}
                />
                <div className="text-[0.65rem] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                  Press Enter to submit
                </div>
              </form>
            </WalkthroughStep>

            {message && !showCelebration && (
              <div className={`mt-6 text-sm font-bold ${stats?.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {message}
                {stats && (
                  <div className="mt-1 text-xs opacity-80">
                    ⭐ +{stats.xp} XP
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
