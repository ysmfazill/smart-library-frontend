import { api } from './api';
import type { Book, ApiResponse } from '../types';
import { mapBookSummaryDTO } from '../utils/mappers';

export const recommendationService = {
  getPersonalized: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/personalized?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  },

  getByInterests: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/interests?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  },

  getSimilarToFavorites: async (limit = 12): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/similar-favorites?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  },

  getTrending: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/trending?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  },

  getPopular: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/popular?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  },

  getNewArrivals: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/newest?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  },
  
  getByHistory: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/history?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  },
  getReadersAlsoLiked: async (limit = 12): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/readers-also-liked?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  },
  
  getSimilarBooks: async (bookId: string | number, limit = 5): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/similar/${bookId}?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  },
  
  getContinueReading: async (limit = 12): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/continue-reading?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  },
  
  getRecentlyViewed: async (limit = 12): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/recently-viewed?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  },
  
  getHighestRated: async (limit = 12): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/highest-rated?limit=${limit}`);
    return res.data.data.map(mapBookSummaryDTO);
  }
};
