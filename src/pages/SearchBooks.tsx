import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
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
    <div className="bg-surface text-on-surface min-h-screen relative overflow-x-hidden">
      <div className="fixed inset-0 w-full h-full -z-10 opacity-40 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10" />
      </div>

      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto px-10 py-8">
            {/* Page header */}
            <section className="mb-10">
              <h1 className="font-headline-lg text-headline-lg mb-2 flex items-center gap-3">
                <span>🔍</span> Search Books
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Discover books from thousands of titles using AI-powered search.
              </p>
            </section>

            {/* Search input */}
            <section className="max-w-3xl mx-auto mb-10">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50">search</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, category, or keyword…"
                  className="w-full pl-12 pr-12 py-4 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-base outline-none shadow-sm"
                  aria-label="Search books"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                    aria-label="Clear search"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
            </section>

            {/* Category chips from API */}
            <section className="mb-8 overflow-x-auto no-scrollbar pb-2">
              <div className="flex gap-3 min-w-max">
                <button
                  onClick={() => handleCategorySelect(undefined, '')}
                  className={`px-6 py-2 rounded-full font-semibold text-label-md whitespace-nowrap transition-all ${
                    !selectedCategoryId ? 'ai-gradient-bg text-white' : 'bg-white/60 border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  All Titles
                </button>
                {categories.slice(0, 10).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id, cat.name)}
                    className={`px-6 py-2 rounded-full font-semibold text-label-md whitespace-nowrap transition-all ${
                      selectedCategoryId === cat.id ? 'ai-gradient-bg text-white' : 'bg-white/60 border border-outline-variant/30 text-on-surface-variant hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Rating and Advanced filters */}
            <section className="mb-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 mr-4">
                <span className="text-label-sm text-on-surface-variant font-semibold whitespace-nowrap">Rating:</span>
                {[0, 3, 3.5, 4, 4.5].map(r => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`px-3 py-1 rounded-full text-label-sm font-semibold transition-all ${
                      minRating === r ? 'ai-gradient-bg text-white' : 'bg-surface-container-low text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    {r === 0 ? 'Any' : `⭐ ${r}+`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select 
                  value={selectedLanguage}
                  onChange={e => setSelectedLanguage(e.target.value)}
                  className="bg-surface-container-low text-on-surface-variant border-none rounded-xl px-3 py-1.5 text-label-sm font-semibold outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="">All Languages</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select 
                  value={selectedYear || ''}
                  onChange={e => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="bg-surface-container-low text-on-surface-variant border-none rounded-xl px-3 py-1.5 text-label-sm font-semibold outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="">Any Year</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                </select>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-label-sm text-on-surface-variant font-semibold whitespace-nowrap">Sort By:</span>
                <select 
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-surface-container-low text-on-surface-variant border-none rounded-xl px-3 py-1.5 text-label-sm font-semibold outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating">Highest Rated</option>
                  <option value="year_desc">Newest First</option>
                  <option value="year_asc">Oldest First</option>
                </select>
              </div>
            </section>

            {/* Results info */}
            {!loading && (searchQuery || selectedCategoryId || minRating > 0) && (
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-on-surface-variant">
                  {filteredAndSortedBooks.length === 0 ? 'No results' : `${filteredAndSortedBooks.length}${totalPages > 1 ? '+' : ''} books found`}
                  {selectedCategoryName && ` in "${selectedCategoryName}"`}
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
                <button onClick={clearAll} className="text-sm text-primary hover:underline font-semibold">
                  Clear All
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
                <button onClick={() => search(0)} className="ml-3 font-bold underline">Retry</button>
              </div>
            )}

            {/* Results grid */}
            {loading && filteredAndSortedBooks.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
                {Array.from({ length: SKELETON_COUNT }).map((_, i) => <BookSkeleton key={i} />)}
              </div>
            ) : filteredAndSortedBooks.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">search_off</span>
                <h3 className="font-headline-md text-headline-md mb-2">No Books Found</h3>
                <p className="text-on-surface-variant mb-6">
                  We couldn't find any books matching your search. Try different keywords or filters.
                </p>
                <button onClick={clearAll} className="px-6 py-3 rounded-xl ai-gradient-bg text-white font-semibold shadow-md">
                  Clear Search
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
                  {filteredAndSortedBooks.map(book => <BookCard key={book.id} book={book} />)}
                  {loading && Array.from({ length: 4 }).map((_, i) => <BookSkeleton key={`skel-${i}`} />)}
                </div>
                {page < totalPages - 1 && !loading && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={handleLoadMore}
                      className="px-8 py-3 rounded-xl ai-gradient-bg text-white font-semibold shadow-md hover:scale-105 transition-transform"
                    >
                      Load More Books
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchBooks;
