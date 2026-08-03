import { api } from './api';

export const favoriteService = {
  /**
   * Get paginated list of user's favorite books.
   * GET /api/favorites?userId={userId}&page={page}&size={size}
   */
  getFavorites: async (userId: number, page = 0, size = 100) => {
    const res = await api.get('/favorites', { params: { userId, page, size } });
    return res.data?.data || res.data;
  },

  /**
   * Add a book to user's favorites.
   * POST /api/favorites
   */
  addFavorite: async (userId: number, bookId: number) => {
    const res = await api.post('/favorites', { userId, bookId });
    return res.data?.data || res.data;
  },

  /**
   * Remove a book from user's favorites.
   * DELETE /api/favorites/{bookId}?userId={userId}
   */
  removeFavorite: async (userId: number, bookId: number) => {
    const res = await api.delete(`/favorites/${bookId}`, {
      params: { userId },
    });
    return res.data;
  },
};
