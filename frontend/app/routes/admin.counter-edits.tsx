import { useEffect, useMemo, useState } from "react";
import { MainHeader } from "~/components/MainHeader";
import { useAuth } from "~/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { AdminToast } from "~/components/admin/AdminToast";
import { FinalBossPopout } from "~/components/admin/FinalBossPopout";
import {
  adminReviewClient,
  type PendingSentenceEdit,
} from "~/utils/adminReviewClient";

function safeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function StatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const cls =
    status === "pending"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
      : status === "approved"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
      : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 h-7 rounded-md text-xs font-bold ${cls}`}
    >
      {status.toUpperCase()}
    </span>
  );
}

export default function AdminEditedSentences() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState<PendingSentenceEdit[]>([]);
  const [loading, setLoading] = useState(true);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [leaving, setLeaving] = useState<
    Record<string, "approve" | "reject" | null>
  >({});

  const [toast, setToast] = useState<{
    open: boolean;
    type: "success" | "error" | "info";
    title: string;
    subtitle?: string;
  }>({ open: false, type: "info", title: "" });

  const [finalPop, setFinalPop] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    adminReviewClient
      .getPendingEditedSentences()
      .then((res) => setItems(res.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const pendingCount = items.length;
  const headerBadge = useMemo(() => `${pendingCount} PENDING`, [pendingCount]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    setLeaving((p) => ({ ...p, [id]: "approve" }));

    try {
      await adminReviewClient.approveEditSentence(id);

      setToast({
        open: true,
        type: "success",
        title: "Edit approved",
        subtitle: "Counter documentation updated",
      });

      setTimeout(() => {
        const next = items.filter((x) => x.id !== id);
        setItems(next);
        setLeaving((p) => ({ ...p, [id]: null }));
        if (next.length === 0) setFinalPop(true);
      }, 220);
    } catch (err) {
      setLeaving((p) => ({ ...p, [id]: null }));
      alert(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = (rejectReason[id] ?? "").trim();
    if (!reason) {
      alert("Please provide a rejection reason");
      return;
    }

    setProcessingId(id);
    setLeaving((p) => ({ ...p, [id]: "reject" }));

    try {
      await adminReviewClient.rejectEditSentence(id, reason);

      setToast({
        open: true,
        type: "error",
        title: "Edit rejected",
        subtitle: "Reason saved",
      });

      setTimeout(() => {
        const next = items.filter((x) => x.id !== id);
        setItems(next);
        setLeaving((p) => ({ ...p, [id]: null }));
        if (next.length === 0) setFinalPop(true);
      }, 220);
    } catch (err) {
      setLeaving((p) => ({ ...p, [id]: null }));
      alert(err instanceof Error ? err.message : "Reject failed");
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <MainHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-slate-500">Access denied.</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <MainHeader activeNav="admin" />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Counter Edits
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Review edits to counter documentation (current vs proposed).
            </p>
          </div>

          <div className="text-xs font-mono bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400">
            {headerBadge}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 bg-white dark:bg-slate-900 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : pendingCount === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-lg font-semibold">All caught up!</h2>
            <p className="text-slate-500 dark:text-slate-400">
              No pending counter edits.
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            {items.map((it) => {
              const leave = leaving[it.id];

              
              const uiStatus: "pending" | "approved" | "rejected" =
                ((it as any).status as "pending" | "approved" | "rejected") ??
                ((it as any).is_approved ? "approved" : "pending");

              
              const who =
                (it as any).edited_by_username ??
                (it as any).created_by_username ??
                null;

              const edited = safeDate((it as any).edited_at);
              const dateStr = edited ? edited.toLocaleDateString() : "—";
              const timeStr = edited
                ? edited.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—";

              const reviewed = safeDate((it as any).reviewed_at ?? null);
              const reviewedStr = reviewed ? reviewed.toLocaleString() : null;

              const isProcessingThis = processingId === it.id;

              const currentText =
                (((it as any).current_content ?? "") as string).trim() ||
                "(empty / not set)";
              const proposedText =
                (((it as any).content ?? "") as string).trim() || "(empty)";

              const rejectionReason =
                ((it as any).rejection_reason as string | null | undefined) ??
                null;

              return (
                <Card
                  key={it.id}
                  className={
                    "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all duration-200 " +
                    (leave === "approve"
                      ? "opacity-0 translate-x-6"
                      : leave === "reject"
                      ? "opacity-0 -translate-x-6"
                      : "opacity-100 translate-x-0")
                  }
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg truncate">
                          Counter: {(it as any).counter_name || (it as any).counter_id}
                        </CardTitle>

                        <StatusBadge status={uiStatus} />
                      </div>

                      <CardDescription className="text-xs">
                        {who ? `By ${who}` : "Submitted"}
                      </CardDescription>

                      {reviewedStr && (
                        <div className="text-[11px] text-slate-400">
                          Reviewed at: {reviewedStr}
                        </div>
                      )}

                      {rejectionReason && (
                        <div className="text-[11px] text-rose-500">
                          Last rejection reason: {rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="text-right text-xs text-slate-400 whitespace-nowrap">
                      <div>{dateStr}</div>
                      <div className="mt-1">{timeStr}</div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      {/* LEFT: before/after */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* CURRENT */}
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                              Current (in DB)
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm border border-slate-100 dark:border-slate-800/50 whitespace-pre-wrap leading-relaxed min-h-[140px]">
                              {currentText}
                            </div>
                          </div>

                          {/* PROPOSED */}
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                              Proposed
                            </div>
                            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-900/10 rounded-xl text-sm border border-emerald-200/60 dark:border-emerald-900/30 whitespace-pre-wrap leading-relaxed min-h-[140px]">
                              {proposedText}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: actions */}
                      <div className="space-y-4 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6">
                        <div className="space-y-2">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Actions
                          </div>

                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
                            onClick={() => handleApprove(it.id)}
                            disabled={processingId !== null && !isProcessingThis}
                          >
                            {isProcessingThis ? "Processing..." : "Approve Edit"}
                          </Button>
                        </div>

                        <div className="space-y-2 pt-2">
                          <Textarea
                            placeholder="Reason for rejection (required)..."
                            className="text-xs resize-none"
                            value={rejectReason[it.id] || ""}
                            onChange={(e) =>
                              setRejectReason((p) => ({
                                ...p,
                                [it.id]: e.target.value,
                              }))
                            }
                            disabled={processingId !== null && !isProcessingThis}
                          />

                          <Button
                            variant="destructive"
                            className="w-full"
                            onClick={() => handleReject(it.id)}
                            disabled={processingId !== null && !isProcessingThis}
                          >
                            {isProcessingThis ? "Processing..." : "Reject Edit"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <AdminToast
          open={toast.open}
          type={toast.type}
          title={toast.title}
          subtitle={toast.subtitle}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
        />

        <FinalBossPopout
          open={finalPop}
          onClose={() => setFinalPop(false)}
          title="Edits cleared!"
          subtitle="No more edits waiting. Clean finish."
        />
      </main>
    </div>
  );
}
