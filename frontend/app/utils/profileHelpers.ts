import type { UiProfile, UserProfileResponse } from "~/types/profile";

export function computeLevelFromXp(xp: number): { level: number; nextLevelXp: number } {
    if (!Number.isFinite(xp) || xp < 0) {
        return { level: 1, nextLevelXp: 500 };
    }
    const level = Math.max(1, Math.floor(xp / 500) + 1);
    const nextLevelXp = level * 500;
    return { level, nextLevelXp };
}

export function mapRealProfileToUi(profile: UserProfileResponse): UiProfile {
    const xp = profile.xp ?? 0;
    const { level, nextLevelXp } = computeLevelFromXp(xp);
    const badgesCount = profile.owned_profile_pictures?.length ?? 0;

    return {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        level,
        xp,
        nextLevelXp,
        gems: profile.gems ?? 0,
        joinedAt: profile.joined_at,
        streakDays: 7,
        badgesCount,
        reviewsCount: Object.values(profile.review_history || {}).reduce((a, b: number) => a + b, 0),
        reviewHistory: profile.review_history || {},
    };
}
