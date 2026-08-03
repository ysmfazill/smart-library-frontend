import { api } from './api';
import type { Book } from '../types';

export interface UserCollectionDTO {
  id: number;
  userId: number;
  name: string;
  isSystem: boolean;
  createdAt: string;
  books: Book[];
}

export const collectionService = {
  getCollections: async (): Promise<UserCollectionDTO[]> => {
    const response = await api.get('/collections');
    return response.data;
  },

  createCollection: async (name: string): Promise<UserCollectionDTO> => {
    const response = await api.post(`/collections?name=${encodeURIComponent(name)}`);
    return response.data;
  },

  deleteCollection: async (id: number): Promise<void> => {
    await api.delete(`/collections/${id}`);
  },

  addBook: async (collectionId: number, bookId: string | number): Promise<void> => {
    await api.post(`/collections/${collectionId}/books/${bookId}`);
  },

  removeBook: async (collectionId: number, bookId: string | number): Promise<void> => {
    await api.delete(`/collections/${collectionId}/books/${bookId}`);
  }
};
