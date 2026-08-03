import { api } from './api';

export interface BookPayload {
  title: string;
  author: string;
  description?: string;
  categoryId: number;
  isbn?: string;
  language?: string;
  publicationYear?: number;
  pages?: number;
  coverImage?: string;
  keywords?: string;
  aiSummary?: string;
  totalCopies?: number;
}

export const bookService = {
  getAllBooks: async (page = 0, size = 10) => {
    const res = await api.get('/books', { params: { page, size } });
    return res.data;
  },

  getBookById: async (id: number | string) => {
    const res = await api.get(`/books/${id}`);
    return res.data;
  },

  searchBooks: async (query?: string, categoryId?: number, minRating?: number, page = 0, size = 10) => {
    const res = await api.get('/books/search', {
      params: { query, categoryId, minRating, page, size },
    });
    return res.data;
  },

  getBooksByCategory: async (category: string, page = 0, size = 10) => {
    const res = await api.get(`/books/category/${category}`, { params: { page, size } });
    return res.data;
  },

  getTrendingBooks: async (limit = 10) => {
    const res = await api.get('/books/trending', { params: { limit } });
    return res.data;
  },

  getRecommendedBooks: async (userId = 1, limit = 10) => {
    const res = await api.get('/books/recommended', { params: { userId, limit } });
    return res.data;
  },

  addBook: async (data: BookPayload) => {
    const res = await api.post('/books', data);
    return res.data;
  },

  updateBook: async (id: number | string, data: Partial<BookPayload>) => {
    const res = await api.put(`/books/${id}`, data);
    return res.data;
  },

  deleteBook: async (id: number | string) => {
    const res = await api.delete(`/books/${id}`);
    return res.data;
  },
};
