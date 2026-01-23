export interface ProfilePicture {
    id: number;
    name: string;
    description: string | null;
    cost?: number;
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
    review_history: Record<string, number>;
}

export interface UiProfile {
    id: string;
    username: string;
    email: string;
    level: number;
    xp: number;
    nextLevelXp: number;
    gems: number;
    joinedAt?: string;
    streakDays: number;
    badgesCount: number;
    reviewsCount: number;
    reviewHistory: Record<string, number>;
}
