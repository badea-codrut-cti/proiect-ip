// app/utils/authClient.ts

import { apiFetch } from "./api";

export interface AuthUser {
  id: string;          // TEXT in DB
  username: string;
  joined_at?: string;
  is_admin?: boolean;
  is_contributor?: boolean;
  gems?: number;
  current_profile_picture_id?: string;
  current_profile_picture_name?: string;
}

export const authClient = {
  signup: (username: string, email: string, password: string) =>
    apiFetch<{
      message: string;
      user: AuthUser;
      session: {
        id: string;
        expires: string;
      };
    }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),


  login: (identifier: string, password: string) =>
    apiFetch<{
      message: string;
      user: AuthUser;
      session: {
        id: string;
        expires: string;
      };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier,
        password,
      }),
    }),


  me: () =>
    apiFetch<{ user: AuthUser }>("/api/auth/me", {
      method: "GET",
    }),

  logout: () =>
    apiFetch<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    }),

  requestPasswordReset: (email: string) =>
    apiFetch<{}>("/api/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiFetch<{ success: boolean }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),

  getContributorApplications: () =>
    apiFetch<any[]>("/api/contributor-applications/my-applications", {
      method: "GET",
    }),

  applyForContributor: (description: string, jlpt_level?: number | null) =>
    apiFetch<{ success: boolean; application: any }>("/api/contributor-applications", {
      method: "POST",
      body: JSON.stringify({ description, jlpt_level }),
    }),

  getPendingContributorApplications: () =>
    apiFetch<any[]>("/api/contributor-applications/pending", {
      method: "GET",
    }),

  approveContributorApplication: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/contributor-applications/${id}/approve`, {
      method: "POST",
    }),

  rejectContributorApplication: (id: string, reason: string) =>
    apiFetch<{ success: boolean }>(`/api/contributor-applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};
