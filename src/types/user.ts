import type { Language, Theme } from "@/lib/constants";

export interface UserProfile {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  preferredLanguage: Language;
  theme: Theme;
  totalQuizzes: number;
  totalCorrect: number;
  streakDays: number;
  lastActiveAt: Date | null;
  createdAt: Date;
}

export interface AuthUser {
  id: string;
  email: string | null;
  profile: UserProfile | null;
}
