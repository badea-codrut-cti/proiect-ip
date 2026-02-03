import { Link, Navigate, useLoaderData, useNavigate } from "react-router";
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
import { apiFetch } from "~/utils/api";
import { useWalkthrough } from "~/context/WalkthroughContext";

import {
  Info,
  Edit,
  Plus,
  Send,
  X,
} from "lucide-react";
import { useAuth } from "~/context/AuthContext";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { WalkthroughStep } from "~/components/WalkthroughStep";

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
  const apiUrl = browserBase;

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
  const { counter, exercises, hasPendingEdit: initialHasPendingEdit, counters } =
    useLoaderData<typeof loader>();

  const [hasPendingEdit, setHasPendingEdit] = useState(initialHasPendingEdit);
  const { user, loading } = useAuth();
  const { currentStep, nextStep } = useWalkthrough();
  const isAuthenticated = !!user;
  const isContributor = user?.is_contributor || user?.role === "admin";

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

  const [editContent, setEditContent] = useState(counter.documentation || "");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [newExercise, setNewExercise] = useState({
    sentence: "",
    min_count: 1,
    max_count: 10,
    decimal_points: 0
  });
  const [isSubmittingExercise, setIsSubmittingExercise] = useState(false);

  const { markdownBody } = useMemo(() => {
    if (!counter.documentation || !counter.documentation.trim()) {
      return {
        markdownBody:
          "No description is available yet for this counter. It will be documented soon.",
      };
    }

    const lines = counter.documentation.split(/\r?\n/);
    const rest = lines.slice(1).join("\n").trim();

    return {
      markdownBody: rest || counter.documentation,
    };
  }, [counter.documentation]);

  const navigate = useNavigate();
  const [learningLoading, setLearningLoading] = useState(false);

  const handleStartLearning = async () => {
    setLearningLoading(true);
    try {
      await apiFetch("/api/exercise-attempts/request", {
        method: "POST",
        body: JSON.stringify({ counterId: counter.id }),
      });
      if (currentStep === "start_learning") {
        nextStep();
      }
      navigate("/reviews");
    } catch (err) {
      console.error("Failed to start learning:", err);
    } finally {
      setLearningLoading(false);
    }
  };

  const handleProposeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    setIsSubmittingEdit(true);
    try {
      await apiFetch("/api/counter-edits", {
        method: "POST",
        body: JSON.stringify({
          counter_id: counter.id,
          content: editContent
        })
      });
      setIsEditModalOpen(false);
      setHasPendingEdit(true);
      alert("Documentation edit proposal submitted! It will be reviewed by an admin.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit edit proposal");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleProposeExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.sentence.trim()) return;
    if (!newExercise.sentence.includes("<ans>")) {
      alert("Sentence must contain <ans> where the answer should be.");
      return;
    }
    setIsSubmittingExercise(true);
    try {
      await apiFetch("/api/exercises", {
        method: "POST",
        body: JSON.stringify({
          counter_id: counter.id,
          ...newExercise
        })
      });
      setIsExerciseModalOpen(false);
      setNewExercise({
        sentence: "",
        min_count: 1,
        max_count: 10,
        decimal_points: 0
      });
      alert("Exercise proposal submitted! It will be reviewed by an admin.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit exercise proposal");
    } finally {
      setIsSubmittingExercise(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 flex flex-col">
      <MainHeader activeNav="counters" />

      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        {loading ? (
          <div className="h-full flex items-center justify-center p-12">
            <div className="animate-pulse text-slate-500 uppercase tracking-widest text-xs">Loading…</div>
          </div>
        ) : !isAuthenticated ? (
          <Navigate to="/login" replace />
        ) : (
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
            <div className="flex-1 space-y-6">
              <section className="space-y-1">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {counter.name}
                </h1>
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
                <div className="space-y-3">
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
                </div>
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
                  <WalkthroughStep
                    step="start_learning"
                    title="Practice Time"
                    description="When you're ready, click 'Start Learning' to begin practicing this counter with interactive exercises."
                  >
                    <Button
                      className="w-full justify-center rounded-full text-xs font-semibold tracking-[0.18em] uppercase relative"
                      variant="default"
                      type="button"
                      disabled={learningLoading}
                      onClick={handleStartLearning}
                    >
                      {learningLoading ? "Starting..." : "Start Learning"}
                    </Button>
                  </WalkthroughStep>



                  {isContributor && (
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">
                        Contributor Tools
                      </p>
                      <Button
                        className="w-full justify-start rounded-xl text-xs font-medium"
                        variant="outline"
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <Edit className="mr-2 h-3.5 w-3.5 text-sky-500" />
                        Propose Edit
                      </Button>
                      <Button
                        className="w-full justify-start rounded-xl text-xs font-medium"
                        variant="outline"
                        type="button"
                        onClick={() => setIsExerciseModalOpen(true)}
                      >
                        <Plus className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                        Propose Exercise
                      </Button>
                    </div>
                  )}


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
        )}
      </main>

      {/* Edit Documentation Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Propose Documentation Edit</h3>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleProposeEdit}>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use Markdown to format your documentation. Your proposal will be reviewed by an admin before implementation.
                </p>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                  placeholder="Describe how to use this counter..."
                />
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmittingEdit} className="bg-sky-600 hover:bg-sky-700 text-white">
                  {isSubmittingEdit ? "Submitting..." : (
                    <span className="flex items-center gap-2 uppercase tracking-widest text-[0.65rem] font-bold">
                      <Send className="h-3 w-3" /> Submit Proposal
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {isExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Propose New Exercise</h3>
              </div>
              <button onClick={() => setIsExerciseModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleProposeExercise}>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">Exercise Sentence</label>
                  <Textarea
                    value={newExercise.sentence}
                    onChange={(e) => setNewExercise({ ...newExercise, sentence: e.target.value })}
                    className="min-h-[100px] text-sm bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                    placeholder="Example: 机の上にペンが <ans> あります。"
                  />
                  <p className="text-[0.65rem] text-slate-400 italic">Include &lt;ans&gt; where the user should provide the count.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">Min Count</label>
                    <Input
                      type="number"
                      value={newExercise.min_count}
                      onChange={(e) => setNewExercise({ ...newExercise, min_count: parseFloat(e.target.value) })}
                      className="bg-slate-50 dark:bg-slate-950/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">Max Count</label>
                    <Input
                      type="number"
                      value={newExercise.max_count}
                      onChange={(e) => setNewExercise({ ...newExercise, max_count: parseFloat(e.target.value) })}
                      className="bg-slate-50 dark:bg-slate-950/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">Decimal Points</label>
                  <Input
                    type="number"
                    min="0"
                    max="4"
                    value={newExercise.decimal_points}
                    onChange={(e) => setNewExercise({ ...newExercise, decimal_points: parseInt(e.target.value) })}
                    className="bg-slate-50 dark:bg-slate-950/50"
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setIsExerciseModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmittingExercise} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSubmittingExercise ? "Submitting..." : (
                    <span className="flex items-center gap-2 uppercase tracking-widest text-[0.65rem] font-bold">
                      <Send className="h-3 w-3" /> Submit Proposal
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
