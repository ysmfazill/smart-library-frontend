import { api } from './api';

export const reviewService = {
  getReviewsByBook: async (bookId: number | string, page = 0, size = 10) => {
    const res = await api.get(`/reviews/book/${bookId}`, { params: { page, size } });
    return res.data;
  },

  addReview: async (userId: number, bookId: number, rating: number, comment?: string) => {
    const res = await api.post('/reviews', { userId, bookId, rating, comment });
    return res.data;
  },

  updateReview: async (id: number | string, rating: number, comment?: string) => {
    const res = await api.put(`/reviews/${id}`, { rating, comment });
    return res.data;
  },

  deleteReview: async (id: number | string) => {
    const res = await api.delete(`/reviews/${id}`);
    return res.data;
  },

  likeReview: async (id: number | string) => {
    await api.post(`/reviews/${id}/like`);
  },

  unlikeReview: async (id: number | string) => {
    await api.delete(`/reviews/${id}/like`);
  }
};
