import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
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

  const safeFavoriteItems = useMemo(
    () => (Array.isArray(favoriteItems) ? favoriteItems.filter(Boolean) : []),
    [favoriteItems]
  );

  // Derived values
  const favorites: Book[] = useMemo(
    () => safeFavoriteItems.map(fi => fi.book).filter(Boolean),
    [safeFavoriteItems]
  );
  const favoriteIds = useMemo(
    () => new Set<string>(safeFavoriteItems.map(fi => String(fi?.book?.id || '')).filter(Boolean)),
    [safeFavoriteItems]
  );
  const count = safeFavoriteItems.length;

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
        const rawContent = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
        const safeContent = Array.isArray(rawContent) ? rawContent : [];
        const items: FavoriteItem[] = safeContent.map(mapFavoriteDTO);
        setFavoriteItems(items);
      }
    } catch {
      if (mountedRef.current) setFavoriteItems([]);
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

    // Optimistic update
    const placeholderItem: FavoriteItem = {
      id: `temp-${bookId}`,
      book: book || { id: bookId, title: '', author: '', cover: '', rating: 0, category: '' },
      addedAt: new Date().toISOString(),
    };
    setFavoriteItems(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      if (safePrev.some(f => f && f.book && String(f.book.id) === String(bookId))) return safePrev;
      return [...safePrev, placeholderItem];
    });

    try {
      await favoriteService.addFavorite(user.id, Number(bookId));
      await load();
    } catch {
      setFavoriteItems(prev => (Array.isArray(prev) ? prev.filter(f => f && f.id !== placeholderItem.id) : []));
    }
  }, [user?.id, load]);

  const removeFavorite = useCallback(async (bookId: string) => {
    if (!user?.id) return;

    const snapshot = safeFavoriteItems;
    setFavoriteItems(prev => (Array.isArray(prev) ? prev.filter(f => f && f.book && String(f.book.id) !== String(bookId)) : []));

    try {
      await favoriteService.removeFavorite(user.id, Number(bookId));
    } catch {
      setFavoriteItems(snapshot);
    }
  }, [user?.id, safeFavoriteItems]);

  const toggleFavorite = useCallback(async (bookId: string, book?: Book) => {
    if (favoriteIds.has(String(bookId))) {
      await removeFavorite(bookId);
    } else {
      await addFavorite(bookId, book);
    }
  }, [favoriteIds, addFavorite, removeFavorite]);

  const isFavorite = useCallback((bookId: string) => favoriteIds.has(String(bookId)), [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      favoriteItems: safeFavoriteItems,
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
