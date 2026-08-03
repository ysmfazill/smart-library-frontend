import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { userService } from '../services/userService';
import type { UserProfileData, Interest } from '../types';
import { formatJoinDate } from '../utils/mappers';

// ── UI-only preferences (safe to keep in localStorage) ────────────────────────
export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type Language = 'en' | 'ar' | 'fr' | 'de';

export interface UserSettings {
  theme: Theme;
  fontSize: FontSize;
  language: Language;
  notifyNewRecommendations: boolean;
  notifyReadingReminders: boolean;
  notifyNewArrivals: boolean;
  notifyWeeklyDigest: boolean;
  profilePublic: boolean;
  showReadingActivity: boolean;
  shareProgress: boolean;
  compactMode: boolean;
  animationsEnabled: boolean;
  autoPlayPreviews: boolean;
}

// ── Displayed profile shape (used by Profile.tsx + Sidebar) ───────────────────
export interface UserProfile {
  name: string;
  email: string;
  username: string;
  bio: string;
  avatar: string;
  tier: 'Scholar' | 'Researcher' | 'Archivist' | 'Librarian';
  joinDate: string;
  location: string;
  website: string;
  role: 'USER' | 'ADMIN';
  interests: Interest[];
  totalFavorites: number;
  totalReadingHistory: number;
}

interface UserProfileContextType {
  profile: UserProfile;
  user: UserProfile;
  settings: UserSettings;
  profileLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
  reloadProfile: () => Promise<void>;
}

// ── Tier calculation based on books read ─────────────────────────────────────
function computeTier(totalReadingHistory: number): UserProfile['tier'] {
  if (totalReadingHistory >= 50) return 'Librarian';
  if (totalReadingHistory >= 20) return 'Archivist';
  if (totalReadingHistory >= 5)  return 'Researcher';
  return 'Scholar';
}

// ── Default empty profile (shown before data loads) ───────────────────────────
const EMPTY_PROFILE: UserProfile = {
  name: '',
  email: '',
  username: '',
  bio: '',
  avatar: '',
  tier: 'Scholar',
  joinDate: '',
  location: '',
  website: '',
  role: 'USER',
  interests: [],
  totalFavorites: 0,
  totalReadingHistory: 0,
};

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  fontSize: 'medium',
  language: 'en',
  notifyNewRecommendations: true,
  notifyReadingReminders: true,
  notifyNewArrivals: false,
  notifyWeeklyDigest: true,
  profilePublic: true,
  showReadingActivity: true,
  shareProgress: false,
  compactMode: false,
  animationsEnabled: true,
  autoPlayPreviews: false,
};

const SETTINGS_KEY = 'aethelgard_settings';

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {/* ignore */}
  return DEFAULT_SETTINGS;
}

// ── Map backend profile to local shape ────────────────────────────────────────
function buildProfile(apiProfile: UserProfileData, extras: { bio?: string; location?: string; website?: string; username?: string } = {}): UserProfile {
  const role = (apiProfile.role === 'ROLE_ADMIN' || apiProfile.role === 'ADMIN') ? 'ADMIN' : 'USER';
  return {
    name: apiProfile.fullName,
    email: apiProfile.email,
    username: extras.username || `@${apiProfile.fullName.split(' ')[0].toLowerCase()}`,
    bio: extras.bio || '',
    avatar: apiProfile.avatar || '',
    tier: computeTier(apiProfile.totalReadingHistory),
    joinDate: formatJoinDate(apiProfile.createdAt),
    location: extras.location || '',
    website: extras.website || '',
    role,
    interests: apiProfile.interests || [],
    totalFavorites: apiProfile.totalFavorites,
    totalReadingHistory: apiProfile.totalReadingHistory,
  };
}

const EXTRAS_KEY = 'aethelgard_profile_extras';
function loadExtras() {
  try {
    const raw = localStorage.getItem(EXTRAS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveExtras(data: object) {
  try { localStorage.setItem(EXTRAS_KEY, JSON.stringify(data)); } catch {/* ignore */}
}

// ── Context ───────────────────────────────────────────────────────────────────
const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: number) => {
    setProfileLoading(true);
    try {
      const apiProfile = await userService.getProfile(userId);
      const extras = loadExtras();
      setProfile(buildProfile(apiProfile, extras));
    } catch {
      // Silently fall back to auth user data
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Re-fetch whenever the authenticated user changes
  useEffect(() => {
    if (authUser?.id) {
      fetchProfile(authUser.id);
    } else {
      setProfile(EMPTY_PROFILE);
    }
  }, [authUser?.id, fetchProfile]);

  // Persist settings to localStorage on change and apply theme
  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {/* ignore */}

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!authUser?.id) return;

    // Optimistically update local state
    setProfile(prev => ({ ...prev, ...updates }));

    // Save "extras" (bio, location, website, username) locally
    const extras = loadExtras();
    const newExtras = { ...extras };
    if (updates.bio !== undefined) newExtras.bio = updates.bio;
    if (updates.location !== undefined) newExtras.location = updates.location;
    if (updates.website !== undefined) newExtras.website = updates.website;
    if (updates.username !== undefined) newExtras.username = updates.username;
    saveExtras(newExtras);

    // Persist core fields (name, email, avatar) to backend
    try {
      if (updates.name || updates.email || updates.avatar) {
        await userService.updateUser(authUser.id, {
          fullName: updates.name,
          email: updates.email,
          avatar: updates.avatar,
        });
      }
    } catch {/* ignore network errors — local state is already updated */}
  }, [authUser?.id]);

  const reloadProfile = useCallback(async () => {
    if (authUser?.id) await fetchProfile(authUser.id);
  }, [authUser?.id, fetchProfile]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return (
    <UserProfileContext.Provider value={{
      profile,
      user: profile,
      settings,
      profileLoading,
      updateProfile,
      updateSettings,
      resetSettings,
      reloadProfile,
    }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = (): UserProfileContextType => {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be inside UserProfileProvider');
  return ctx;
};
