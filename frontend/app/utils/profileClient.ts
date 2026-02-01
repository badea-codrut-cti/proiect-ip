import { type UserProfileResponse, type ProfilePicture } from "~/types/profile";
import { apiFetch } from "./api";


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
  updateProfile: (payload: { displayName?: string | null; email?: string | null; password?: string | null; currentPassword: string }) =>
    apiFetch<{ message: string; user: { id: string; username: string; email: string; displayName: string } }>(
      "/api/auth/profile/me",
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    ),
};
