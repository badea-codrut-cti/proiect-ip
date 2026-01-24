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

export interface ProfilePicture {
  id: number;
  name: string;
  description: string | null;
  cost: number;
}

export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  xp: number;
  gems: number;
  joined_at: string;
  current_profile_picture: {
    id: number;
    name: string;
    description: string | null;
  } | null;
  owned_profile_pictures: ProfilePicture[];
  display_name?: string;
}

export interface UpdateProfilePayload {
  username?: string;
  email?: string;
  password?: string;
  currentPassword: string;
}

export interface UpdateProfileResponse {
  message: string;
  user?: {
    id: string;
    username: string;
    email: string;
    displayName?: string;
  };
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
  
  updateMyProfile: (payload: UpdateProfilePayload) =>
  apiFetch<UpdateProfileResponse>("/api/auth/profile/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  }),

};
