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
   * Get reading progress for a specific book.
   * GET /api/history/book/{bookId}?userId={userId}
   */
  getReadingProgressByBook: async (userId: number, bookId: number) => {
    const res = await api.get(`/history/book/${bookId}`, { params: { userId } });
    return res.data?.data || res.data;
  },

  /**
   * Start reading a book (creates a new history entry at page 1).
   * POST /api/history
   */
  startReading: async (userId: number, bookId: number) => {
    const res = await api.post('/history', {
      userId,
      bookId,
      progressPercentage: 1,
      currentPage: 1,
      status: 'READING',
      completed: false,
    });
    return res.data?.data || res.data;
  },

  /**
   * Save or update reading progress with page information.
   * POST /api/history
   */
  saveProgress: async (
    userId: number,
    bookId: number,
    progressPercentage: number,
    currentPage?: number,
    totalPages?: number,
    completed = false
  ) => {
    const res = await api.post('/history', {
      userId,
      bookId,
      progressPercentage,
      currentPage,
      totalPages,
      status: completed ? 'COMPLETED' : 'READING',
      completed,
    });
    return res.data?.data || res.data;
  },

  /**
   * Update reading progress for a book already in history.
   * PUT /api/history/{bookId}?userId={userId}&progressPercentage={p}&currentPage={cp}&totalPages={tp}
   */
  updateProgress: async (
    userId: number,
    bookId: number,
    progressPercentage: number,
    currentPage?: number,
    totalPages?: number
  ) => {
    const params: any = { userId, progressPercentage };
    if (currentPage !== undefined) params.currentPage = currentPage;
    if (totalPages !== undefined) params.totalPages = totalPages;
    const res = await api.put(`/history/${bookId}`, null, { params });
    return res.data?.data || res.data;
  },
};
