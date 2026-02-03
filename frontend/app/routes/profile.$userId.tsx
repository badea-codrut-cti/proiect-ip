import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ActivityCalendar } from "react-activity-calendar";
import {
  Target,
  Flame,
  Medal,
  ShieldCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useAuth } from "~/context/AuthContext";
import { MainHeader } from "~/components/MainHeader";
import { profileClient } from "~/utils/profileClient";
import { mapRealProfileToUi } from "~/utils/profileHelpers";
import { apiFetch } from "~/utils/api";
import type { UiProfile } from "~/types/profile";
import { useWalkthrough } from "~/context/WalkthroughContext";

import avatarImg from "~/assets/avatars/user-default.png";

export function meta() {
  return [
    { title: "User Profile" },
    { name: "description", content: "View user profile" },
  ];
}

interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  earned_at: string | null;
}

const codeToImageName = (code: string): string => {
  return code.toLowerCase();
};

export default function UserProfile() {
  const params = useParams();
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const { currentStep, complete } = useWalkthrough();
  const userId = params.userId;

  const [uiProfile, setUiProfile] = useState<UiProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOwnProfile = authUser?.id === userId;

  useEffect(() => {
    if (!userId) {
      setError("User ID is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      profileClient.getProfile(userId),
      apiFetch<Badge[]>(`/api/profiles/badges/user/${userId}`)
    ])
      .then(([profileData, badgesData]) => {
        setUiProfile(mapRealProfileToUi(profileData));
        setBadges(badgesData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load profile");
        setLoading(false);
      });

    if (currentStep !== "completed" && currentStep !== "none" && isOwnProfile) {
      complete();
    }
  }, [userId, isOwnProfile, currentStep, complete]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">Loading profile...</div>
      </div>
    );
  }

  if (error || !uiProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "Profile not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const xpPercent = uiProfile.nextLevelXp > 0
    ? Math.min(100, Math.round((uiProfile.xp / uiProfile.nextLevelXp) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col dark:bg-slate-950 dark:text-slate-50">
      <MainHeader />

      <main className="flex-1 bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                <img
                  src={`/icons/profile_pictures/${uiProfile.current_profile_picture?.name || 'default'}.png`}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-slate-900 dark:text-slate-50">{uiProfile.username}</h1>
                  {uiProfile.is_admin && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[0.65rem] font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                      <ShieldCheck className="h-3 w-3" />
                      ADMIN
                    </span>
                  )}
                  {uiProfile.is_contributor && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                      <Medal className="h-3 w-3" />
                      CONTRIBUTOR
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">Level {uiProfile.level}</div>
                <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-300">
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden max-w-xs">
                    <div className="h-full rounded-full bg-slate-900 dark:bg-slate-50" style={{ width: `${xpPercent}%` }} />
                  </div>
                  <div>{uiProfile.xp}/{uiProfile.nextLevelXp} XP</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-900 dark:text-amber-200">
                <Flame className="h-3 w-3" />
                <span>{uiProfile.streakDays} Day Streak</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sky-700 dark:bg-sky-900 dark:text-sky-200">
                <Medal className="h-3 w-3" />
                <span>{badges.filter(b => b.earned_at !== null).length} Badges</span>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                <Target className="h-3 w-3" />
                <span>{uiProfile.reviewsCount} Reviews</span>
              </div>
            </div>
          </section>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Contribution Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center overflow-x-auto pb-6">
              {Object.keys(uiProfile.reviewHistory).length > 0 ? (
                <ActivityCalendar
                  data={Object.entries(uiProfile.reviewHistory).map(([date, count]) => ({
                    date,
                    count: count as number,
                    level: Math.min(4, count as number) as 0 | 1 | 2 | 3 | 4,
                  }))}
                  theme={{
                    light: ["#e2e8f0", "#dcfce7", "#86efac", "#22c55e", "#15803d"],
                    dark: ["#1e293b", "#064e3b", "#059669", "#10b981", "#34d399"],
                  }}
                  labels={{ totalCount: "{{count}} reviews in the last year" }}
                  fontSize={12}
                  blockSize={12}
                  blockMargin={4}
                  blockRadius={2}
                />
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  No activity recorded in the last year.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Earned Badges</CardTitle>
            </CardHeader>
            <CardContent>
              {badges.filter(b => b.earned_at !== null).length > 0 ? (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                  {badges.filter(b => b.earned_at !== null).map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" title={badge.description}>
                      <img src={`/icons/badges/${codeToImageName(badge.code)}.png`} alt={badge.name} className="h-10 w-10 object-contain" />
                      <span className="text-[0.65rem] font-medium text-center">{badge.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  <p className="text-sm">No badges earned yet</p>
                  <p className="text-xs mt-1">Complete exercises to earn your first badge!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
