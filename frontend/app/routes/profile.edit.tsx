import { useEffect, useMemo, useState } from "react";
import type { Route } from "./+types/profile.edit";
import { Link, useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import { useAuth } from "~/context/AuthContext";
import { profileClient } from "~/utils/profileClient";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Edit Profile – Nihongo Count" },
    { name: "description", content: "Update your email or password." },
  ];
}

type FormState = {
  username: string; // read-only
  email: string;
  newPassword: string;
  confirmNewPassword: string;
  currentPassword: string;
};

function hasDigit(s: string) {
  return /\d/.test(s);
}

function hasSymbol(s: string) {
  return /[!@#$%^&*()_+={}[\]|\\:;"'<>,.?/~`-]/.test(s);
}

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, loading, mode } = useAuth();

  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    newPassword: "",
    confirmNewPassword: "",
    currentPassword: "",
  });

  const [originalEmail, setOriginalEmail] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (mode === "mock") {
      setForm((f) => ({
        ...f,
        username: user.displayName,
        email: "mock@example.com",
      }));
      setOriginalEmail("mock@example.com");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const p = await profileClient.getProfile(user.id);
        if (cancelled) return;

        const username = p.username ?? "";
        const email = p.email ?? "";

        setForm((f) => ({ ...f, username, email }));
        setOriginalEmail(email);
      } catch (e) {
        if (cancelled) return;

        setForm((f) => ({ ...f, username: user.displayName ?? "" }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, mode, navigate]);

  const changes = useMemo(() => {
    const list: string[] = [];
    if (form.email.trim() && form.email.trim() !== originalEmail.trim()) list.push("email");
    if (form.newPassword.trim()) list.push("password");
    return list;
  }, [form.email, form.newPassword, originalEmail]);

  const onChange =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const validate = (): string | null => {
    const wantsEmail = form.email.trim() !== originalEmail.trim();
    const wantsPassword = form.newPassword.trim().length > 0;

    if (!wantsEmail && !wantsPassword) {
      return "Change your email or set a new password to update.";
    }

    if (!form.currentPassword.trim()) {
      return "Current password is required.";
    }

    if (wantsPassword) {
      if (form.newPassword.length < 6) return "New password must be at least 6 characters.";
      if (form.newPassword.length > 30) return "New password must be at most 30 characters.";
      if (!hasDigit(form.newPassword)) return "New password must contain at least one digit.";
      if (!hasSymbol(form.newPassword)) return "New password must contain at least one symbol.";
      if (form.newPassword !== form.confirmNewPassword) return "New passwords do not match.";
    }

    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) return;

    if (mode === "mock") {
      // UI-only mode
      navigate("/profile");
      return;
    }

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        currentPassword: form.currentPassword,
      };

      if (form.email.trim() !== originalEmail.trim()) {
        payload.email = form.email.trim();
      }
      if (form.newPassword.trim()) {
        payload.password = form.newPassword;
      }

      await profileClient.updateMyProfile(payload);

      navigate("/profile");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-pink-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-900 dark:text-slate-100">
              nihongo count
            </span>
          </div>

          <Button asChild variant="outline" className="text-xs">
            <Link to="/profile">Back</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">Account settings</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            You can update your email or password. Username is fixed.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
          
            <div className="grid gap-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Username (read-only)
              </label>
              <input
              className="h-10 rounded-md border border-slate-200 bg-slate-100 px-3 text-sm text-slate-400 cursor-not-allowed select-none
              dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
              value={form.username}
              readOnly
              tabIndex={-1}
              />

              <p className="text-[0.7rem] text-slate-400 dark:text-slate-500">
                This is the account you are currently logged in with.
              </p>
            </div>

            
            <div className="grid gap-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950"
                type="email"
                value={form.email}
                onChange={onChange("email")}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            
            <div className="grid gap-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                New password (optional)
              </label>
              <input
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950"
                type="password"
                value={form.newPassword}
                onChange={onChange("newPassword")}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <p className="text-[0.7rem] text-slate-400 dark:text-slate-500">
                6–30 chars, include at least one digit and one symbol.
              </p>
            </div>

            
            <div className="grid gap-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Confirm new password
              </label>
              <input
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950"
                type="password"
                value={form.confirmNewPassword}
                onChange={onChange("confirmNewPassword")}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

           
            <div className="grid gap-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Current password <span className="text-red-500">*</span>
              </label>
              <input
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-950"
                type="password"
                value={form.currentPassword}
                onChange={onChange("currentPassword")}
                placeholder="Current password"
                autoComplete="current-password"
                required
              />
              <p className="text-[0.7rem] text-slate-400 dark:text-slate-500">
                Required to apply changes.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                Changes: {changes.length ? changes.join(", ") : "none"}
              </div>
              <Button type="submit" disabled={submitting} className="text-xs">
                {submitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
