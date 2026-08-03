import { api } from './api';

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  avatar: string;
  booksCompleted: number;
  pagesRead: number;
  readingHours: number;
  readingStreak: number;
  topBadge: string | null;
}

export interface UserStatistics {
  id: number;
  userId: number;
  booksRead: number;
  pagesRead: number;
  readingHours: number;
  currentStreak: number;
  maxStreak: number;
  lastReadDate: string | null;
  currentRank: number;
  globalRank: number;
}

export interface Achievement {
  id: number;
  type: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export const analyticsService = {
  getMonthlyLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const res = await api.get('/leaderboard/monthly');
    return res.data?.data || [];
  },

  getAllTimeLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const res = await api.get('/leaderboard/all-time');
    return res.data?.data || [];
  },

  getUserStatistics: async (userId: number): Promise<UserStatistics> => {
    const res = await api.get(`/statistics/user/${userId}`);
    return res.data?.data;
  },

  getUserAchievements: async (userId: number): Promise<Achievement[]> => {
    const res = await api.get(`/achievements/${userId}`);
    return res.data?.data || [];
  }
};
