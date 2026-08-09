import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  className?: string;
  /** In Favorites page, show a red filled heart always visible */
  alwaysShowFavorite?: boolean;
}

export const BookCard: React.FC<BookCardProps> = React.memo(({ book, className = '', alwaysShowFavorite = false }) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const favorited = isFavorite(book.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      await toggleFavorite(book.id, book);
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden book-card-hover transition-all duration-300 p-3.5 sm:p-4 cursor-pointer flex flex-col justify-between w-full h-full ${className}`}
      onClick={() => navigate(`/book/${book.id}`)}
      role="article"
      aria-label={`${book.title} by ${book.author}`}
    >
      <div>
        <div className="relative mb-3 sm:mb-4 group">
          <BookCover book={book} />

          {/* Favorite button */}
          <button
            className={`absolute bottom-3 right-3 p-2.5 rounded-full shadow-lg transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              favorited
                ? 'bg-red-500 text-white opacity-100 scale-110'
                : `bg-white/90 hover:bg-white text-primary ${alwaysShowFavorite ? 'opacity-100' : 'opacity-100 sm:opacity-0 group-hover:opacity-100'}`
            } ${favoriteLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleFavoriteClick}
            disabled={favoriteLoading}
            title={favorited ? 'Remove from Favorites' : 'Add to Favorites'}
            aria-label={favorited ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            {favoriteLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: favorited ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
            )}
          </button>
        </div>

        <h3 className="text-sm sm:text-base font-bold mb-1 line-clamp-1 text-on-surface">{book.title}</h3>
        <p className="text-xs sm:text-sm text-on-surface-variant mb-1 line-clamp-1">{book.author}</p>
        {book.category && (
          <p className="text-[10px] sm:text-xs font-semibold text-primary/80 mb-2 uppercase tracking-wide truncate">{book.category}</p>
        )}

        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFull = book.rating >= star;
              const isHalf = !isFull && book.rating >= star - 0.5;
              return (
                <span
                  key={star}
                  className="material-symbols-outlined text-xs sm:text-sm"
                  style={{ fontVariationSettings: isFull || isHalf ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {isFull ? 'star' : isHalf ? 'star_half' : 'star_outline'}
                </span>
              );
            })}
          </div>
          <span className="text-xs font-medium text-on-surface-variant opacity-70">
            ({typeof book.rating === 'number' ? book.rating.toFixed(1) : '—'})
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <button
          className="w-full min-h-[44px] py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); navigate(`/book/${book.id}`); }}
        >
          View Details
        </button>
        
        {book.recommendationReason && (
          <div className="mt-2 pt-2 border-t border-outline-variant/30 text-center">
            <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full truncate max-w-full">
              {book.recommendationReason}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
