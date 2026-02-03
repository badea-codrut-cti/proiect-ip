import { useState, useEffect } from "react";
import { MainHeader } from "~/components/MainHeader";
import { useAuth } from "~/context/AuthContext";
import { apiFetch } from "~/utils/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { FileEdit, Check, X, User, Clock, Hash } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FinalBossPopout } from "~/components/FinalBossPopout";


interface PendingEdit {
  id: string;
  counter_id: string;

  content: string;

  current_content?: string | null;

  status?: "pending" | "approved" | "rejected";

  created_at: string | null;
  updated_at?: string | null;

  reviewed_at?: string | null;
  rejection_reason?: string | null;

  created_by: string;
  created_by_username?: string | null;

  counter_name: string;
}

export default function AdminCounterEdits() {
  const { user, loading: authLoading } = useAuth();
  const [edits, setEdits] = useState<PendingEdit[]>([]);
  const [loadingEdits, setLoadingEdits] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [showFinalBoss, setShowFinalBoss] = useState(false);
  const [hadItems, setHadItems] = useState(false);


  useEffect(() => {
    if (user?.role === "admin") {
      fetchEdits();
    }
  }, [user]);

  const fetchEdits = async () => {
    try {
      setLoadingEdits(true);
      const raw = await apiFetch<PendingEdit[] | { items: PendingEdit[] }>(
        "/api/counter-edits/pending"
      );
      const list = Array.isArray(raw) ? raw : raw.items ?? [];
      setEdits(list);
      if (list.length > 0) setHadItems(true);
    } catch (err) {
      console.error("Failed to fetch pending edits:", err);
    } finally {
      setLoadingEdits(false);
    }
  };

  useEffect(() => {
    if (!loadingEdits && hadItems && edits.length === 0) {
      setShowFinalBoss(true);
    }
  }, [loadingEdits, hadItems, edits.length]);


  const handleApprove = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to approve this documentation update? This will overwrite the current documentation."
      )
    )
      return;

    setProcessingId(id);
    try {
      await apiFetch(`/api/counter-edits/${id}/approve`, { method: "POST" });
      setEdits(edits.filter((edit) => edit.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve edit");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = rejectionReason[id];
    if (!reason) {
      alert("Please provide a reason for rejection");
      return;
    }

    setProcessingId(id);
    try {
      await apiFetch(`/api/counter-edits/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setEdits(edits.filter((edit) => edit.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject edit");
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <MainHeader activeNav="admin" />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileEdit className="h-6 w-6 text-sky-500" />
              <h1 className="text-3xl font-bold tracking-tight">Counter Edits</h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Review and approve changes to counter documentation proposed by contributors.
            </p>
          </div>
          <div className="text-xs font-mono bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400">
            {edits.length} PENDING
          </div>
        </div>

        {loadingEdits ? (
          <div className="grid gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-64 bg-white dark:bg-slate-900 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : edits.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Clean Slate!
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              There are no pending documentation edits to review.
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            {edits.map((edit) => (
              <Card
                key={edit.id}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
              >
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{edit.counter_name}</CardTitle>
                      <CardDescription className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />{" "}
                          {edit.created_by_username ?? "Unknown"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{" "}
                          {edit.created_at
                            ? new Date(edit.created_at).toLocaleDateString()
                            : "—"}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                      Pending Review
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                      {/* OPTIONAL: show current content if backend provides it */}
                      {edit.current_content !== undefined && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                            Current Content
                          </h4>
                          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/50 prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {edit.current_content?.trim() || "(empty / not set)"}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                          Proposed Content
                        </h4>
                        <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50 prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {edit.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 lg:pt-0 lg:border-l border-slate-100 dark:border-slate-800 lg:pl-8">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Decision
                        </h4>
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                          onClick={() => handleApprove(edit.id)}
                          disabled={processingId !== null}
                        >
                          {processingId === edit.id ? (
                            "Processing..."
                          ) : (
                            <span className="flex items-center gap-2 underline decoration-emerald-400/30 underline-offset-4">
                              <Check className="h-4 w-4" /> Approve & Update
                            </span>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Reject with Feedback
                        </h4>
                        <Textarea
                          placeholder="Explain why this edit is being rejected..."
                          className="text-xs min-h-[100px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-red-500/20"
                          value={rejectionReason[edit.id] || ""}
                          onChange={(e) =>
                            setRejectionReason({
                              ...rejectionReason,
                              [edit.id]: e.target.value,
                            })
                          }
                        />
                        <Button
                          variant="outline"
                          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950"
                          onClick={() => handleReject(edit.id)}
                          disabled={processingId !== null}
                        >
                          {processingId === edit.id ? (
                            "Processing..."
                          ) : (
                            <span className="flex items-center gap-2">
                              <X className="h-4 w-4" /> Reject Edit
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
      <FinalBossPopout
        open={showFinalBoss}
        onClose={() => setShowFinalBoss(false)}
        title="All counter edits cleared!"
        subtitle="Queue eliminated. Good job."
        videoSrc="/video/well-done.mp4"
      />

    </div>
  );
}
