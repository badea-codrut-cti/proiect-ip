export type Role = "learner" | "contributor" | "admin";

export interface UiUser {
  id: string;
  displayName: string;
  avatarInitials: string;
  role: Role;
  level: number;
  xp: number;
  nextLevelXp: number;
  is_admin: boolean;
  is_contributor: boolean;
  gems?: number;
  current_profile_picture_id?: string;
  current_profile_picture_name?: string;
}
