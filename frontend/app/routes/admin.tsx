import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import { MainHeader } from "~/components/MainHeader";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { useAuth } from "~/context/AuthContext";
import { adminClient, type EditProposal } from "~/utils/adminClient";
import { Check, X, Eye, Info } from "lucide-react";

export function meta() {
  return [
    { title: "Admin Panel – Nihongo Count" },
    { name: "description", content: "Review and approve community edits." },
  ];
}

type Tab = "pending" | "reviewed";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<EditProposal[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [active, setActive] = useState<EditProposal | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    let cancelled = false;
    setFetchLoading(true);
    setFetchError(null);

    (async () => {
      try {
        const data = await adminClient.listProposals();
        if (cancelled) return;
        setItems(data.proposals ?? []);
      } catch (e) {
        if (cancelled) return;
        setFetchError(e instanceof Error ? e.message : "Failed to load proposals");
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const pending = items.filter((p) => p.status === "pending");
  const reviewed = items.filter((p) => p.status !== "pending");

  const list = tab === "pending" ? pending : reviewed;

  const pendingCount = pending.length;

  const openDetails = async (proposal: EditProposal) => {
    setDetailsOpen(true);
    setActive(proposal);

    // optional: fetch fresh details from server
    try {
      const res = await adminClient.getProposal(proposal.id);
      setActive(res.proposal);
    } catch {
      // keep current proposal if details fail
    }
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setActive(null);
  };

  const approve = async (proposalId: string) => {
    // optimistic UI
    setItems((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: "approved" } : p))
    );
    try {
      await adminClient.approveProposal(proposalId);
    } catch (e) {
      // rollback on error
      setItems((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: "pending" } : p))
      );
      alert(e instanceof Error ? e.message : "Approve failed");
    } finally {
      closeDetails();
    }
  };

  const reject = async (proposalId: string) => {
    setItems((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: "rejected" } : p))
    );
    try {
      await adminClient.rejectProposal(proposalId);
    } catch (e) {
      setItems((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: "pending" } : p))
      );
      alert(e instanceof Error ? e.message : "Reject failed");
    } finally {
      closeDetails();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 flex flex-col">
      <MainHeader activeNav="admin" />

      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <section className="space-y-1">
            <h1 className="text-3xl font-semibold">Admin Panel</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Review and approve community-submitted edits.
            </p>
          </section>

          <section className="flex flex-wrap items-center gap-3">
            <TabButton
              active={tab === "pending"}
              onClick={() => setTab("pending")}
              label={`Pending Review (${pendingCount})`}
            />
            <TabButton
              active={tab === "reviewed"}
              onClick={() => setTab("reviewed")}
              label={`Recently Reviewed (${reviewed.length})`}
            />
          </section>

          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {tab === "pending" ? "Pending Review" : "Recently Reviewed"}
              </CardTitle>
              <CardDescription className="text-xs">
                {tab === "pending"
                  ? "Approve or reject proposed edits."
                  : "Latest accepted / rejected proposals."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {fetchLoading && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Loading proposals…
                </p>
              )}

              {fetchError && !fetchLoading && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                  {fetchError}
                </div>
              )}

              {!fetchLoading && !fetchError && list.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nothing here yet.
                </p>
              )}

              {!fetchLoading && !fetchError && list.length > 0 && (
                <div className="space-y-4">
                  {list.map((p) => (
                    <ProposalCard
                      key={p.id}
                      proposal={p}
                      onView={() => openDetails(p)}
                      onApprove={() => approve(p.id)}
                      onReject={() => reject(p.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {detailsOpen && active && (
        <ProposalModal
          proposal={active}
          onClose={closeDetails}
          onApprove={() => approve(active.id)}
          onReject={() => reject(active.id)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase border transition " +
        (active
          ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-800")
      }
    >
      {label}
    </button>
  );
}

function ProposalCard({
  proposal,
  onView,
  onApprove,
  onReject,
}: {
  proposal: EditProposal;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const statusPill =
    proposal.status === "pending"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200"
      : proposal.status === "approved"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
      : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200";

  const typeLabel =
    proposal.type === "description_edit" ? "Description Edit" : "New Sentence";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold">
            {proposal.counter_name}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
              {typeLabel}
            </span>
            <span>
              Submitted by <span className="font-medium">{proposal.submitted_by}</span>
            </span>
            <span>•</span>
            <span>{new Date(proposal.submitted_at).toLocaleDateString()}</span>
          </div>
        </div>

        <span className={"rounded-full px-3 py-1 text-xs font-medium " + statusPill}>
          {proposal.status[0].toUpperCase() + proposal.status.slice(1)}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {proposal.type === "description_edit" ? (
          <>
            <p className="text-xs font-semibold">Description Changes:</p>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-slate-700 dark:border-red-900 dark:bg-red-950 dark:text-slate-100">
              <div className="text-[0.65rem] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Old
              </div>
              <div className="mt-1">
                {proposal.old_description || <em className="text-slate-400">Empty</em>}
              </div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-slate-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-slate-100">
              <div className="text-[0.65rem] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                New
              </div>
              <div className="mt-1">
                {proposal.new_description || <em className="text-slate-400">Empty</em>}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold">Proposed Sentence:</p>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-slate-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-slate-100">
              {proposal.proposed_sentence || <em className="text-slate-400">Empty</em>}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full text-xs"
          onClick={onView}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </Button>

        {proposal.status === "pending" && (
          <>
            <Button
              type="button"
              size="sm"
              className="rounded-full text-xs"
              onClick={onApprove}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>

            <Button
              type="button"
              size="sm"
              className="rounded-full text-xs bg-red-600 hover:bg-red-700"
              onClick={onReject}
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ProposalModal({
  proposal,
  onClose,
  onApprove,
  onReject,
}: {
  proposal: EditProposal;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const typeLabel =
    proposal.type === "description_edit" ? "Description Edit" : "New Sentence";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Proposal Details</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium">Counter:</span> {proposal.counter_name} •{" "}
              <span className="font-medium">Type:</span> {typeLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {proposal.type === "description_edit" ? (
            <>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950">
                <div className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Current version
                </div>
                <div className="mt-2 text-slate-800 dark:text-slate-100">
                  {proposal.old_description || <em className="text-slate-400">Empty</em>}
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950">
                <div className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Proposed version
                </div>
                <div className="mt-2 text-slate-800 dark:text-slate-100">
                  {proposal.new_description || <em className="text-slate-400">Empty</em>}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950">
              <div className="text-[0.7rem] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Proposed sentence
              </div>
              <div className="mt-2 text-slate-800 dark:text-slate-100">
                {proposal.proposed_sentence || <em className="text-slate-400">Empty</em>}
              </div>

              {(proposal.min_count != null || proposal.max_count != null) && (
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-300">
                  Range: {proposal.min_count ?? "?"} – {proposal.max_count ?? "?"}
                </div>
              )}
            </div>
          )}

          {proposal.status !== "pending" && (
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              <Info className="h-4 w-4" />
              This proposal is already <span className="font-semibold">{proposal.status}</span>.
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {proposal.status === "pending" && (
            <>
              <Button
                type="button"
                className="rounded-full"
                onClick={onApprove}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>

              <Button
                type="button"
                className="rounded-full bg-red-600 hover:bg-red-700"
                onClick={onReject}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}

          <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
