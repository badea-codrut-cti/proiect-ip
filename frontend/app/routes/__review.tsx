import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Link, useNavigate } from "react-router";

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

  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [badge, setBadge] = useState<string | null>(null);
  const [xp, setXp] = useState<number | null>(null);

  const exercises = HARDCODED_EXERCISES;
  const exercise = exercises[current];

  /* 🔚 FINAL SCREEN */
  if (!exercise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-6">
        <div className="text-2xl font-semibold text-slate-700">
          🎉 Review completed!
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

    // Badge doar la primul exercițiu
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto h-14 max-w-5xl flex items-center px-4 text-xs uppercase tracking-[0.25em] font-semibold">
          nihongo count
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-3xl space-y-6">
          {/* TOP BAR */}
          <div className="flex justify-between text-xs text-slate-500">
            <Link to="/" className="hover:text-slate-700">
              ← Back to Dashboard
            </Link>
            <span>{current} completed</span>
          </div>

          {/* PROGRESS */}
          <div>
            <div className="text-xs mb-1">
              Question {current + 1} of {exercises.length}
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* CARD */}
          <div className="rounded-2xl border bg-white px-8 py-10 text-center shadow-sm">
            {/* JAPANESE */}
            <div className="text-2xl mb-2 tracking-wide">
              {exercise.sentence}
            </div>

            {/* ENGLISH */}
            <div className="text-sm text-slate-500 mb-6">
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
              <div className="text-xs text-slate-400">
                Press Enter to submit
              </div>
            </form>

            {/* FEEDBACK */}
            {message && (
              <div className="mt-4 text-sm font-semibold">
                {message}
              </div>
            )}

            {badge && (
              <div className="mt-2 text-green-600 text-sm">
                🏆 You unlocked a badge: {badge}
              </div>
            )}

            {xp && (
              <div className="mt-1 text-blue-600 text-sm">
                ⭐ +{xp} XP
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
