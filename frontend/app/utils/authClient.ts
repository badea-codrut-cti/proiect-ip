// app/utils/authClient.ts

import { apiFetch } from "./api";

export interface AuthUser {
  id: string;          // TEXT in DB
  username: string;
  email: string;
  joined_at?: string;
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
};
