import { api } from './api';

export const interestService = {
  /**
   * Get all available interest categories in the system (for Welcome/onboarding page).
   * GET /api/interests — returns full list when no userId provided
   * Note: the backend returns all interests when called without userId filtering.
   */
  getAllInterests: async () => {
    const res = await api.get('/interests', { params: { userId: 0 } });
    return res.data?.data || res.data;
  },

  /**
   * Get interest topics associated with a specific user.
   * GET /api/interests?userId={userId}
   */
  getUserInterests: async (userId: number) => {
    const res = await api.get('/interests', { params: { userId } });
    return res.data?.data || res.data;
  },

  /**
   * Add a new interest category to the system.
   * POST /api/interests
   */
  addInterest: async (interestName: string) => {
    const res = await api.post('/interests', { interestName });
    return res.data?.data || res.data;
  },

  /**
   * Save/update user's selected interests.
   * PUT /api/interests?userId={userId}
   * Body: array of interest IDs
   */
  updateUserInterests: async (userId: number, interestIds: number[]) => {
    const res = await api.put('/interests', interestIds, { params: { userId } });
    return res.data?.data || res.data;
  },
};
