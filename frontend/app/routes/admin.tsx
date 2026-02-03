import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { MainHeader } from "~/components/MainHeader";
import { useAuth } from "~/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { adminReviewClient, type AdminCounts } from "~/utils/adminReviewClient";
import {
  ShieldCheck,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  MessageSquarePlus,
  PencilLine,
} from "lucide-react";

function ProgressRing({ percent, subtitle }: { percent: number; subtitle: string }) {
  const p = Math.max(0, Math.min(100, percent));

  const size = 132;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  const isClean = p >= 99.9;

  return (
    <div className="relative isolate">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full blur-2xl bg-gradient-to-tr from-sky-400/25 via-fuchsia-400/20 to-emerald-400/20 dark:from-sky-400/20 dark:via-fuchsia-400/15 dark:to-emerald-400/15" />

      <div className="relative z-10 flex items-center gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <svg width={size} height={size} className="block">
            <defs>
              <linearGradient id="adminRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>

              <filter id="softGlow">
                <feGaussianBlur stdDeviation="1.2" />
              </filter>
            </defs>

            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              className="text-slate-200 dark:text-slate-800"
              stroke="currentColor"
            />

            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              stroke="url(#adminRing)"
              filter="url(#softGlow)"
              className="transition-[stroke-dasharray] duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums">{Math.round(p)}%</div>
              <div className="mt-0.5 text-[0.65rem] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                Done
              </div>
            </div>
          </div>

          {isClean && (
            <div className="pointer-events-none absolute inset-2 rounded-full ring-2 ring-emerald-300/50 dark:ring-emerald-500/25 animate-pulse" />
          )}
        </div>

        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            <Sparkles className="h-4 w-4" />
            Queue status
          </div>

          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
            {isClean ? "Clean." : "In progress"}
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>

          {isClean && (
            <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
              All clear ✨
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  description,
  icon,
  value,
  loading,
  to,
  cta,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: number;
  loading: boolean;
  to: string;
  cta: string;
}) {
  return (
    <Card className="relative group border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-gradient-to-r from-sky-400/0 via-sky-400/10 to-fuchsia-400/0 opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <div className="text-xs text-slate-500 dark:text-slate-400">{description}</div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100 group-hover:scale-[1.03] transition-transform">
            {icon}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-end justify-between gap-3">
          <div>
            {loading ? (
              <div className="h-7 w-16 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
            ) : (
              <div className="text-3xl font-semibold tabular-nums">{value}</div>
            )}

            <div className="mt-1 text-[0.7rem] text-slate-400 dark:text-slate-500">
              {value === 0 ? "nothing pending" : "items pending"}
            </div>
          </div>

          <Button asChild className="rounded-full">
            <Link to={to} className="inline-flex items-center gap-2">
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading, mode } = useAuth();

  const [counts, setCounts] = useState<AdminCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      if (authLoading) return;

      if (!user || user.role !== "admin") {
        setCounts(null);
        setLoadingCounts(false);
        return;
      }

      if (mode === "mock") {
        setCounts({
          pending_contributor_apps: 2,
          pending_new_sentences: 3,
          pending_edited_sentences: 5,
        });
        setLoadingCounts(false);
        return;
      }

      setLoadingCounts(true);
      try {
        const data = await adminReviewClient.getCounts();
        if (cancelled) return;
        setCounts(data);
      } catch {
        if (cancelled) return;
        setCounts({
          pending_contributor_apps: 0,
          pending_new_sentences: 0,
          pending_edited_sentences: 0,
        });
      } finally {
        if (!cancelled) setLoadingCounts(false);
      }
    }

    loadCounts();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, mode]);

  const totalPending = useMemo(() => {
    if (!counts) return 0;
    return (
      (counts.pending_contributor_apps ?? 0) +
      (counts.pending_new_sentences ?? 0) +
      (counts.pending_edited_sentences ?? 0)
    );
  }, [counts]);

  const ringPercent =
    totalPending === 0 ? 100 : Math.max(8, Math.min(96, 100 - totalPending * 6));

  const ringSubtitle =
    totalPending === 0
      ? "Everything is reviewed and approved."
      : `${totalPending} item(s) waiting for review.`;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-slate-500 uppercase tracking-widest text-xs">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const cApps = counts?.pending_contributor_apps ?? 0;
  const cNew = counts?.pending_new_sentences ?? 0;
  const cEdits = counts?.pending_edited_sentences ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <MainHeader activeNav="admin" />

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              Admin
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Quick overview of your moderation queues.
            </p>
          </div>

          <div className="lg:w-[420px]">
            <ProgressRing percent={ringPercent} subtitle={ringSubtitle} />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <StatCard
            title="Contributor apps"
            description="Approve / reject requests"
            icon={<LayoutDashboard className="h-5 w-5" />}
            value={cApps}
            loading={loadingCounts}
            to="/admin/contributor-applications"
            cta="Open"
          />

          <StatCard
            title="New sentences"
            description="Approve new submissions"
            icon={<MessageSquarePlus className="h-5 w-5" />}
            value={cNew}
            loading={loadingCounts}
            to="/admin/exercises/new"
            cta="Review"
          />

          <StatCard
            title="Edited sentences"
            description="Review sentence edits"
            icon={<PencilLine className="h-5 w-5" />}
            value={cEdits}
            loading={loadingCounts}
            to="/admin/counter-edits"
            cta="Review"
          />
        </div>
      </main>
    </div>
  );
}
