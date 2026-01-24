import { type UserProfileResponse, type ProfilePicture } from "~/types/profile";

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


export const profileClient = {
  getProfile: (userId: string) =>
    apiFetch<UserProfileResponse>(`/api/profiles/${encodeURIComponent(userId)}`),

  getAvailableProfilePictures: () =>
    apiFetch<{ profile_pictures: ProfilePicture[] }>(
      "/api/profiles/profile-pictures/available"
    ),

  setProfilePicture: (profilePictureId: number | null) =>
    apiFetch<{ success: boolean }>("/api/profiles/set-profile-picture", {
      method: "POST",
      body: JSON.stringify({ profilePictureId }),
    }),

  buyProfilePicture: (profilePictureId: number) =>
    apiFetch<{ success: boolean; gems_spent?: number; gems_remaining?: number }>(
      "/api/profiles/buy-profile-picture",
      {
        method: "POST",
        body: JSON.stringify({ profilePictureId }),
      }
    ),
};
