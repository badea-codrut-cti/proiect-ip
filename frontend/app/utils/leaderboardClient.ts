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

export type WeeklyLeaderboardUser = {
  id: string;
  username: string;
  display_name: string | null;
  points: number;
  rank: number;
};

export type WeeklyLeaderboardResponse = {
  week_start: string; // ISO-ish date
  top_users: WeeklyLeaderboardUser[];
  user_rank: { rank: number | null; points: number } | null;
};

export const leaderboardClient = {
  weekly: () => apiFetch<WeeklyLeaderboardResponse>("/api/leaderboard/weekly"),
};
