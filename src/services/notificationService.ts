import { api } from './api';

export interface NotificationDTO {
  id: number;
  userId: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (page = 0, size = 20) => {
    const response = await api.get(`/notifications?page=${page}&size=${size}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: number) => {
    await api.post(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    await api.post('/notifications/read-all');
  }
};
