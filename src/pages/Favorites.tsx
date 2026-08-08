import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { BookCard } from '../components/BookCard';
import { useFavorites } from '../context/FavoritesContext';
import type { Book } from '../types';

type SortOption = 'newest' | 'highest_rated' | 'alphabetical';

const Favorites: React.FC = () => {
  const { favorites, count } = useFavorites();
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
    <AppLayout>
      {/* ── Header ── */}
      <section className="mb-6 sm:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2.5 sm:gap-3">
            <span
              className="material-symbols-outlined text-red-500 text-3xl sm:text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            My Favorites
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            {count === 0
              ? 'Your curated reading list — add books to build your collection.'
              : `${count} book${count !== 1 ? 's' : ''} saved to your personal library.`}
          </p>
        </div>

        {/* Stats pill */}
        {count > 0 && (
          <div className="glass-card px-4 sm:px-6 py-3 sm:py-4 rounded-2xl flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-bold text-primary">{count}</p>
              <p className="text-[10px] sm:text-xs text-on-surface-variant">Saved</p>
            </div>
            <div className="w-px h-8 bg-outline-variant/20" />
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-bold text-primary">
                {count > 0
                  ? (favoriteBooks.reduce((s, b) => s + b.rating, 0) / favoriteBooks.length).toFixed(1)
                  : '—'}
              </p>
              <p className="text-[10px] sm:text-xs text-on-surface-variant">Avg Rating</p>
            </div>
          </div>
        )}
      </section>
      {/* ── Empty State / Content ── */}

            {count === 0 ? (
              /* ── Empty State ── */
              <div className="flex flex-col items-center justify-center py-20 sm:py-32 text-center px-4">
                <div className="relative mb-6 sm:mb-8">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/5 flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-5xl sm:text-7xl text-primary/20"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/15 scale-110" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-on-surface">
                  No favorites yet
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm leading-relaxed mb-6">
                  Tap the <span className="inline-flex align-middle mx-1 text-red-400 material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span> heart on any book card to save it here for quick access.
                </p>
                <button
                  onClick={() => window.location.href = '/search'}
                  className="px-6 py-3 rounded-xl ai-gradient-bg text-white font-bold text-xs sm:text-sm shadow-md min-h-[48px]"
                >
                  Browse Books
                </button>
              </div>
            ) : (
              <>
                {/* Controls bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 sm:mb-8 bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/20">
                  <div className="relative flex-1 max-w-md">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search favorites by title, author, or category…"
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 min-h-[40px]"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                    <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">Sort:</span>
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[36px] ${
                          sortBy === opt.value
                            ? 'ai-gradient-bg text-white shadow-sm'
                            : 'bg-surface-container text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {sorted.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <span className="material-symbols-outlined text-5xl text-primary/30 mb-3">search_off</span>
                    <h3 className="text-lg font-bold mb-1">No matches found</h3>
                    <p className="text-xs text-on-surface-variant mb-4">Try a different search term.</p>
                    <button
                      onClick={() => setSearch('')}
                      className="px-5 py-2.5 rounded-xl border border-primary/30 text-primary font-semibold text-xs sm:text-sm hover:bg-primary/5 transition-all min-h-[44px]"
                    >
                      Clear Filter
                    </button>
                  </div>
                )}
              </>
            )}
    </AppLayout>
  );
};

export default Favorites;
