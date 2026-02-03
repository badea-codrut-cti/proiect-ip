export interface ProfilePicture {
    id: number;
    name: string;
    description: string | null;
    cost?: number;
}

export interface UserProfileResponse {
    id: string;
    username: string;
    xp: number;
    gems: number;
    is_admin: boolean;
    is_contributor: boolean;
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
    level: number;
    xp: number;
    nextLevelXp: number;
    gems: number;
    is_admin: boolean;
    is_contributor: boolean;
    joinedAt?: string;
    streakDays: number;
    badgesCount: number;
    reviewsCount: number;
    reviewHistory: Record<string, number>;
    current_profile_picture?: {
        id: number;
        name: string;
        description: string | null;
    } | null;
}
