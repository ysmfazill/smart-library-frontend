import { api } from './api';

export interface RegisterDTO {
  fullName: string;
  email: string;
  password: string;
  avatar?: string;
  interestIds?: number[];
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  id: number;
  fullName: string;
  email: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN' | 'USER' | 'ADMIN';
}

export const authService = {
  register: async (data: RegisterDTO) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  login: async (data: LoginDTO) => {
    const res = await api.post('/auth/login', data);
    if (res.data && res.data.data && res.data.data.token) {
      localStorage.setItem('jwt_token', res.data.data.token);
      localStorage.setItem('user_data', JSON.stringify(res.data.data));
    }
    return res.data;
  },

  getProfile: async (userId?: number) => {
    const res = await api.get('/auth/profile', { params: { userId } });
    return res.data;
  },

  updateProfile: async (userId: number, data: Partial<RegisterDTO>) => {
    const res = await api.put('/auth/profile', data, { params: { userId } });
    return res.data;
  },

  changePassword: async (userId: number, oldPassword: string, newPassword: string) => {
    const res = await api.put('/auth/change-password', null, {
      params: { userId, oldPassword, newPassword },
    });
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
  },

  getCurrentUserData: () => {
    const raw = localStorage.getItem('user_data');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
