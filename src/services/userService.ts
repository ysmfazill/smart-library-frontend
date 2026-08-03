import { api } from './api';
import type { UserProfileData } from '../types';
import { mapUserProfileDTO } from '../utils/mappers';

export const userService = {
  /**
   * Get full user profile with aggregated stats and interests.
   * Uses GET /api/users/profile/{id}
   */
  getProfile: async (userId: number): Promise<UserProfileData> => {
    const res = await api.get(`/users/profile/${userId}`);
    return mapUserProfileDTO(res.data?.data || res.data);
  },

  /**
   * Get basic user details by ID.
   * Uses GET /api/users/{id}
   */
  getUserById: async (userId: number) => {
    const res = await api.get(`/users/${userId}`);
    return res.data?.data || res.data;
  },

  /**
   * Update user profile fields (fullName, email, profileImage, etc.)
   * Uses PUT /api/users/{id}
   */
  updateUser: async (userId: number, data: {
    fullName?: string;
    email?: string;
    avatar?: string;
  }) => {
    const res = await api.put(`/users/${userId}`, data);
    return res.data?.data || res.data;
  },

  /**
   * Delete user account.
   * Uses DELETE /api/users/{id}
   */
  deleteUser: async (userId: number) => {
    const res = await api.delete(`/users/${userId}`);
    return res.data;
  },
};
