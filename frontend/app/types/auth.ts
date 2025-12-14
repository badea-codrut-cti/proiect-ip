export type Role = "learner" | "contributor" | "admin";

export interface UiUser {
  id: string;
  displayName: string;
  avatarInitials: string;
  role: Role;
  level: number;
  xp: number;
  nextLevelXp: number;
}
