import React, { useState, useEffect, useCallback } from 'react';

import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { BookCard } from '../components/BookCard';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useReadingHistory } from '../context/ReadingHistoryContext';
import { recommendationService } from '../services/recommendationService';
import type { Book } from '../types';

const BookCardSkeleton = () => (
  <div className="glass-card rounded-2xl p-4 animate-pulse min-w-[200px]">
    <div className="w-full aspect-[2/3] bg-surface-container-highest rounded-xl mb-4" />
    <div className="h-4 bg-surface-container-highest rounded w-3/4 mb-2" />
    <div className="h-3 bg-surface-container-highest rounded w-1/2 mb-4" />
    <div className="h-8 bg-surface-container-highest rounded mb-2" />
    <div className="h-8 bg-surface-container-highest rounded" />
  </div>
);

const RecommendationRow: React.FC<{ title: string, books: Book[], loading: boolean }> = ({ title, books, loading }) => {
  if (!loading && books.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-bold font-display text-on-surface">{title}</h2>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar">
        {loading
          ? [0, 1, 2, 3, 4].map(i => <div key={i} className="snap-start w-[240px] shrink-0"><BookCardSkeleton /></div>)
          : books.map(book => (
              <div key={book.id} className="snap-start w-[240px] shrink-0">
                <BookCard book={book} />
              </div>
            ))
        }
      </div>
    </section>
  );
};

const Recommendations: React.FC = () => {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const { historyEntries } = useReadingHistory();

  const [loading, setLoading] = useState(true);
  const [personalized, setPersonalized] = useState<Book[]>([]);
  const [interests, setInterests] = useState<Book[]>([]);
  const [continueReading, setContinueReading] = useState<Book[]>([]);
  const [trending, setTrending] = useState<Book[]>([]);
  const [popular, setPopular] = useState<Book[]>([]);
  const [newest, setNewest] = useState<Book[]>([]);
  const [similarToFavs, setSimilarToFavs] = useState<Book[]>([]);
  const [readersAlsoLiked, setReadersAlsoLiked] = useState<Book[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Book[]>([]);
  const [highestRated, setHighestRated] = useState<Book[]>([]);

  const loadAll = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const promises = [
        recommendationService.getPersonalized(12).then(setPersonalized),
        recommendationService.getByInterests(12).then(setInterests),
        recommendationService.getTrending(12).then(setTrending),
        recommendationService.getPopular(12).then(setPopular),
        recommendationService.getNewArrivals(12).then(setNewest),
        recommendationService.getHighestRated(12).then(setHighestRated)
      ];

      if (historyEntries.length > 0) {
        promises.push(recommendationService.getContinueReading(12).then(setContinueReading));
        promises.push(recommendationService.getRecentlyViewed(12).then(setRecentlyViewed));
        promises.push(recommendationService.getReadersAlsoLiked(12).then(setReadersAlsoLiked));
      } else {
        setContinueReading([]);
        setRecentlyViewed([]);
        setReadersAlsoLiked([]);
      }

      if (favorites.length > 0) {
        promises.push(recommendationService.getSimilarToFavorites(12).then(setSimilarToFavs));
      } else {
        setSimilarToFavs([]);
      }

      await Promise.all(promises);
    } catch (e) {
      console.error("Failed to load recommendations", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, historyEntries.length, favorites.length]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="flex h-screen bg-surface overflow-hidden selection:bg-primary/20">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-mesh-pattern opacity-[0.03] pointer-events-none" />
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 z-10 relative">
          <div className="max-w-7xl mx-auto space-y-2 pb-24">
            
            <header className="mb-8">
              <h1 className="text-3xl font-bold font-display text-on-surface mb-2 tracking-tight">
                Recommended Books
              </h1>
              <p className="text-on-surface-variant">
                Curated specifically for you based on your reading behavior and selected interests.
              </p>
            </header>

            <RecommendationRow title="Recommended For You" books={personalized} loading={loading} />
            <RecommendationRow title="Based On Your Interests" books={interests} loading={loading} />
            <RecommendationRow title="Continue Reading" books={continueReading} loading={loading} />
            <RecommendationRow title="Trending Books" books={trending} loading={loading} />
            <RecommendationRow title="Most Popular" books={popular} loading={loading} />
            <RecommendationRow title="New Arrivals" books={newest} loading={loading} />
            <RecommendationRow title="Similar To Your Favorites" books={similarToFavs} loading={loading} />
            <RecommendationRow title="Readers Also Liked" books={readersAlsoLiked} loading={loading} />
            <RecommendationRow title="Recently Viewed" books={recentlyViewed} loading={loading} />
            <RecommendationRow title="Highest Rated" books={highestRated} loading={loading} />

          </div>
        </main>
      </div>
    </div>
  );
};

export default Recommendations;
