import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import type { LoginDTO, RegisterDTO } from '../services/authService';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN' | 'USER' | 'ADMIN';
  token?: string;
  avatar?: string;
  interests?: { id: number; interestName: string }[];
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  needsOnboarding: boolean;
  loading: boolean;
  login: (data: LoginDTO) => Promise<void>;
  register: (data: RegisterDTO) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateNeedsOnboarding: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentUserData());
  const [loading, setLoading] = useState<boolean>(false);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);

  const isAuthenticated = !!user && typeof user.id === 'number' && user.id > 0 && !!localStorage.getItem('jwt_token');
  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';

  // Determine if onboarding is needed from the stored user's interests
  useEffect(() => {
    if (user) {
      const hasInterests = Array.isArray(user.interests) && user.interests.length > 0;
      setNeedsOnboarding(!hasInterests);
    } else {
      setNeedsOnboarding(false);
    }
  }, [user]);

  const login = useCallback(async (data: LoginDTO) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      if (res?.data) {
        const userData: AuthUser = res.data;
        setUser(userData);
        // Determine onboarding status from login response
        const hasInterests = Array.isArray(userData.interests) && userData.interests.length > 0;
        setNeedsOnboarding(!hasInterests);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterDTO) => {
    setLoading(true);
    try {
      await authService.register(data);
      // Auto-login after registration — new users always need onboarding
      await login({ email: data.email, password: data.password });
      setNeedsOnboarding(true); // New users always have no interests
    } finally {
      setLoading(false);
    }
  }, [login]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setNeedsOnboarding(false);
    window.location.href = '/login';
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await authService.getProfile(user.id);
      if (res?.data) {
        const updated = { ...user, ...res.data };
        setUser(updated);
        localStorage.setItem('user_data', JSON.stringify(updated));
        const hasInterests = Array.isArray(updated.interests) && updated.interests.length > 0;
        setNeedsOnboarding(!hasInterests);
      }
    } catch {/* ignore */}
  }, [user?.id]);

  const updateNeedsOnboarding = useCallback((val: boolean) => {
    setNeedsOnboarding(val);
  }, []);

  // Restore from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token && !user) {
      const savedUser = authService.getCurrentUserData();
      if (savedUser) setUser(savedUser);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        needsOnboarding,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateNeedsOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
