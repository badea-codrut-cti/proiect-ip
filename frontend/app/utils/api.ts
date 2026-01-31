const BROWSER_API = import.meta.env.VITE_API_URL || "http://localhost:5000";


const SSR_API =
  (typeof process !== "undefined" && process.env && process.env.INTERNAL_API_URL) ||
  (typeof process !== "undefined" && process.env && process.env.VITE_API_URL) ||
  "http://localhost:5000";

const API_BASE = typeof window === "undefined" ? SSR_API : BROWSER_API;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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
