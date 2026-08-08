import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { historyService } from '../services/historyService';
import type { HistoryEntry } from '../types';
import { mapHistoryDTO } from '../utils/mappers';

interface ReadingHistoryContextType {
  historyEntries: HistoryEntry[];
  inProgressBooks: HistoryEntry[];
  completedBooks: HistoryEntry[];
  loading: boolean;
  startReading: (bookId: string) => Promise<void>;
  updateProgress: (bookId: string, progress: number) => Promise<void>;
  markCompleted: (bookId: string) => Promise<void>;
  getEntry: (bookId: string) => HistoryEntry | undefined;
  isReading: (bookId: string) => boolean;
  isCompleted: (bookId: string) => boolean;
  reload: () => Promise<void>;
}

const ReadingHistoryContext = createContext<ReadingHistoryContextType | undefined>(undefined);

export const ReadingHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const safeEntries = useMemo(() => (Array.isArray(entries) ? entries : []), [entries]);

  // Derived lists
  const inProgressBooks = useMemo(
    () => safeEntries.filter(e => e && !e.completed && e.progress < 100),
    [safeEntries]
  );
  const completedBooks = useMemo(
    () => safeEntries.filter(e => e && (e.completed || e.progress >= 100)),
    [safeEntries]
  );

  // Load history from API
  const load = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setEntries([]);
      return;
    }
    setLoading(true);
    try {
      const res = await historyService.getReadingHistory(user.id);
      if (mountedRef.current) {
        const rawContent = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
        const safeContent = Array.isArray(rawContent) ? rawContent : [];
        setEntries(safeContent.map(mapHistoryDTO));
      }
    } catch {
      if (mountedRef.current) setEntries([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const startReading = useCallback(async (bookId: string) => {
    if (!user?.id) return;

    // Optimistic: add a stub entry immediately
    setEntries(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      if (safePrev.some(e => e && String(e.bookId) === String(bookId))) return safePrev;
      const stub: HistoryEntry = {
        id: `temp-${bookId}`,
        bookId,
        book: { id: bookId, title: '', author: '', cover: '', rating: 0, category: '' },
        progress: 1,
        completed: false,
        lastReadAt: new Date().toISOString(),
      };
      return [...safePrev, stub];
    });

    try {
      await historyService.startReading(user.id, Number(bookId));
      await load();
    } catch {
      setEntries(prev => (Array.isArray(prev) ? prev.filter(e => e && String(e.bookId) !== String(bookId)) : []));
    }
  }, [user?.id, load]);

  const updateTimeouts = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  const updateProgress = useCallback(async (bookId: string, progress: number) => {
    if (!user?.id) return;

    // Optimistic update
    setEntries(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map(e =>
        e && String(e.bookId) === String(bookId)
          ? { ...e, progress, completed: progress >= 100, lastReadAt: new Date().toISOString() }
          : e
      );
    });

    if (updateTimeouts.current[bookId]) {
      clearTimeout(updateTimeouts.current[bookId]);
    }

    updateTimeouts.current[bookId] = setTimeout(async () => {
      try {
        await historyService.updateProgress(user.id, Number(bookId), progress);
      } catch {
        await load();
      }
    }, 1000);
  }, [user?.id, load]);

  const markCompleted = useCallback(async (bookId: string) => {
    await updateProgress(bookId, 100);
  }, [updateProgress]);

  const getEntry = useCallback(
    (bookId: string) => (Array.isArray(safeEntries) ? safeEntries.find(e => e && String(e.bookId) === String(bookId)) : undefined),
    [safeEntries]
  );

  const isReading = useCallback(
    (bookId: string) => (Array.isArray(safeEntries) ? safeEntries.some(e => e && String(e.bookId) === String(bookId) && !e.completed && e.progress < 100) : false),
    [safeEntries]
  );

  const isCompleted = useCallback(
    (bookId: string) => (Array.isArray(safeEntries) ? safeEntries.some(e => e && String(e.bookId) === String(bookId) && (e.completed || e.progress >= 100)) : false),
    [safeEntries]
  );

  return (
    <ReadingHistoryContext.Provider value={{
      historyEntries: safeEntries,
      inProgressBooks,
      completedBooks,
      loading,
      startReading,
      updateProgress,
      markCompleted,
      getEntry,
      isReading,
      isCompleted,
      reload: load,
    }}>
      {children}
    </ReadingHistoryContext.Provider>
  );
};

export const useReadingHistory = (): ReadingHistoryContextType => {
  const ctx = useContext(ReadingHistoryContext);
  if (!ctx) throw new Error('useReadingHistory must be used within a ReadingHistoryProvider');
  return ctx;
};
