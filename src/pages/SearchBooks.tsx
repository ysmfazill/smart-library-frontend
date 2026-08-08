import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import { BookCard } from '../components/BookCard';
import { useDebounce } from '../hooks/useDebounce';
import { bookService } from '../services/bookService';
import { categoryService } from '../services/categoryService';
import type { Book, CategoryDTO } from '../types';
import { mapBookDTO } from '../utils/mappers';

const SKELETON_COUNT = 9;

const BookSkeleton = () => (
  <div className="glass-card rounded-2xl p-4 animate-pulse">
    <div className="w-full aspect-[2/3] bg-surface-container-highest rounded-xl mb-4" />
    <div className="h-4 bg-surface-container-highest rounded w-3/4 mb-2" />
    <div className="h-3 bg-surface-container-highest rounded w-1/2 mb-4" />
    <div className="h-8 bg-surface-container-highest rounded mb-2" />
    <div className="h-8 bg-surface-container-highest rounded" />
  </div>
);

const SearchBooks: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 350);

  // Load categories for filter chips
  useEffect(() => {
    categoryService.getAllCategories().then((res: any) => {
      const list = res?.data || res;
      setCategories(Array.isArray(list) ? list : list?.content || []);
    }).catch(() => {});
  }, []);

  // Search whenever query/filter/page changes
  const search = useCallback(async (pg = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookService.searchBooks(
        debouncedQuery || undefined,
        selectedCategoryId,
        minRating > 0 ? minRating : undefined,
        pg,
        18
      );
      const data = res?.data || res;
      const content = data?.content || (Array.isArray(data) ? data : []);
      const mapped = content.map(mapBookDTO);
      if (pg === 0) {
        setBooks(mapped);
      } else {
        setBooks(prev => [...prev, ...mapped]);
      }
      setTotalPages(data?.totalPages || 1);
      setPage(pg);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedCategoryId, minRating]);

  useEffect(() => {
    search(0);
  }, [search]);

  const handleCategorySelect = (id: number | undefined, name: string) => {
    setSelectedCategoryId(id);
    setSelectedCategoryName(name);
    setPage(0);
  };

  const handleLoadMore = () => search(page + 1);

  const clearAll = () => {
    setSearchQuery('');
    setSelectedCategoryId(undefined);
    setSelectedCategoryName('');
    setMinRating(0);
    setSelectedLanguage('');
    setSelectedYear(undefined);
    setSortBy('relevance');
    setPage(0);
  };

  // Local filtering for language, year, sort
  const filteredAndSortedBooks = React.useMemo(() => {
    let result = [...books];
    
    if (selectedLanguage) {
      result = result.filter(b => b.language?.toLowerCase() === selectedLanguage.toLowerCase());
    }
    
    if (selectedYear) {
      result = result.filter(b => b.publicationYear === selectedYear);
    }
    
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'year_desc') {
      result.sort((a, b) => (b.publicationYear || 0) - (a.publicationYear || 0));
    } else if (sortBy === 'year_asc') {
      result.sort((a, b) => (a.publicationYear || 0) - (b.publicationYear || 0));
    }
    
    return result;
  }, [books, selectedLanguage, selectedYear, sortBy]);

  return (
    <AppLayout>
            {/* Page header */}
            <section className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
                <span>🔍</span> Search Books
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Discover books from thousands of titles using AI-powered search.
              </p>
            </section>

            {/* Search input */}
            <section className="max-w-3xl mx-auto mb-6 sm:mb-8">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 text-[20px]">search</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, category, or keyword…"
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3.5 sm:py-4 bg-surface-container-low border border-outline-variant/20 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-sm sm:text-base outline-none shadow-sm min-h-[48px]"
                  aria-label="Search books"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1"
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                )}
              </div>
            </section>

            {/* Category chips from API */}
            <section className="mb-6 sm:mb-8 overflow-x-auto custom-scrollbar pb-2">
              <div className="flex gap-2 sm:gap-3 min-w-max">
                <button
                  onClick={() => handleCategorySelect(undefined, '')}
                  className={`px-4 sm:px-6 py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-all min-h-[38px] ${
                    !selectedCategoryId ? 'ai-gradient-bg text-white' : 'bg-white/60 border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  All Titles
                </button>
                {categories.slice(0, 10).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id, cat.name)}
                    className={`px-4 sm:px-6 py-2 rounded-full font-semibold text-xs sm:text-sm whitespace-nowrap transition-all min-h-[38px] ${
                      selectedCategoryId === cat.id ? 'ai-gradient-bg text-white' : 'bg-white/60 border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Rating and Advanced filters */}
            <section className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 bg-surface-container-low/50 p-3.5 sm:p-4 rounded-2xl border border-outline-variant/20 w-full max-w-full overflow-hidden">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-on-surface-variant shrink-0">Rating:</span>
                {[0, 3, 3.5, 4, 4.5].map(r => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold transition-all min-h-[32px] shrink-0 ${
                      minRating === r ? 'ai-gradient-bg text-white' : 'bg-surface-container text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {r === 0 ? 'Any' : `⭐ ${r}+`}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select 
                  value={selectedLanguage}
                  onChange={e => setSelectedLanguage(e.target.value)}
                  className="bg-surface-container text-on-surface-variant border border-outline-variant/20 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/50 min-h-[36px] flex-1 sm:flex-none max-w-full"
                >
                  <option value="">All Languages</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>

                <select 
                  value={selectedYear || ''}
                  onChange={e => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="bg-surface-container text-on-surface-variant border border-outline-variant/20 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/50 min-h-[36px] flex-1 sm:flex-none max-w-full"
                >
                  <option value="">Any Year</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                </select>

                <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                  <span className="text-xs font-semibold text-on-surface-variant shrink-0">Sort:</span>
                  <select 
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="bg-surface-container text-on-surface-variant border border-outline-variant/20 rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary/50 min-h-[36px]"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="rating">Rating</option>
                    <option value="title">Title</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Results info */}
            {!loading && (searchQuery || selectedCategoryId || minRating > 0) && (
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-on-surface-variant">
                  {filteredAndSortedBooks.length === 0 ? 'No results' : `${filteredAndSortedBooks.length}${totalPages > 1 ? '+' : ''} books found`}
                  {selectedCategoryName && ` in "${selectedCategoryName}"`}
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
                <button onClick={clearAll} className="text-xs sm:text-sm text-primary hover:underline font-semibold">
                  Clear All
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
                {error}
                <button onClick={() => search(0)} className="ml-3 font-bold underline">Retry</button>
              </div>
            )}

            {/* Results grid */}
            {loading && filteredAndSortedBooks.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => <BookSkeleton key={i} />)}
              </div>
            ) : filteredAndSortedBooks.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
                <span className="material-symbols-outlined text-5xl sm:text-6xl text-primary/30 mb-4">search_off</span>
                <h3 className="text-lg sm:text-xl font-bold mb-2">No Books Found</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mb-6 max-w-sm">
                  We couldn't find any books matching your search. Try different keywords or filters.
                </p>
                <button onClick={clearAll} className="px-6 py-3 rounded-xl ai-gradient-bg text-white text-xs sm:text-sm font-semibold shadow-md min-h-[44px]">
                  Clear Search
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filteredAndSortedBooks.map(book => <BookCard key={book.id} book={book} />)}
                  {loading && Array.from({ length: 4 }).map((_, i) => <BookSkeleton key={`skel-${i}`} />)}
                </div>
                {page < totalPages - 1 && !loading && (
                  <div className="flex justify-center mt-8 sm:mt-10">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 sm:px-8 py-3 rounded-xl ai-gradient-bg text-white text-xs sm:text-sm font-semibold shadow-md hover:scale-105 transition-transform min-h-[48px]"
                    >
                      Load More Books
                    </button>
                  </div>
                )}
              </>
            )}
    </AppLayout>
  );
};

export default SearchBooks;
