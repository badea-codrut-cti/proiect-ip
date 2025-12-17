import { Link, Navigate, useLoaderData } from "react-router";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MainHeader } from "~/components/MainHeader";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";

import {
  ChevronRight,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useAuth } from "~/context/AuthContext";

export function meta() {
  return [
    { title: "Counter details – Nihongo Count" },
    {
      name: "description",
      content: "Detailed information about a Japanese counter.",
    },
  ];
}

interface CounterApi {
  id: string;
  name: string;
  documentation: string | null;
}

interface ExerciseApi {
  id: string;
  sentence: string;
  min_count: number;
  max_count: number;
  decimal_points: number;
}

interface CounterListItem {
  id: string;
  name: string;
}

interface LoaderData {
  counter: CounterApi;
  hasPendingEdit: boolean;
  exercises: ExerciseApi[];
  counters: CounterListItem[];
}

export async function loader({ params }: { params: { counterId?: string } }) {
  const { counterId } = params;
  if (!counterId) {
    throw new Response("Counter id missing", { status: 400 });
  }

  const browserBase =
    import.meta.env.VITE_API_URL || "http://localhost:5000";
  const serverBase = "http://backend:5000";
  const apiUrl =
    typeof window === "undefined" ? serverBase : browserBase;

  const [detailRes, listRes] = await Promise.all([
    fetch(`${apiUrl}/api/counters/${encodeURIComponent(counterId)}`, {
      credentials: "include",
    }),
    fetch(`${apiUrl}/api/counters`, {
      credentials: "include",
    }),
  ]);

  if (!detailRes.ok) {
    throw new Response("Counter not found", { status: detailRes.status });
  }

  const detail = await detailRes.json();
  const listRaw = await listRes.json();

  const counters: CounterListItem[] = Array.isArray(listRaw)
    ? listRaw
    : listRaw.counters ?? [];

  const data: LoaderData = {
    counter: detail.counter,
    hasPendingEdit: detail.hasPendingEdit,
    exercises: detail.exercises,
    counters,
  };

  return data;
}

function formatExerciseSentence(sentence: string): string {
  return sentence.replace(/<ans>/g, "____");
}

export default function CounterDetailPage() {
  const { counter, exercises, hasPendingEdit, counters } =
    useLoaderData<typeof loader>();

  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Loading…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const { subtitle, markdownBody } = useMemo(() => {
    if (!counter.documentation || !counter.documentation.trim()) {
      return {
        subtitle: "Counter",
        markdownBody:
          "No description is available yet for this counter. It will be documented soon.",
      };
    }

    const lines = counter.documentation.split(/\r?\n/);
    const first = lines[0] || "Counter";
    const rest = lines.slice(1).join("\n").trim();

    return {
      subtitle: first,
      markdownBody: rest || counter.documentation,
    };
  }, [counter.documentation]);

  const index = counters.findIndex((c) => c.id === counter.id);
  const total = counters.length || 1;
  const currentPosition = index >= 0 ? index + 1 : 1;
  const hasNext = index >= 0 && index < counters.length - 1;
  const nextCounter = hasNext ? counters[index + 1] : null;

  const progressPercent = Math.round((currentPosition / total) * 100);

  const currentExampleLabel =
    exercises.length > 0 ? formatExerciseSentence(exercises[0].sentence) : "";
  const [mastered, setMastered] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("masteredCounters");
    if (!raw) {
      setMastered(false);
      return;
    }
    try {
      const arr = JSON.parse(raw) as string[];
      setMastered(arr.includes(counter.id));
    } catch {
      setMastered(false);
    }
  }, [counter.id]);

  const handleMarkMastered = () => {
    setMastered(true);
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("masteredCounters");
    let arr: string[] = [];
    if (raw) {
      try {
        arr = JSON.parse(raw);
      } catch {
        arr = [];
      }
    }
    if (!arr.includes(counter.id)) {
      arr.push(counter.id);
      window.localStorage.setItem(
        "masteredCounters",
        JSON.stringify(arr)
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 flex flex-col">
      <MainHeader
        activeNav="counters"
        backLink={{ to: "/counters", label: "Back to Counters Library" }}
      />

      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
          <div className="flex-1 space-y-6">
            <section className="space-y-1">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {counter.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Progress: {currentPosition}/{total} • Learning:{" "}
                {currentExampleLabel || "N/A"}
              </p>
            </section>

            <section>
              <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    {counter.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Usage overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h2
                          className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-50"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h3
                          className="mt-3 mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="mb-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          className="mb-2 ml-4 list-disc text-sm text-slate-700 dark:text-slate-200"
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          className="mb-2 ml-4 list-decimal text-sm text-slate-700 dark:text-slate-200"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="mb-1" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="font-semibold text-slate-900 dark:text-slate-50"
                          {...props}
                        />
                      ),
                      em: ({ node, ...props }) => (
                        <em className="italic" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="text-sky-600 underline-offset-2 hover:underline dark:text-sky-400"
                          target="_blank"
                          rel="noreferrer"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {markdownBody}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Example Sentences
              </h2>

              {exercises.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  There are no approved example exercises for this counter yet.
                </p>
              )}

              {exercises.map((ex) => (
                <Card
                  key={ex.id}
                  className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <CardContent className="py-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {formatExerciseSentence(ex.sentence)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Range: {ex.min_count} – {ex.max_count}
                      {ex.decimal_points > 0 &&
                        ` • up to ${ex.decimal_points} decimal places`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </section>
          </div>

          <aside className="w-full space-y-4 lg:w-80">
            <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Actions
                </CardTitle>
                {hasPendingEdit && (
                  <CardDescription className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Info className="h-3 w-3" />
                    This counter has edits waiting for admin approval.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-center rounded-full text-xs font-semibold tracking-[0.18em] uppercase"
                  variant={mastered ? "outline" : "default"}
                  type="button"
                  disabled={mastered}
                  onClick={handleMarkMastered}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {mastered ? "Mastered" : "Mark as Mastered"}
                </Button>

                {hasNext && nextCounter && (
                  <Button
                    className="w-full justify-center rounded-full text-xs font-semibold tracking-[0.18em] uppercase"
                    variant="outline"
                    type="button"
                    asChild
                  >
                    <Link to={`/counters/${nextCounter.id}`}>
                      <span>Next Counter</span>
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}

                <div className="mt-4 space-y-1">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    Current Progress
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {currentPosition} / {total} learned
                  </p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-1.5 rounded-full bg-slate-900 dark:bg-slate-100"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-[0.7rem] text-slate-400 dark:text-slate-500">
                    {progressPercent}%
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/60">
              <CardContent className="py-3 text-xs text-slate-500 dark:text-slate-400">
                Counters and exercises are still evolving. Some sections on this
                page use mock progress values until full backend tracking is
                implemented.
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
