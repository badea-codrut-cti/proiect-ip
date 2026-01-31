import { useEffect, useState, useRef } from "react";
import { Input } from "~/components/ui/input";
import { Link, useNavigate } from "react-router";
import * as wanakana from "wanakana";
import { apiFetch } from "~/utils/api";

type ExerciseData = {
  review_id: string;
  exercise: {
    id: string;
    sentence: string;
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

  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch pending counters on mount
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

  // 2. Fetch exercise when index changes
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

      if (result.correct) {
        setMessage("✅ Correct!");
      } else {
        setMessage(`❌ Wrong. Correct: ${result.expected_answer}`);
      }

      setAnswer("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      setTimeout(() => {
        setMessage(null);
        setStats(null);
        setCurrentReview(null);
        setCurrentIndex((prev) => prev + 1);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading reviews...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <div className="text-red-500 font-semibold">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-900 text-white rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  if (totalReviews === 0 || currentIndex >= totalReviews) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-6">
        <div className="text-2xl font-semibold text-slate-700">
          {totalReviews === 0 ? "No reviews due right now! ✨" : "🎉 Review session completed!"}
        </div>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!currentReview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Preparing next exercise...</div>
      </div>
    );
  }

  const sentenceWithBlank = currentReview.exercise.sentence.replace("<ans>", "_______");

  // Removed wanakana.bind effect to simplify input handling and fix conflicts

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto h-14 max-w-5xl flex items-center px-4 text-xs uppercase tracking-[0.25em] font-semibold">
          nihongo count
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-3xl space-y-6">
          <div className="flex justify-between text-xs text-slate-500">
            <Link to="/" className="hover:text-slate-700">
              ← Back to Dashboard
            </Link>
            <span>{currentIndex} completed</span>
          </div>

          <div>
            <div className="text-xs mb-1 text-slate-500">
              Review {currentIndex + 1} of {totalReviews}
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-white px-8 py-12 text-center shadow-sm">
            <div className="mb-8 space-y-4">
              <div className="text-4xl font-medium tracking-wide text-slate-800">
                {sentenceWithBlank}
              </div>
              <div className="text-sm text-slate-400">
                How do you say <span className="font-bold text-slate-600">{currentReview.generated_number}</span> using the correct counter?
              </div>
            </div>

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
                className="text-center text-xl h-12 text-slate-900 bg-white border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                disabled={!!message}
              />
              <div className="text-[0.65rem] uppercase tracking-wider text-slate-400 font-semibold">
                Press Enter to submit
              </div>
            </form>

            {message && (
              <div className={`mt-6 text-sm font-bold ${stats?.correct ? 'text-emerald-600' : 'text-rose-600'}`}>
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
    </div>
  );
}
