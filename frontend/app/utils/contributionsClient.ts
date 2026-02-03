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

  status: ReviewStatus;

  created_at: string;              
  updated_at: string | null;       
  reviewed_at: string | null;
  rejection_reason: string | null;

  approved_by: string | null;
};

export type MyCounterEditContribution = {
  id: string;
  counter_id: string;
  counter_name: string;

  current_content: string | null;  // din counters.documentation
  content: string;                 // propunerea

  status: ReviewStatus;

  created_at: string;              
  updated_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;

  approved_by: string | null;
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
