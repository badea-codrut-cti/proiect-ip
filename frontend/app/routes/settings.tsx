import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MainHeader } from "~/components/MainHeader";
import { profileClient } from "~/utils/profileClient";
import { useAuth } from "~/context/AuthContext";
import { apiFetch } from "~/utils/api";
import { Check } from "lucide-react";

interface ProfilePicture {
  id: string;
  name: string;
  description: string;
  cost: number;
}

interface UserProfileData {
  owned_profile_pictures: ProfilePicture[];
  current_profile_picture: {
    id: string;
    name: string;
    description: string;
  } | null;
}

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
  const [fsrsLoading, setFsrsLoading] = useState(false);
  const [fsrsMessage, setFsrsMessage] = useState<string | null>(null);
  const [fsrsError, setFsrsError] = useState<string | null>(null);
  const [profilePictures, setProfilePictures] = useState<ProfilePicture[]>([]);
  const [currentProfilePictureId, setCurrentProfilePictureId] = useState<string | null>(null);
  const [pfpLoading, setPfpLoading] = useState(false);
  const [pfpMessage, setPfpMessage] = useState<string | null>(null);
  const [pfpError, setPfpError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      try {
        const data = await apiFetch<UserProfileData>(`/api/profiles/${user.id}`);
        setProfilePictures(data.owned_profile_pictures);
        setCurrentProfilePictureId(data.current_profile_picture?.id || null);
      } catch (err) {
        console.error("Failed to load profile pictures:", err);
      }
    };

    fetchProfileData();
  }, [user]);

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

  async function handleFsrsRecalculate() {
    setFsrsError(null);
    setFsrsMessage(null);
    setFsrsLoading(true);
    try {
      await profileClient.recalculateFsrsParameters();
      setFsrsMessage("FSRS parameters recalculated successfully");
      setTimeout(() => setFsrsMessage(null), 3000);
    } catch (err) {
      setFsrsError(err instanceof Error ? err.message : "Recalculation failed");
    } finally {
      setFsrsLoading(false);
    }
  }

  async function handleSetProfilePicture(pictureId: string | null) {
    setPfpError(null);
    setPfpMessage(null);
    setPfpLoading(true);
    try {
      await apiFetch("/api/profiles/set-profile-picture", {
        method: "POST",
        body: JSON.stringify({ profilePictureId: pictureId }),
      });
      setCurrentProfilePictureId(pictureId);
      setPfpMessage("Profile picture updated successfully");
      setTimeout(() => setPfpMessage(null), 3000);
    } catch (err) {
      setPfpError(err instanceof Error ? err.message : "Failed to update profile picture");
    } finally {
      setPfpLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <MainHeader activeNav={undefined} />

      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">Settings</h1>

        <section className="mb-6 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Profile Picture</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Choose from your owned profile pictures
          </p>

          {pfpError && <div className="text-sm text-rose-600 mb-3">{pfpError}</div>}
          {pfpMessage && <div className="text-sm text-emerald-600 mb-3">{pfpMessage}</div>}

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {profilePictures.map((picture) => {
              const isSelected = currentProfilePictureId === picture.id;
              return (
                <button
                  key={picture.id}
                  onClick={() => handleSetProfilePicture(picture.id)}
                  disabled={pfpLoading}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isSelected
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img
                      src={`/icons/profile_pictures/${picture.name}.png`}
                      alt={picture.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-50 text-center capitalize">
                    {picture.name.replace(/_/g, ' ')}
                  </span>
                </button>
              );
            })}
          </div>

          {profilePictures.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <p className="text-sm">You don't own any profile pictures yet</p>
              <p className="text-xs mt-1">Visit the shop to purchase some!</p>
            </div>
          )}
        </section>

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

        <section className="mt-6 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">FSRS Parameters</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Recalculate FSRS parameters based on your review history. This may improve spacing algorithm accuracy.</p>

          {fsrsError && <div className="text-sm text-rose-600 mb-3">{fsrsError}</div>}
          {fsrsMessage && <div className="text-sm text-emerald-600 mb-3">{fsrsMessage}</div>}

          <button
            type="button"
            onClick={handleFsrsRecalculate}
            disabled={fsrsLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md"
          >
            {fsrsLoading ? 'Recalculating...' : 'Recalculate FSRS Parameters'}
          </button>
        </section>
      </main>
    </div>
  );
}
