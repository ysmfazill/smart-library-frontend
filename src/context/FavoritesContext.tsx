import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { favoriteService } from '../services/favoriteService';
import type { Book, FavoriteItem } from '../types';
import { mapFavoriteDTO } from '../utils/mappers';

interface FavoritesContextType {
  favorites: Book[];
  favoriteItems: FavoriteItem[];
  favoriteIds: Set<string>;
  count: number;
  loading: boolean;
  addFavorite: (bookId: string, book?: Book) => Promise<void>;
  removeFavorite: (bookId: string) => Promise<void>;
  toggleFavorite: (bookId: string, book?: Book) => Promise<void>;
  isFavorite: (bookId: string) => boolean;
  reload: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  // Derived values
  const favorites: Book[] = favoriteItems.map(fi => fi.book);
  const favoriteIds = new Set<string>(favoriteItems.map(fi => fi.book.id));
  const count = favoriteItems.length;

  // Load favorites from API on auth change
  const load = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setFavoriteItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await favoriteService.getFavorites(user.id);
      if (mountedRef.current) {
        const content = res?.content || (Array.isArray(res) ? res : []);
        const items: FavoriteItem[] = content.map(mapFavoriteDTO);
        setFavoriteItems(items);
      }
    } catch {
      // If load fails, start with empty list — don't block the UI
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const addFavorite = useCallback(async (bookId: string, book?: Book) => {
    if (!user?.id) return;

    // Optimistic update — add placeholder immediately
    const placeholderItem: FavoriteItem = {
      id: `temp-${bookId}`,
      book: book || { id: bookId, title: '', author: '', cover: '', rating: 0, category: '' },
      addedAt: new Date().toISOString(),
    };
    setFavoriteItems(prev => {
      if (prev.some(f => f.book.id === bookId)) return prev;
      return [...prev, placeholderItem];
    });

    try {
      await favoriteService.addFavorite(user.id, Number(bookId));
      // Reload to get proper server data (replaces the placeholder)
      await load();
    } catch {
      // Revert optimistic update on failure
      setFavoriteItems(prev => prev.filter(f => f.id !== placeholderItem.id));
    }
  }, [user?.id, load]);

  const removeFavorite = useCallback(async (bookId: string) => {
    if (!user?.id) return;

    // Optimistic update — remove immediately
    const snapshot = favoriteItems;
    setFavoriteItems(prev => prev.filter(f => f.book.id !== bookId));

    try {
      await favoriteService.removeFavorite(user.id, Number(bookId));
    } catch {
      // Revert on failure
      setFavoriteItems(snapshot);
    }
  }, [user?.id, favoriteItems]);

  const toggleFavorite = useCallback(async (bookId: string, book?: Book) => {
    if (favoriteIds.has(bookId)) {
      await removeFavorite(bookId);
    } else {
      await addFavorite(bookId, book);
    }
  }, [favoriteIds, addFavorite, removeFavorite]);

  const isFavorite = useCallback((bookId: string) => favoriteIds.has(bookId), [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      favoriteItems,
      favoriteIds,
      count,
      loading,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite,
      reload: load,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
};
