import { api } from './api';

export interface CategoryPayload {
  name: string;
  description?: string;
}

export const categoryService = {
  getAllCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  },

  getCategoryById: async (id: number | string) => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },

  addCategory: async (data: CategoryPayload) => {
    const res = await api.post('/categories', data);
    return res.data;
  },

  updateCategory: async (id: number | string, data: CategoryPayload) => {
    const res = await api.put(`/categories/${id}`, data);
    return res.data;
  },

  deleteCategory: async (id: number | string) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};
