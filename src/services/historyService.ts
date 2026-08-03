import { api } from './api';

export const historyService = {
  /**
   * Get paginated reading history for a user.
   * GET /api/history?userId={userId}&page={page}&size={size}
   */
  getReadingHistory: async (userId: number, page = 0, size = 50) => {
    const res = await api.get('/history', { params: { userId, page, size } });
    return res.data?.data || res.data;
  },

  /**
   * Start reading a book (creates a new history entry at 0%).
   * POST /api/history
   */
  startReading: async (userId: number, bookId: number) => {
    const res = await api.post('/history', {
      userId,
      bookId,
      progressPercentage: 1,
      completed: false,
    });
    return res.data?.data || res.data;
  },

  /**
   * Save or update reading progress.
   * POST /api/history
   */
  saveProgress: async (
    userId: number,
    bookId: number,
    progressPercentage: number,
    completed = false
  ) => {
    const res = await api.post('/history', {
      userId,
      bookId,
      progressPercentage,
      completed,
    });
    return res.data?.data || res.data;
  },

  /**
   * Update reading progress for a book already in history.
   * PUT /api/history/{bookId}?userId={userId}&progressPercentage={p}
   */
  updateProgress: async (
    userId: number,
    bookId: number,
    progressPercentage: number
  ) => {
    const res = await api.put(`/history/${bookId}`, null, {
      params: { userId, progressPercentage },
    });
    return res.data?.data || res.data;
  },
};
