const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.error || `Request failed with ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export type ProposalStatus = "pending" | "approved" | "rejected";

export interface EditProposal {
  id: string;
  counter_id: string;
  counter_name: string;
  type: "description_edit" | "new_sentence";
  submitted_by: string;
  submitted_at: string; 
  status: ProposalStatus;

  // description edits
  old_description?: string | null;
  new_description?: string | null;

  // sentence proposals
  proposed_sentence?: string | null;
  min_count?: number | null;
  max_count?: number | null;
}

export const adminClient = {
  listProposals: () =>
    apiFetch<{ proposals: EditProposal[] }>("/api/admin/proposals"),

  getProposal: (proposalId: string) =>
    apiFetch<{ proposal: EditProposal }>(
      `/api/admin/proposals/${encodeURIComponent(proposalId)}`
    ),

  approveProposal: (proposalId: string) =>
    apiFetch<{ success: boolean }>(
      `/api/admin/proposals/${encodeURIComponent(proposalId)}/approve`,
      { method: "POST" }
    ),

  rejectProposal: (proposalId: string) =>
    apiFetch<{ success: boolean }>(
      `/api/admin/proposals/${encodeURIComponent(proposalId)}/reject`,
      { method: "POST" }
    ),
};
