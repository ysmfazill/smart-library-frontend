import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { BookCard } from '../components/BookCard';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useReadingHistory } from '../context/ReadingHistoryContext';
import { useOnboardingGuard } from '../hooks/useOnboardingGuard';
import { recommendationService } from '../services/recommendationService';
import type { Book } from '../types';
import { getFirstName, computeStreak } from '../utils/mappers';

// ── Skeleton loaders ────────────────────────────────────────────────────────

const BookCardSkeleton = () => (
  <div className="glass-card rounded-2xl p-4 animate-pulse">
    <div className="w-full aspect-[2/3] bg-surface-container-highest rounded-xl mb-4" />
    <div className="h-4 bg-surface-container-highest rounded w-3/4 mb-2" />
    <div className="h-3 bg-surface-container-highest rounded w-1/2 mb-4" />
    <div className="h-8 bg-surface-container-highest rounded mb-2" />
    <div className="h-8 bg-surface-container-highest rounded" />
  </div>
);

// ── Empty state component ────────────────────────────────────────────────────
const EmptySection: React.FC<{ icon: string; message: string; action?: { label: string; to: string } }> = ({ icon, message, action }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
      <span className="material-symbols-outlined text-5xl text-primary/30">{icon}</span>
      <p className="text-on-surface-variant text-sm">{message}</p>
      {action && (
        <button
          onClick={() => navigate(action.to)}
          className="px-4 py-2 rounded-xl ai-gradient-bg text-white text-sm font-semibold"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

// ── Main Home Component ─────────────────────────────────────────────────────
const Home: React.FC = () => {
  useOnboardingGuard();

  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, count: favoriteCount } = useFavorites();
  const { inProgressBooks, completedBooks, historyEntries } = useReadingHistory();

  const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([]);
  const [interestBooks, setInterestBooks] = useState<Book[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [newestBooks, setNewestBooks] = useState<Book[]>([]);

  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);

  // KPI values from real context data
  const booksRead = completedBooks.length;
  const streak = computeStreak(historyEntries);
  // Estimate reading hours from completed books' pages (avg 250 pages = ~5 hours)
  const hoursRead = completedBooks.reduce((sum, entry) => {
    const pages = entry.book.pages || 250;
    return sum + Math.round((pages * 1.3) / 60);
  }, 0);

  // Greeting by time of day
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = getFirstName(user?.fullName);

  const loadRecommended = useCallback(async () => {
    if (!user?.id) return;
    setLoadingRecommended(true);
    try {
      const [personalized, interests] = await Promise.all([
        recommendationService.getPersonalized(8),
        recommendationService.getByInterests(4)
      ]);
      setRecommendedBooks(personalized);
      setInterestBooks(interests);
    } catch {/* stay empty */}
    finally { setLoadingRecommended(false); }
  }, [user?.id]);

  const loadTrending = useCallback(async () => {
    setLoadingTrending(true);
    try {
      const [trending, popular, newest] = await Promise.all([
        recommendationService.getTrending(6),
        recommendationService.getPopular(4),
        recommendationService.getNewArrivals(4)
      ]);
      setTrendingBooks(trending);
      setPopularBooks(popular);
      setNewestBooks(newest);
    } catch {/* stay empty */}
    finally { setLoadingTrending(false); }
  }, []);

  useEffect(() => { loadRecommended(); }, [loadRecommended]);
  useEffect(() => { loadTrending(); }, [loadTrending]);



  // Recent activity: last 4 history events + last 4 favorites combined, sorted by date
  const recentActivity = [
    ...historyEntries.slice(0, 4).map(e => ({
      icon: e.completed ? 'check_circle' : 'menu_book',
      label: e.completed ? 'Finished' : 'Reading',
      title: e.book.title,
      time: e.lastReadAt,
    })),
    ...favorites.slice(0, 2).map(b => ({
      icon: 'favorite',
      label: 'Saved to Favorites',
      title: b.title,
      time: '',
    })),
  ].slice(0, 5);

  return (
    <AppLayout>

          {/* ── Welcome & KPIs ── */}
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container shrink-0">
                    <img src={user?.avatar?.includes('/') ? user.avatar : `/avatars/${user?.avatar || 'avatar1.png'}`} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { if (!(e.target as HTMLImageElement).src.endsWith('/avatars/avatar1.png')) { (e.target as HTMLImageElement).src = '/avatars/avatar1.png'; } }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl lg:text-[32px] font-semibold leading-tight tracking-tight text-primary flex flex-wrap items-center gap-1.5">
                      <span>{timeGreeting},</span>
                      <span className="truncate">{firstName}</span>
                      <span>👋</span>
                    </h2>
                    <p className="text-xs sm:text-base text-on-surface-variant mt-0.5 opacity-80 leading-snug">Ready to discover your next favorite book?</p>
                  </div>
                </div>
                {/* KPI Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: 'Books Read',  value: booksRead.toString() },
                    { label: 'Favorites',   value: favoriteCount.toString() },
                    { label: 'Streak',      value: streak > 0 ? `${streak}d` : '—' },
                    { label: 'Hours Read',  value: hoursRead > 0 ? hoursRead.toString() : '0' },
                  ].map(({ label, value }) => (
                    <div key={label} className="glass-card p-3.5 sm:p-4 rounded-xl text-center">
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-on-surface-variant opacity-60 font-bold">{label}</p>
                      <p className="text-lg sm:text-2xl font-bold text-primary">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Daily Goal — based on in-progress books */}
              <div className="w-full lg:w-72 glass-card p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                {inProgressBooks.length > 0 ? (
                  <>
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-3 sm:mb-4">
                      <svg className="w-full h-full -rotate-90">
                        <circle className="text-surface-container-highest" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeWidth="8" />
                        <circle
                          className="text-primary"
                          cx="64" cy="64" fill="transparent" r="54"
                          stroke="currentColor"
                          strokeDasharray="339.2"
                          strokeDashoffset={339.2 * (1 - (inProgressBooks[0]?.progress || 0) / 100)}
                          strokeWidth="8"
                          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-xl sm:text-2xl font-bold text-primary">{inProgressBooks[0]?.progress || 0}%</span>
                      </div>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-on-surface text-center line-clamp-1">
                      {inProgressBooks[0]?.book.title}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant opacity-70">Current Read</p>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl sm:text-5xl text-primary/30 mb-3">menu_book</span>
                    <h4 className="text-xs sm:text-sm font-bold text-on-surface">No Books In Progress</h4>
                    <p className="text-[11px] text-on-surface-variant opacity-70 text-center mt-1">Find a book to start reading</p>
                    <button onClick={() => navigate('/search')} className="mt-3 px-4 py-2 rounded-xl ai-gradient-bg text-white text-xs font-semibold min-h-[40px]">
                      Browse Books
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ── Continue Reading ── */}
          <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold">Continue Reading</h3>
              <button onClick={() => navigate('/history')} className="text-primary font-bold text-xs sm:text-sm flex items-center gap-1 hover:underline">
                See All <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_forward</span>
              </button>
            </div>
            {inProgressBooks.length === 0 ? (
              <EmptySection
                icon="auto_stories"
                message="You haven't started any books yet. Find something to read!"
                action={{ label: 'Search Books', to: '/search' }}
              />
            ) : (
              <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-3">
                {inProgressBooks.slice(0, 4).map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => navigate(`/book/${entry.bookId}`)}
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
                      <img
                        src={entry.book.cover}
                        alt={entry.book.title}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <div className="h-1.5 bg-white/30 rounded-full">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${entry.progress}%` }} />
                        </div>
                        <p className="text-white text-[10px] font-bold mt-1">{entry.progress}% complete</p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-bold line-clamp-1">{entry.book.title}</p>
                    <p className="text-[11px] text-on-surface-variant line-clamp-1">{entry.book.author}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Recommended For You ── */}
          <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl sm:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Recommended For You
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Based on your reading interests</p>
              </div>
              <button onClick={() => navigate('/recommendations')} className="text-primary font-bold text-xs sm:text-sm flex items-center gap-1 hover:underline">
                See All <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_forward</span>
              </button>
            </div>
            {loadingRecommended ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[0,1,2,3].map(i => <BookCardSkeleton key={i} />)}
              </div>
            ) : recommendedBooks.length === 0 ? (
              <EmptySection
                icon="neurology"
                message="Select your interests to get personalized recommendations."
                action={{ label: 'Set Interests', to: '/profile' }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {recommendedBooks.slice(0, 8).map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
          </section>

          {/* ── Based On Interests ── */}
          {interestBooks.length > 0 && (
            <section className="animate-fade-in" style={{ animationDelay: '0.45s' }}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl sm:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>interests</span>
                    Based On Interests
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {interestBooks.slice(0, 4).map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>
          )}

          {/* ── New Arrivals / Trending ── */}
          <section className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold">Trending Now</h3>
              <button onClick={() => navigate('/search')} className="text-primary font-bold text-xs sm:text-sm flex items-center gap-1 hover:underline">
                Browse All <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_forward</span>
              </button>
            </div>
            {loadingTrending ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="flex-none w-36 sm:w-44 animate-pulse">
                    <div className="w-full aspect-[3/4] bg-surface-container-highest rounded-xl mb-2" />
                    <div className="h-3 bg-surface-container-highest rounded w-3/4 mb-1" />
                    <div className="h-3 bg-surface-container-highest rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : trendingBooks.length === 0 ? (
              <EmptySection icon="trending_up" message="No trending books available yet." />
            ) : (
              <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-3">
                {trendingBooks.map((book, i) => (
                  <div
                    key={book.id}
                    className="flex-none w-36 sm:w-44 group cursor-pointer"
                    onClick={() => navigate(`/book/${book.id}`)}
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 shadow-md group-hover:shadow-xl transition-shadow">
                      <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        #{i + 1}
                      </div>
                    </div>
                    <p className="font-bold text-xs sm:text-sm line-clamp-1">{book.title}</p>
                    <p className="text-[11px] text-on-surface-variant line-clamp-1">{book.author}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Popular Books ── */}
          {popularBooks.length > 0 && (
            <section className="animate-fade-in" style={{ animationDelay: '0.55s' }}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold">Popular Books</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {popularBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>
          )}

          {/* ── New Arrivals ── */}
          {newestBooks.length > 0 && (
            <section className="animate-fade-in" style={{ animationDelay: '0.55s' }}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold">New Arrivals</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {newestBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </section>
          )}

          {/* ── Recent Activity ── */}
          <section className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <EmptySection icon="history" message="Your reading activity will appear here once you start reading." />
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="glass-card px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl flex items-center gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-on-surface truncate">
                        {item.label}: <span className="font-bold">{item.title}</span>
                      </p>
                      {item.time && (
                        <p className="text-[10px] sm:text-xs text-on-surface-variant opacity-60">
                          {new Date(item.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

    </AppLayout>
  );
};

export default Home;
