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

export type NotificationType =
  | "exercise_approval"
  | "exercise_rejection"
  | "counter_edit_approval"
  | "counter_edit_rejection"
  | "announcement"
  | "feedback"
  | string;

export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
  exercise_id: string | null;
  counter_edit_id: string | null;
  announcement_id: string | null;
  is_read: boolean;
  created_at: string; // ISO-ish
}

export const notificationsClient = {
  list: () => apiFetch<NotificationItem[]>("/api/notifications"),
  markAllRead: () => apiFetch<{ success: boolean }>("/api/notifications/mark-read", { method: "POST" }),
};
