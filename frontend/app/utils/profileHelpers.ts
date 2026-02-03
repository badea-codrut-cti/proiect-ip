import type { UiProfile, UserProfileResponse } from "~/types/profile";

export function computeLevelFromXp(xp: number): { level: number; nextLevelXp: number } {
    if (!Number.isFinite(xp) || xp < 0) {
        return { level: 1, nextLevelXp: 500 };
    }
    const level = Math.max(1, Math.floor(xp / 500) + 1);
    const nextLevelXp = level * 500;
    return { level, nextLevelXp };
}

function calculateStreak(reviewHistory: Record<string, number>): number {
    if (!reviewHistory || Object.keys(reviewHistory).length === 0) {
        return 0;
    }

    // Get all dates with reviews and sort them descending
    const datesWithActivity = Object.keys(reviewHistory)
        .filter(date => reviewHistory[date] > 0)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (datesWithActivity.length === 0) {
        return 0;
    }

    // Check if the most recent review is today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const mostRecentDate = datesWithActivity[0];

    // If most recent review is older than yesterday, streak is broken
    if (mostRecentDate !== todayStr && mostRecentDate !== yesterdayStr) {
        return 0;
    }

    // Start counting from the most recent activity date
    let streak = 0;
    let currentDate = new Date(mostRecentDate);
    currentDate.setHours(0, 0, 0, 0);

    // Count consecutive days backwards
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (reviewHistory[dateStr] && reviewHistory[dateStr] > 0) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

export function mapRealProfileToUi(profile: UserProfileResponse): UiProfile {
    const xp = profile.xp ?? 0;
    const { level, nextLevelXp } = computeLevelFromXp(xp);
    const badgesCount = profile.owned_profile_pictures?.length ?? 0;

    return {
        id: profile.id,
        username: profile.username,
        level,
        xp,
        nextLevelXp,
        gems: profile.gems ?? 0,
        is_admin: profile.is_admin ?? false,
        is_contributor: profile.is_contributor ?? false,
        joinedAt: profile.joined_at,
        streakDays: calculateStreak(profile.review_history || {}),
        badgesCount,
        reviewsCount: Object.values(profile.review_history || {}).reduce((a, b: number) => a + b, 0),
        reviewHistory: profile.review_history || {},
        current_profile_picture: profile.current_profile_picture,
    };
}
