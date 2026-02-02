import { apiFetch } from "~/utils/api";

const endpoints = {
  // Lists
  pendingContributorApps: "/api/contributor-applications/pending",
  pendingExercises: "/api/exercises/pending",
  pendingCounterEdits: "/api/counter-edits/pending",

  // Approve / Reject pentru EXERCISES
  approveExercise: (id: string) => `/api/exercises/${encodeURIComponent(id)}/approve`,
  rejectExercise: (id: string) => `/api/exercises/${encodeURIComponent(id)}/reject`,

  // Approve / Reject pentru COUNTER-EDITS
  approveCounterEdit: (id: string) => `/api/counter-edits/${encodeURIComponent(id)}/approve`,
  rejectCounterEdit: (id: string) => `/api/counter-edits/${encodeURIComponent(id)}/reject`,
};

export type ReviewStatus = "pending" | "approved" | "rejected";

export type AdminCounts = {
  pending_contributor_apps: number;
  pending_new_sentences: number; // exercises
  pending_edited_sentences: number; // counter-edits
};

export type PendingSentenceNew = {
  id: string;

  created_by: string | null;
  approved_by: string | null;

  counter_id: string;
  sentence: string;

  min_count: number;
  max_count: number;
  decimal_points: number;

  status?: ReviewStatus | null;

  created_at?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;

  created_by_username?: string | null;
  counter_name?: string | null;
};

/**
 * COUNTER-EDITS (edited counters)
 * DB: counter_edits
 * + JOIN: edited_by_username, counter_name, current_content
 */
export type PendingSentenceEdit = {
  id: string;
  edited_by: string;
  approved_by: string | null;
  counter_id: string;

  // PROPOSED
  content: string;

  // CURRENT (din counters)
  current_content?: string | null;


  status?: ReviewStatus | null;

  edited_at: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;

  edited_by_username?: string | null;
  counter_name?: string | null;
};

/**
 * Contributor applications
 */
export type PendingContributorApplication = {
  id: string;
  user_id: string;
  applied_at: string;

  description: string;
  jlpt_level: number | null;

  status: ReviewStatus;
  reviewed_at: string | null;
  approved_by: string | null;

  username: string;
  email: string;
};

type SimpleSuccess = { success: boolean; message?: string };


function normalizeList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as any).items)) return (raw as any).items as T[];
  return [];
}

export const adminReviewClient = {
  getCounts: async (): Promise<AdminCounts> => {
    const [appsRaw, exercisesRaw, editsRaw] = await Promise.all([
      apiFetch<PendingContributorApplication[] | { items: PendingContributorApplication[] } | unknown>(
        endpoints.pendingContributorApps
      ),
      apiFetch<PendingSentenceNew[] | { items: PendingSentenceNew[] } | unknown>(endpoints.pendingExercises),
      apiFetch<PendingSentenceEdit[] | { items: PendingSentenceEdit[] } | unknown>(endpoints.pendingCounterEdits),
    ]);

    const apps = normalizeList<PendingContributorApplication>(appsRaw);
    const exercises = normalizeList<PendingSentenceNew>(exercisesRaw);
    const edits = normalizeList<PendingSentenceEdit>(editsRaw);

    return {
      pending_contributor_apps: apps.length,
      pending_new_sentences: exercises.length,
      pending_edited_sentences: edits.length,
    };
  },

  // ===== Contributor applications =====
  getPendingContributorApps: async (): Promise<{ items: PendingContributorApplication[] }> => {
    const raw = await apiFetch<PendingContributorApplication[] | { items: PendingContributorApplication[] } | unknown>(
      endpoints.pendingContributorApps
    );
    return { items: normalizeList<PendingContributorApplication>(raw) };
  },

  // ===== EXERCISES =====
  getPendingNewSentences: async (): Promise<{ items: PendingSentenceNew[] }> => {
    const raw = await apiFetch<PendingSentenceNew[] | { items: PendingSentenceNew[] } | unknown>(endpoints.pendingExercises);
    return { items: normalizeList<PendingSentenceNew>(raw) };
  },

  approveNewSentence: (id: string) =>
    apiFetch<SimpleSuccess>(endpoints.approveExercise(id), { method: "POST" }),

  rejectNewSentence: (id: string, reason: string) =>
    apiFetch<SimpleSuccess>(endpoints.rejectExercise(id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }),

  // ===== COUNTER-EDITS =====
  getPendingEditedSentences: async (): Promise<{ items: PendingSentenceEdit[] }> => {
    const raw = await apiFetch<PendingSentenceEdit[] | { items: PendingSentenceEdit[] } | unknown>(endpoints.pendingCounterEdits);
    return { items: normalizeList<PendingSentenceEdit>(raw) };
  },

  approveEditSentence: (id: string) =>
    apiFetch<SimpleSuccess>(endpoints.approveCounterEdit(id), { method: "POST" }),

  rejectEditSentence: (id: string, reason: string) =>
    apiFetch<SimpleSuccess>(endpoints.rejectCounterEdit(id), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }),
};
