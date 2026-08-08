import { api } from './api';

export interface BookPreview {
  fileName: string;
  rowNumber: number;
  title: string;
  author: string;
  categoryName: string;
  isbn: string;
  publicationYear: number;
  rating: number;
  language: string;
  description: string;
  keywords: string;
  coverImage: string;
  status: 'VALID' | 'DUPLICATE' | 'INVALID';
  validationMessage: string;
}

export interface ImportSummary {
  filesProcessed: number;
  totalRowsProcessed: number;
  booksImported: number;
  booksSkipped: number;
  duplicatesSkipped: number;
  invalidRowsSkipped: number;
  categoriesCreated: number;
  authorsCreated: number;
  importDurationMs: number;
  successRate: number;
  logMessages: string[];
  previewRows: BookPreview[];
}

export const adminService = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },

  getAdminBooks: async (page = 0, size = 10, search = '') => {
    const params: any = { page, size };
    if (search) params.search = search;
    const res = await api.get('/admin/books', { params });
    return res.data;
  },

  getStatistics: async () => {
    const res = await api.get('/admin/statistics');
    return res.data;
  },

  getRecommendationStats: async () => {
    const res = await api.get('/admin/statistics/recommendations');
    return res.data;
  },

  getPopularCategories: async () => {
    const res = await api.get('/admin/statistics/popular-categories');
    return res.data;
  },

  getPopularAuthors: async () => {
    const res = await api.get('/admin/statistics/popular-authors');
    return res.data;
  },

  previewImportBooks: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const res = await api.post('/admin/books/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  executeImportBooks: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const res = await api.post('/admin/books/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getImportHistory: async (page = 0, size = 20) => {
    const res = await api.get('/admin/imports/history', { params: { page, size } });
    return res.data;
  },

  createBook: async (bookData: any) => {
    const res = await api.post('/admin/books', bookData);
    return res.data;
  },

  updateBook: async (bookId: number | string, bookData: any) => {
    const res = await api.put(`/admin/books/${bookId}`, bookData);
    return res.data;
  },

  deleteBook: async (bookId: number | string) => {
    const res = await api.delete(`/admin/books/${bookId}`);
    return res.data;
  },

  uploadBookFile: async (bookId: number | string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/admin/books/${bookId}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};
