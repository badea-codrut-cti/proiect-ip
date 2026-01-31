import { useState } from "react";
import { useNavigate } from "react-router";
import { MainHeader } from "~/components/MainHeader";
import { profileClient } from "~/utils/profileClient";
import { useAuth } from "~/context/AuthContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!currentPassword) {
      setError("Current password is required to save changes");
      return;
    }

    const payload: any = { currentPassword };
    if (displayName) payload.displayName = displayName;
    if (email) payload.email = email;
    if (password) payload.password = password;

    setLoading(true);
    try {
      const res = await profileClient.updateProfile(payload);
      setMessage(res.message || "Profile updated");
      setTimeout(() => navigate(`/profile/${user?.id}`), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <MainHeader activeNav={undefined} />

      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-6">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300">Display name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100" />
          </div>

          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full mt-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100" />
          </div>

          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300">New password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full mt-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100" />
          </div>

          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300">Current password (required)</label>
            <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" required className="w-full mt-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100" />
          </div>

          {error && <div className="text-sm text-rose-600">{error}</div>}
          {message && <div className="text-sm text-emerald-600">{message}</div>}

          <div className="flex items-center justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-md" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-slate-900 text-white rounded-md">{loading ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </main>
    </div>
  );
}
