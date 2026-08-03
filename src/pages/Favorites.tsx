import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { BookCard } from '../components/BookCard';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import type { Book } from '../types';

type SortOption = 'newest' | 'highest_rated' | 'alphabetical';

const Favorites: React.FC = () => {
  const { favorites, count, removeFavorite } = useFavorites();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');

  // Use full Book[] from API-backed context (no placeholderData)
  const favoriteBooks: Book[] = favorites;

  // Filter by search
  const filtered = favoriteBooks.filter(b =>
    !search ||
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'highest_rated') return b.rating - a.rating;
    if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
    // 'newest' — by publicationYear desc, then by id desc
    return (b.publicationYear ?? 0) - (a.publicationYear ?? 0) || parseInt(b.id) - parseInt(a.id);
  });

  // count comes from the API-backed FavoritesContext

  const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
    { value: 'newest',        label: 'Newest First',    icon: 'schedule'    },
    { value: 'highest_rated', label: 'Highest Rated',   icon: 'star'        },
    { value: 'alphabetical',  label: 'A → Z',           icon: 'sort_by_alpha' },
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen relative overflow-x-hidden">
      {/* Atmospheric background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-primary/5" />
      </div>

      <Navbar />
      <Sidebar />

      <main className="md:ml-sidebar-width pt-28 px-container-padding pb-section-gap max-w-[1440px] mx-auto min-h-screen">

        {/* ── Header ── */}
        <section className="mb-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container shrink-0">
            <img src={user?.avatar?.includes('/') ? user.avatar : `/avatars/${user?.avatar || 'avatar1.png'}`} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { if (!(e.target as HTMLImageElement).src.endsWith('/avatars/avatar1.png')) { (e.target as HTMLImageElement).src = '/avatars/avatar1.png'; } }} />
          </div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-1">
            <div>
              <h1 className="font-headline-lg text-headline-lg mb-1 flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-red-500 text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
                My Favorites
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {count === 0
                  ? 'Your curated reading list — add books to build your collection.'
                  : `${count} book${count !== 1 ? 's' : ''} saved to your personal library.`}
              </p>
            </div>

            {/* Stats pill */}
            {count > 0 && (
              <div className="glass-card px-6 py-4 rounded-2xl flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <p className="text-headline-md font-bold text-primary">{count}</p>
                  <p className="text-label-sm text-on-surface-variant">Saved</p>
                </div>
                <div className="w-px h-10 bg-outline-variant/40" />
                <div className="text-center">
                  <p className="text-headline-md font-bold text-primary">
                    {count > 0
                      ? (favoriteBooks.reduce((s, b) => s + b.rating, 0) / favoriteBooks.length).toFixed(1)
                      : '—'}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">Avg Rating</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {count === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full bg-primary/5 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-7xl text-primary/20"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  favorite
                </span>
              </div>
              {/* decorative ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/15 scale-110" />
            </div>
            <h3 className="font-headline-md text-headline-md mb-3 text-on-surface">
              No favorites yet
            </h3>
            <p className="text-on-surface-variant max-w-sm leading-relaxed mb-8">
              Tap the <span className="inline-flex align-middle mx-1 text-red-400 material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span> heart on any book card to save it here for quick access.
            </p>
            <a
              href="/search"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl ai-gradient-bg text-white font-bold shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">search</span>
              Browse Books
            </a>
          </div>
        ) : (
          <>
            {/* ── Toolbar: Search + Sort ── */}
            <section className="mb-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              {/* search */}
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                  search
                </span>
                <input
                  className="w-full bg-white/60 backdrop-blur-md border border-white/40 rounded-xl py-3 pl-12 pr-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all shadow-md placeholder:text-on-surface-variant/50"
                  placeholder="Filter your favorites…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* sort pills */}
              <div className="flex gap-2 shrink-0">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-label-md font-semibold transition-all ${
                      sortBy === opt.value
                        ? 'ai-gradient-bg text-white shadow-md'
                        : 'bg-white/60 border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {opt.icon}
                    </span>
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* ── Clear all ── */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-label-md text-on-surface-variant">
                Showing <span className="font-bold text-on-surface">{sorted.length}</span> book{sorted.length !== 1 ? 's' : ''}
                {search && ` matching "${search}"`}
              </p>
              <button
                onClick={() => favorites.forEach((b: Book) => removeFavorite(b.id))}
                className="text-label-sm text-on-surface-variant hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                Clear All
              </button>
            </div>

            {sorted.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
                {sorted.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    alwaysShowFavorite
                  />
                ))}
              </div>
            ) : (
              /* no results from filter search */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">search_off</span>
                <h3 className="font-headline-md text-headline-md mb-2">No matches found</h3>
                <p className="text-on-surface-variant">Try a different search term.</p>
                <button
                  onClick={() => setSearch('')}
                  className="mt-4 px-6 py-2 rounded-xl border border-primary/30 text-primary font-semibold hover:bg-primary/5 transition-all"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="md:ml-sidebar-width bg-surface border-t border-outline-variant/30 py-8 mt-section-gap relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-container-padding max-w-[1440px] mx-auto gap-4 text-label-sm text-on-surface-variant">
          <p>© 2024 Aethelgard AI. Precision in knowledge.</p>
          <div className="flex gap-8">
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Favorites;
