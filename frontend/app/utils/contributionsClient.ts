import { apiFetch } from "~/utils/api";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type MyExerciseContribution = {
  id: string;
  counter_id: string;
  counter_name: string;
  sentence: string;
  min_count: number;
  max_count: number;
  decimal_points: number;

  is_approved: boolean;
  status: ReviewStatus;
  created_at?: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
};

export type MyCounterEditContribution = {
  id: string;
  counter_id: string;
  counter_name: string;

  current_content: string | null;
  content: string;

  is_approved: boolean;
  status: ReviewStatus;
  edited_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
};

export type MyContributionsResponse = {
  exercises: MyExerciseContribution[];
  counter_edits: MyCounterEditContribution[];
};

export const contributionsClient = {
  getMine: async (): Promise<MyContributionsResponse> => {
    return apiFetch<MyContributionsResponse>("/api/contributions");
  },
};
