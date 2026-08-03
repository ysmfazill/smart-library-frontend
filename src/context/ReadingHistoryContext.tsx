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

  // Derived lists
  const inProgressBooks = useMemo(
    () => entries.filter(e => !e.completed && e.progress < 100),
    [entries]
  );
  const completedBooks = useMemo(
    () => entries.filter(e => e.completed || e.progress >= 100),
    [entries]
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
        const content = res?.content || (Array.isArray(res) ? res : []);
        setEntries(content.map(mapHistoryDTO));
      }
    } catch {
      // silent fail — start with empty history
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
      if (prev.some(e => e.bookId === bookId)) return prev;
      const stub: HistoryEntry = {
        id: `temp-${bookId}`,
        bookId,
        book: { id: bookId, title: '', author: '', cover: '', rating: 0, category: '' },
        progress: 1,
        completed: false,
        lastReadAt: new Date().toISOString(),
      };
      return [...prev, stub];
    });

    try {
      await historyService.startReading(user.id, Number(bookId));
      await load(); // Reload to get proper server data with embedded book info
    } catch {
      // Revert if API call fails
      setEntries(prev => prev.filter(e => e.bookId !== bookId));
    }
  }, [user?.id, load]);

  const updateTimeouts = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  const updateProgress = useCallback(async (bookId: string, progress: number) => {
    if (!user?.id) return;

    // Optimistic update
    setEntries(prev => prev.map(e =>
      e.bookId === bookId
        ? { ...e, progress, completed: progress >= 100, lastReadAt: new Date().toISOString() }
        : e
    ));

    // Debounce the API call
    if (updateTimeouts.current[bookId]) {
      clearTimeout(updateTimeouts.current[bookId]);
    }

    updateTimeouts.current[bookId] = setTimeout(async () => {
      try {
        await historyService.updateProgress(user.id, Number(bookId), progress);
      } catch {
        // If update fails, reload from server
        await load();
      }
    }, 1000); // 1-second debounce
  }, [user?.id, load]);

  const markCompleted = useCallback(async (bookId: string) => {
    await updateProgress(bookId, 100);
  }, [updateProgress]);

  const getEntry = useCallback(
    (bookId: string) => entries.find(e => e.bookId === bookId),
    [entries]
  );

  const isReading = useCallback(
    (bookId: string) => entries.some(e => e.bookId === bookId && !e.completed && e.progress < 100),
    [entries]
  );

  const isCompleted = useCallback(
    (bookId: string) => entries.some(e => e.bookId === bookId && (e.completed || e.progress >= 100)),
    [entries]
  );

  return (
    <ReadingHistoryContext.Provider value={{
      historyEntries: entries,
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
