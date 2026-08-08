import { api } from './api';
import type { Book, ApiResponse } from '../types';
import { mapBookSummaryDTO } from '../utils/mappers';

function extractList(res: any): Book[] {
  const data = res?.data?.data || res?.data;
  const list = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
  return list.map(mapBookSummaryDTO);
}

export const recommendationService = {
  getPersonalized: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/personalized?limit=${limit}`);
    return extractList(res);
  },

  getByInterests: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/interests?limit=${limit}`);
    return extractList(res);
  },

  getSimilarToFavorites: async (limit = 12): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/similar-favorites?limit=${limit}`);
    return extractList(res);
  },

  getTrending: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/trending?limit=${limit}`);
    return extractList(res);
  },

  getPopular: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/popular?limit=${limit}`);
    return extractList(res);
  },

  getNewArrivals: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/newest?limit=${limit}`);
    return extractList(res);
  },
  
  getByHistory: async (limit = 10): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/history?limit=${limit}`);
    return extractList(res);
  },

  getReadersAlsoLiked: async (limit = 12): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/readers-also-liked?limit=${limit}`);
    return extractList(res);
  },
  
  getSimilarBooks: async (bookId: string | number, limit = 5): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/similar/${bookId}?limit=${limit}`);
    return extractList(res);
  },
  
  getContinueReading: async (limit = 12): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/continue-reading?limit=${limit}`);
    return extractList(res);
  },
  
  getRecentlyViewed: async (limit = 12): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/recently-viewed?limit=${limit}`);
    return extractList(res);
  },
  
  getHighestRated: async (limit = 12): Promise<Book[]> => {
    const res = await api.get<ApiResponse<any[]>>(`/recommendations/highest-rated?limit=${limit}`);
    return extractList(res);
  }
};
