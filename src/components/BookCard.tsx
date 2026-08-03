import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book } from '../types';
import { useFavorites } from '../context/FavoritesContext';

interface BookCardProps {
  book: Book;
  className?: string;
  /** In Favorites page, show a red filled heart always visible */
  alwaysShowFavorite?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ book, className = '', alwaysShowFavorite = false }) => {
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

  const coverFallback = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden book-card-hover transition-all duration-300 p-4 cursor-pointer ${className}`}
      onClick={() => navigate(`/book/${book.id}`)}
      role="article"
      aria-label={`${book.title} by ${book.author}`}
    >
      <div className="relative mb-4 group">
        <img
          className="w-full aspect-[2/3] object-cover rounded-xl shadow-md"
          src={book.cover || coverFallback}
          alt={book.title}
          onError={(e) => { (e.target as HTMLImageElement).src = coverFallback; }}
          loading="lazy"
        />

        {/* Favorite button */}
        <button
          className={`absolute bottom-3 right-3 p-2 rounded-full shadow-lg transition-all duration-200 ${
            favorited
              ? 'bg-red-500 text-white opacity-100 scale-110'
              : `bg-white/80 hover:bg-white text-primary ${alwaysShowFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`
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
              className="material-symbols-outlined"
              style={{ fontVariationSettings: favorited ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          )}
        </button>
      </div>

      <h3 className="font-headline-md text-body-lg mb-1 line-clamp-1">{book.title}</h3>
      <p className="font-label-md text-label-md text-on-surface-variant mb-1">{book.author}</p>
      {book.category && (
        <p className="text-xs font-semibold text-primary/80 mb-2 uppercase tracking-wide">{book.category}</p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="flex text-amber-400">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFull = book.rating >= star;
            const isHalf = !isFull && book.rating >= star - 0.5;
            return (
              <span
                key={star}
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: isFull || isHalf ? "'FILL' 1" : "'FILL' 0" }}
              >
                {isFull ? 'star' : isHalf ? 'star_half' : 'star_outline'}
              </span>
            );
          })}
        </div>
        <span className="text-label-sm font-medium text-on-surface-variant opacity-60">
          ({typeof book.rating === 'number' ? book.rating.toFixed(1) : '—'})
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <button
          className="w-full py-2.5 rounded-lg border-1.5 border-primary/30 text-primary hover:bg-primary/5 font-semibold text-label-md transition-all"
          onClick={(e) => { e.stopPropagation(); navigate(`/book/${book.id}`); }}
        >
          View Details
        </button>
      </div>
      
      {book.recommendationReason && (
        <div className="mt-3 pt-3 border-t border-outline-variant/30 text-center">
          <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
            {book.recommendationReason}
          </span>
        </div>
      )}
    </div>
  );
};
