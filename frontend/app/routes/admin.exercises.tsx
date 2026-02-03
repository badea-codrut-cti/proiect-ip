import { useState, useEffect } from "react";
import { MainHeader } from "~/components/MainHeader";
import { useAuth } from "~/context/AuthContext";
import { apiFetch } from "~/utils/api";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { BookOpen, Check, X, Clock, Hash, Percent } from "lucide-react";

interface PendingExercise {
  id: string;
  counter_id: string;
  sentence: string;

  min_count: number;
  max_count: number;
  decimal_points: number;

  status?: "pending" | "approved" | "rejected";

  created_at: string | null;
  updated_at?: string | null;

  reviewed_at?: string | null;
  rejection_reason?: string | null;

  created_by: string | null;
  created_by_username?: string | null;

  counter_name: string;
}

export default function AdminExercises() {
  const { user, loading: authLoading } = useAuth();
  const [exercises, setExercises] = useState<PendingExercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchExercises();
    }
  }, [user]);

  const fetchExercises = async () => {
    try {
      setLoadingExercises(true);
      const raw = await apiFetch<PendingExercise[] | { items: PendingExercise[] }>(
        "/api/exercises/pending"
      );
      const list = Array.isArray(raw) ? raw : raw.items ?? [];
      setExercises(list);
    } catch (err) {
      console.error("Failed to fetch pending exercises:", err);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to approve this exercise? It will become available to all users."
      )
    )
      return;

    setProcessingId(id);
    try {
      await apiFetch(`/api/exercises/${id}/approve`, { method: "POST" });
      setExercises(exercises.filter((ex) => ex.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve exercise");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = (rejectionReason[id] ?? "").trim();
    if (!reason) {
      alert("Please provide a reason for rejection");
      return;
    }

    setProcessingId(id);
    try {
      await apiFetch(`/api/exercises/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setExercises(exercises.filter((ex) => ex.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject exercise");
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-500 uppercase tracking-widest text-xs">
          Loading...
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <MainHeader />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2 uppercase tracking-widest text-slate-900 dark:text-slate-100">
            Access Denied
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Admin privileges are required to view this page.
          </p>
        </main>
      </div>
    );
  }

  const formatSentence = (sentence: string) => {
    const parts = sentence.split(/<ans>/);
    if (parts.length === 1) return sentence;
    return (
      <span>
        {parts[0]}
        <span className="inline-block px-3 py-0.5 mx-1 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800/50">
          ____
        </span>
        {parts[1]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <MainHeader activeNav="admin" />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-6 w-6 text-emerald-500" />
              <h1 className="text-3xl font-bold tracking-tight">Exercise Approvals</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Review new exercise proposals submitted by our contributors.
            </p>
          </div>
          <div className="text-xs font-mono bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400">
            {exercises.length} PENDING
          </div>
        </div>

        {loadingExercises ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 bg-white dark:bg-slate-900 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              All Done!
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              There are no pending exercise proposals at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {exercises.map((ex) => (
              <Card
                key={ex.id}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
              >
                <CardContent className="p-0">
                  <div className="grid lg:grid-cols-4">
                    <div className="lg:col-span-3 p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          <Hash className="h-4 w-4" />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {ex.counter_name}
                          </span>

                          <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />

                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Proposed by {ex.created_by_username ?? "Unknown"}
                          </span>

                          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />{" "}
                            {ex.created_at ? new Date(ex.created_at).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="text-lg font-medium text-slate-800 dark:text-slate-200 pl-11">
                        {formatSentence(ex.sentence)}
                      </div>

                      <div className="flex flex-wrap gap-4 pl-11">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Range:
                          </span>
                          {ex.min_count} • {ex.max_count}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                          <Percent className="h-3 w-3" />
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Decimals:
                          </span>
                          {ex.decimal_points}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 space-y-4">
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm h-10"
                        onClick={() => handleApprove(ex.id)}
                        disabled={processingId !== null}
                      >
                        {processingId === ex.id ? (
                          "Processing..."
                        ) : (
                          <span className="flex items-center gap-2">
                            <Check className="h-4 w-4" /> Approve
                          </span>
                        )}
                      </Button>

                      <div className="space-y-3">
                        <Textarea
                          placeholder="Reason for rejection (feedback)..."
                          className="text-xs min-h-[60px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          value={rejectionReason[ex.id] || ""}
                          onChange={(e) =>
                            setRejectionReason({ ...rejectionReason, [ex.id]: e.target.value })
                          }
                        />

                        <Button
                          variant="ghost"
                          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs h-8"
                          onClick={() => handleReject(ex.id)}
                          disabled={processingId !== null}
                        >
                          {processingId === ex.id ? (
                            "..."
                          ) : (
                            <span className="flex items-center gap-1.5 px-4 h-full w-full justify-center">
                              <X className="h-3.5 w-3.5" /> Reject Proposal
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
