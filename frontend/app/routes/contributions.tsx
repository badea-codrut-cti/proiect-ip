import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
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
import {
  contributionsClient,
  type MyExerciseContribution,
  type MyCounterEditContribution,
} from "~/utils/contributionsClient";

type Tab = "exercises" | "edits";
type StatusFilter = "all" | "pending" | "approved" | "rejected";
type SortKey = "created" | "reviewed" | "name";
type SortDir = "desc" | "asc";

function safeDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function shortId(id?: string) {
  if (!id) return "";
  return id.slice(0, 8);
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const cls =
    status === "pending"
      ? "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-900/25 dark:text-amber-200 dark:ring-amber-900/40"
      : status === "approved"
      ? "bg-emerald-100 text-emerald-900 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-200 dark:ring-emerald-900/40"
      : "bg-rose-100 text-rose-900 ring-rose-200 dark:bg-rose-900/25 dark:text-rose-200 dark:ring-rose-900/40";

  const dot =
    status === "pending"
      ? "bg-amber-500"
      : status === "approved"
      ? "bg-emerald-500"
      : "bg-rose-500";

  return (
    <span className={`inline-flex items-center gap-2 px-3 h-7 rounded-full text-xs font-semibold ring-1 ${cls}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {status.toUpperCase()}
    </span>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "pending" | "approved" | "rejected";
}) {
  const cls =
    tone === "pending"
      ? "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-100 dark:ring-amber-900/40"
      : tone === "approved"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-100 dark:ring-emerald-900/40"
      : "bg-rose-50 text-rose-900 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-100 dark:ring-rose-900/40";

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ring-1 ${cls}`}>
      <span className="text-xs uppercase tracking-wide opacity-80">{label}</span>
      <span className="ml-auto font-bold tabular-nums">{value}</span>
    </div>
  );
}

function AdminFeedback({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-rose-200/70 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-900/15 p-4">
      <div className="flex items-center gap-2 text-rose-700 dark:text-rose-200 text-sm font-semibold">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/30">
          !
        </span>
        Admin feedback
      </div>
      <div className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}

export default function ContributionsPage() {
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>("exercises");
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<MyExerciseContribution[]>([]);
  const [edits, setEdits] = useState<MyCounterEditContribution[]>([]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    contributionsClient
      .getMine()
      .then((data) => {
        setExercises(data.exercises ?? []);
        setEdits(data.counter_edits ?? []);
      })
      .catch(() => {
        setExercises([]);
        setEdits([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const counts = useMemo(() => {
    const all = [...exercises, ...edits];
    const pending = all.filter((x) => x.status === "pending").length;
    const approved = all.filter((x) => x.status === "approved").length;
    const rejected = all.filter((x) => x.status === "rejected").length;
    return { pending, approved, rejected, total: all.length };
  }, [exercises, edits]);

  const rawItems = tab === "exercises" ? exercises : edits;

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();

    let filtered = rawItems.filter((it: any) => {
      if (statusFilter !== "all" && it.status !== statusFilter) return false;

      if (q) {
        const name = String(it.counter_name ?? "").toLowerCase();
        const cid = String(it.counter_id ?? "").toLowerCase();
        const iid = String(it.id ?? "").toLowerCase();
        if (!name.includes(q) && !cid.includes(q) && !iid.includes(q)) return false;
      }

      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;

    filtered.sort((a: any, b: any) => {
      if (sortKey === "name") {
        const an = String(a.counter_name ?? "").toLowerCase();
        const bn = String(b.counter_name ?? "").toLowerCase();
        if (an < bn) return -1 * dir;
        if (an > bn) return 1 * dir;
        return 0;
      }

      if (sortKey === "reviewed") {
        const ad = safeDate(a.reviewed_at)?.getTime() ?? 0;
        const bd = safeDate(b.reviewed_at)?.getTime() ?? 0;
        return (ad - bd) * dir;
      }

      const ad = safeDate(a.created_at)?.getTime() ?? 0;
      const bd = safeDate(b.created_at)?.getTime() ?? 0;
      return (ad - bd) * dir;
    });

    return filtered;
  }, [rawItems, statusFilter, query, sortKey, sortDir]);

  const pendingCountBadge = useMemo(() => `${items.length} SHOWN`, [items.length]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <MainHeader />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">My Contributions</h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                See what you have sent (new exercises/edits) and their status.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-[520px]">
              <div className="col-span-2 sm:col-span-1 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900 p-3">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">total</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">{counts.total}</div>
              </div>
              <StatPill label="pending" value={counts.pending} tone="pending" />
              <StatPill label="approved" value={counts.approved} tone="approved" />
              <StatPill label="rejected" value={counts.rejected} tone="rejected" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="inline-flex rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 p-1">
            <button
              onClick={() => setTab("exercises")}
              className={[
                "px-4 py-2 rounded-xl text-sm font-semibold transition",
                tab === "exercises"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60",
              ].join(" ")}
            >
              New Exercises <span className="ml-2 text-xs opacity-80">({exercises.length})</span>
            </button>

            <button
              onClick={() => setTab("edits")}
              className={[
                "px-4 py-2 rounded-xl text-sm font-semibold transition",
                tab === "edits"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60",
              ].join(" ")}
            >
              Counter Edits <span className="ml-2 text-xs opacity-80">({edits.length})</span>
            </button>
          </div>
        </div>

        {/* Filters + Sort */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by counter name / id / item id..."
                className="h-10 w-full sm:w-[320px] rounded-xl px-3 text-sm bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 outline-none"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-10 rounded-xl px-3 text-sm bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 outline-none"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-10 rounded-xl px-3 text-sm bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 outline-none"
              >
                <option value="created">Submitted date</option>
                <option value="reviewed">Reviewed date</option>
                <option value="name">Counter name</option>
              </select>

              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as SortDir)}
                className="h-10 rounded-xl px-3 text-sm bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 outline-none"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                className="rounded-xl"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  setSortKey("created");
                  setSortDir("desc");
                }}
              >
                Reset
              </Button>

              <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{items.length}</span> of{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{rawItems.length}</span>{" "}
                <span className="ml-2 text-xs font-mono bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-full">
                  {pendingCountBadge}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 p-8">
            <div className="text-slate-500">Loading contributions...</div>
          </div>
        ) : rawItems.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="text-lg font-semibold">You haven't sent anything here yet..</div>
            <div className="mt-2 text-slate-500 dark:text-slate-400">
              When you submit an exercise or edit, it will appear here.
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="text-lg font-semibold">N-am găsit nimic pentru filtrul curent.</div>
            <div className="mt-2 text-slate-500 dark:text-slate-400">
              Try another status / search for something else / press Reset.
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {items.map((it: any) => {
              const created = safeDate(it.created_at);
              const reviewed = safeDate(it.reviewed_at);

              const dateStr = created ? created.toLocaleString() : "—";
              const reviewedStr = reviewed ? reviewed.toLocaleString() : null;

              return (
                <Card
                  key={it.id}
                  className="border-0 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 rounded-3xl overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <CardTitle className="text-lg font-bold truncate">
                            {it.counter_name}
                            <span className="ml-2 text-xs font-mono text-slate-400 dark:text-slate-500">
                              #{shortId(it.counter_id)}
                            </span>
                          </CardTitle>
                          <StatusBadge status={it.status} />
                        </div>

                        <CardDescription className="mt-2 text-sm">
                          <span className="text-slate-500 dark:text-slate-400">
                            {tab === "exercises" ? "Submitted:" : "Submitted:"}
                          </span>{" "}
                          <span className="text-slate-700 dark:text-slate-200">{dateStr}</span>
                          {reviewedStr && (
                            <>
                              <span className="mx-2 text-slate-300 dark:text-slate-700">•</span>
                              <span className="text-slate-500 dark:text-slate-400">Reviewed:</span>{" "}
                              <span className="text-slate-700 dark:text-slate-200">{reviewedStr}</span>
                            </>
                          )}
                        </CardDescription>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          className="rounded-xl"
                          onClick={() => navigator.clipboard.writeText(it.id)}
                        >
                          Copy item id
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 pb-6">
                    {"sentence" in it ? (
                      <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Sentence
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 ring-1 ring-slate-200 dark:ring-slate-800 whitespace-pre-wrap text-sm leading-relaxed">
                          {(it.sentence ?? "").replace(/<ans>/g, "____")}
                        </div>

                        {it.status === "rejected" && it.rejection_reason && (
                          <AdminFeedback text={it.rejection_reason} />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 bg-slate-50 dark:bg-slate-800/30 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                              Current (in DB)
                            </div>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed min-h-[120px] text-slate-700 dark:text-slate-200">
                              {(it.current_content ?? "").trim() || "(empty / not set)"}
                            </div>
                          </div>

                          <div className="rounded-2xl ring-1 ring-emerald-200/70 dark:ring-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-200/80 mb-2">
                              Proposed
                            </div>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed min-h-[120px] text-slate-700 dark:text-slate-200">
                              {(it.content ?? "").trim() || "(empty)"}
                            </div>
                          </div>
                        </div>

                        {it.status === "rejected" && it.rejection_reason && (
                          <AdminFeedback text={it.rejection_reason} />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
