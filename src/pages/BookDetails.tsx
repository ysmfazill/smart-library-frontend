import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import AppLayout from '../components/AppLayout';
import { useReadingHistory } from '../context/ReadingHistoryContext';
import { useFavorites } from '../context/FavoritesContext';
import { bookService } from '../services/bookService';
import { recommendationService } from '../services/recommendationService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import type { Book } from '../types';
import { mapBookDTO, estimateReadingTime } from '../utils/mappers';
import { BookCover } from '../components/BookCover';

// ── Skeleton ─────────────────────────────────────────────────────────────────
const DetailSkeleton = () => (
  <div className="grid grid-cols-12 gap-6 animate-pulse">
    <div className="col-span-12 lg:col-span-4 space-y-6">
      <div className="aspect-[3/4] bg-surface-container-highest rounded-xl" />
      <div className="h-6 bg-surface-container-highest rounded w-3/4" />
      <div className="h-4 bg-surface-container-highest rounded w-1/2" />
      <div className="h-14 bg-surface-container-highest rounded-xl" />
    </div>
    <div className="col-span-12 lg:col-span-8 space-y-6">
      <div className="h-4 bg-surface-container-highest rounded w-full" />
      <div className="h-4 bg-surface-container-highest rounded w-5/6" />
      <div className="h-4 bg-surface-container-highest rounded w-4/6" />
      <div className="h-32 bg-surface-container-highest rounded-xl" />
    </div>
  </div>
);

const BookDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { startReading, updateProgress, markCompleted, getEntry, isReading, isCompleted } = useReadingHistory();
  const { isFavorite, toggleFavorite } = useFavorites();

  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [similarBooks, setSimilarBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsError, setReviewsError] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load reviews independently
  const loadReviews = useCallback(async (bookId: string) => {
    setReviewsError(false);
    try {
      const reviewRes: any = await reviewService.getReviewsByBook(bookId, 0, 50);
      const raw = reviewRes?.data !== undefined ? reviewRes.data : reviewRes;
      const reviewList =
        Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.content)
            ? raw.content
            : Array.isArray(raw?.data?.content)
              ? raw.data.content
              : Array.isArray(raw?.data)
                ? raw.data
                : [];
      setReviews(reviewList.filter(Boolean));
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setReviews([]);
      setReviewsError(true);
    }
  }, []);

  // Load book from API
  useEffect(() => {
    if (!id) {
      setError('Invalid Book ID');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBook(null);
    setReviews([]);
    setReviewsError(false);
    setSimilarBooks([]);

    bookService.getBookById(id)
      .then((res: any) => {
        if (cancelled) return;
        const dto = res?.data !== undefined ? res.data : res;
        if (!dto || typeof dto !== 'object' || (!dto.id && !dto.title)) {
          setError('Book not found.');
          setBook(null);
          return;
        }
        const mapped = mapBookDTO(dto);
        if (!mapped.id) {
          setError('Book not found.');
          setBook(null);
          return;
        }
        setBook(mapped);

        // Fetch similar books (non-blocking)
        recommendationService.getSimilarBooks(mapped.id, 3)
          .then((books: any) => {
            if (cancelled) return;
            const raw = books?.data !== undefined ? books.data : books;
            const bookList = Array.isArray(raw) ? raw : (Array.isArray(raw?.content) ? raw.content : []);
            setSimilarBooks(bookList.filter(Boolean));
          })
          .catch(() => {
            if (!cancelled) setSimilarBooks([]);
          });

        // Fetch reviews (non-blocking)
        loadReviews(mapped.id);
      })
      .catch((err: any) => {
        if (!cancelled) {
          console.error('Failed to load book details:', err);
          setError('Unable to load this book.');
          setBook(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, loadReviews]);

  const entry = book ? getEntry(book.id) : undefined;
  const reading = book ? isReading(book.id) : false;
  const completed = book ? isCompleted(book.id) : false;
  const favorited = book ? isFavorite(book.id) : false;

  const safeReviews = Array.isArray(reviews) ? reviews.filter(Boolean) : [];
  const safeSimilarBooks = Array.isArray(similarBooks) ? similarBooks.filter(Boolean) : [];

  const hasReviewed = safeReviews.some(
    r => r && String(r.userId) === String(user?.id)
  );

  const handleFavorite = async () => {
    if (!book || favoriteLoading) return;
    setFavoriteLoading(true);
    try { await toggleFavorite(book.id, book); }
    finally { setFavoriteLoading(false); }
  };

  const handleSubmitReview = async () => {
    if (!book || !user || !reviewRating || submittingReview) return;
    setSubmittingReview(true);
    try {
      await reviewService.addReview(user.id, parseInt(book.id, 10), reviewRating, reviewText);
      setReviewText('');
      setReviewRating(0);
      await loadReviews(book.id);
    } catch (err) {
      console.error('Failed to submit review', err);
      alert('You have already reviewed this book or an error occurred.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleLikeReview = async (reviewId: number, currentlyLiked: boolean) => {
    try {
      if (currentlyLiked) {
        await reviewService.unlikeReview(reviewId);
      } else {
        await reviewService.likeReview(reviewId);
      }
      setReviews(prev => {
        const current = Array.isArray(prev) ? prev.filter(Boolean) : safeReviews;
        return current.map(r => (r && r.id === reviewId) ? {
          ...r,
          isLikedByCurrentUser: !currentlyLiked,
          likesCount: currentlyLiked ? Math.max(0, (r.likesCount || 0) - 1) : (r.likesCount || 0) + 1
        } : r);
      });
    } catch (err) {
      console.error('Failed to like/unlike review', err);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      if (book) {
        await loadReviews(book.id);
      }
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <DetailSkeleton />
      </AppLayout>
    );
  }

  if (error || !book) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[50vh]">
          <span className="material-symbols-outlined text-5xl sm:text-6xl text-primary/30 mb-4">menu_book</span>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface mb-2">
            {error === 'Book not found.' ? 'Book Not Found' : 'Unable to Load Book'}
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mb-6 max-w-md">
            {error || "This book doesn't exist, was removed, or couldn't be loaded at this time."}
          </p>
          <button
            onClick={() => navigate('/search')}
            className="px-6 py-3 rounded-xl ai-gradient-bg text-white font-semibold shadow-md hover:opacity-90 transition-opacity min-h-[48px]"
          >
            Back to Search
          </button>
        </div>
      </AppLayout>
    );
  }

  const safeRating = typeof book.rating === 'number' && !isNaN(book.rating) ? book.rating : 0;

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-on-surface-variant/60 mb-6 fade-in flex-wrap">
        <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/search')}>Search</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span>{book.category}</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary font-bold truncate max-w-[150px] sm:max-w-xs">{book.title}</span>
      </nav>

      <div className="grid grid-cols-12 gap-6 sm:gap-8">
        {/* Left column — cover + actions */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 sm:gap-8 fade-in">
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
            <BookCover book={book} size="large" showBadge className="shadow-[0_32px_64px_-12px_rgba(109,40,217,0.25)] hover-lift" />
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface leading-tight">{book.title}</h2>
              <p className="text-lg sm:text-xl text-primary font-medium mt-1">{book.author}</p>
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-2">
              <div className="flex text-[#FFB800]">
                {[1, 2, 3, 4, 5].map(star => {
                  const isFull = safeRating >= star;
                  const isHalf = !isFull && safeRating >= star - 0.5;
                  return (
                    <span key={star} className="material-symbols-outlined" style={{ fontVariationSettings: isFull || isHalf ? "'FILL' 1" : "'FILL' 0" }}>
                      {isFull ? 'star' : isHalf ? 'star_half' : 'star_outline'}
                    </span>
                  );
                })}
              </div>
              <span className="text-sm text-on-surface font-bold">{safeRating.toFixed(1)}</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">{book.category}</span>
              {Array.isArray(book.keywords) && book.keywords.slice(0, 2).map(kw => (
                <span key={kw} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">{kw}</span>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 border-t border-b border-outline-variant/30 py-6">
            <div>
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1 font-bold">Language</p>
              <p className="text-sm font-medium text-on-surface">{book.language || 'English'}</p>
            </div>
            <div>
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1 font-bold">Year</p>
              <p className="text-sm font-medium text-on-surface">{book.publicationYear || '—'}</p>
            </div>
            {book.pages && (
              <div>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1 font-bold">Pages</p>
                <p className="text-sm font-medium text-on-surface">{book.pages}</p>
              </div>
            )}
            <div>
              <p className="text-[11px] text-on-surface-variant uppercase tracking-wider mb-1 font-bold">Read Time</p>
              <p className="text-sm font-medium text-on-surface">{estimateReadingTime(book.pages)}</p>
            </div>
          </div>

          {/* Progress tracker (if reading) */}
          {(reading || completed) && entry && (
            <div className="glass-card p-4 rounded-xl border border-white/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">
                  {completed ? '✅ Completed' : '📖 Reading Progress'}
                </span>
                <span className="text-sm font-bold text-primary">{entry.progress}%</span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2 mb-2">
                <div className="h-2 rounded-full accent-gradient transition-all duration-500" style={{ width: `${entry.progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium mb-3">
                <span>Page {entry.currentPage || 1} of {entry.totalPages || book.pages || '—'}</span>
                <span>{entry.completed ? '100% finished' : `${entry.progress}% completed`}</span>
              </div>
              {!completed && (
                <>
                  <input
                    type="range"
                    min={0} max={100}
                    value={entry.progress}
                    onChange={e => updateProgress(book.id, parseInt(e.target.value, 10))}
                    className="w-full accent-slider cursor-pointer"
                  />
                  <button
                    onClick={() => markCompleted(book.id)}
                    className="mt-2 w-full py-2 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/5 transition-all min-h-[40px] cursor-pointer"
                  >
                    Mark as Completed 🎉
                  </button>
                </>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {book.bookFileUrl ? (
              <button
                onClick={async () => {
                  if (!reading && !completed) {
                    await startReading(book.id);
                  }
                  navigate(`/read/${book.id}`);
                }}
                className="h-14 rounded-xl font-bold text-base shadow-lg hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer accent-gradient text-white shadow-primary/25 hover:shadow-primary/40"
              >
                <span className="material-symbols-outlined">
                  {completed ? 'replay' : reading ? 'play_arrow' : 'menu_book'}
                </span>
                {completed ? '📖 Read Again' : reading ? '📖 Continue Reading' : '📖 Start Reading'}
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-3">
                <span className="material-symbols-outlined text-xl shrink-0">info</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Digital Reading Copy</p>
                  <p className="text-xs font-medium mt-0.5">Digital reading copy not available for this book.</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleFavorite}
                disabled={favoriteLoading}
                className={`flex-1 h-12 border-1.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  favorited ? 'bg-red-50 border-red-300 text-red-500' : 'border-primary/30 text-primary hover:bg-primary/5'
                }`}
              >
                {favoriteLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: favorited ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                )}
                {favorited ? 'Saved' : 'Add to Favorites'}
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="glass-card p-6 rounded-xl border border-white/20 flex flex-col items-center justify-center">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Scan to Share</h3>
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <QRCodeSVG
                value={typeof window !== 'undefined' ? window.location.href : `https://smartlibrary.com/book/${book.id}`}
                size={140}
                fgColor="#1a1a1a"
                bgColor="#ffffff"
                level="Q"
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-3 text-center">Share this book with friends instantly</p>
          </div>
        </div>

        {/* Right column — details & reviews */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8 sm:gap-10 fade-in" style={{ animationDelay: '0.2s' }}>
          {/* Synopsis */}
          <section>
            <h3 className="text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-3">Synopsis</h3>
            <p className="text-base sm:text-lg text-on-surface leading-relaxed max-w-3xl">
              {book.description || `A comprehensive exploration of ${book.category}. ${book.author} delivers an in-depth look at foundational principles and modern applications in the field.`}
            </p>
          </section>

          {/* Book stats */}
          {book.pages && (
            <section className="grid grid-cols-3 gap-4 sm:gap-6">
              <div className="glass-card p-4 sm:p-6 rounded-xl border border-white/20 flex flex-col items-center text-center bg-white/40">
                <span className="material-symbols-outlined text-primary mb-2">description</span>
                <span className="text-lg sm:text-2xl font-bold text-on-surface">{book.pages}</span>
                <span className="text-xs text-on-surface-variant">Pages</span>
              </div>
              <div className="glass-card p-4 sm:p-6 rounded-xl border border-white/20 flex flex-col items-center text-center bg-white/40">
                <span className="material-symbols-outlined text-primary mb-2">schedule</span>
                <span className="text-lg sm:text-2xl font-bold text-on-surface">{estimateReadingTime(book.pages)}</span>
                <span className="text-xs text-on-surface-variant">Est. Read Time</span>
              </div>
              <div className="glass-card p-4 sm:p-6 rounded-xl border border-white/20 flex flex-col items-center text-center bg-white/40">
                <span className="material-symbols-outlined text-primary mb-2">star</span>
                <span className="text-lg sm:text-2xl font-bold text-on-surface">{safeRating.toFixed(1)}</span>
                <span className="text-xs text-on-surface-variant">Rating</span>
              </div>
            </section>
          )}

          {/* Reviews Section */}
          <section className="mt-4">
            <h3 className="text-xl sm:text-2xl font-bold text-on-surface mb-6">Reviews & Ratings</h3>

            {/* Write Review */}
            {Boolean(user?.id) && !hasReviewed && (
              <div className="bg-surface-container-low p-5 sm:p-6 rounded-2xl mb-8 border border-outline-variant/30">
                <h4 className="font-bold text-on-surface mb-3 text-sm sm:text-base">Write a Review</h4>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setReviewRating(star)} className="text-[#FFB800] hover:scale-110 transition-transform cursor-pointer">
                      <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: reviewRating >= star ? "'FILL' 1" : "'FILL' 0" }}>
                        {reviewRating >= star ? 'star' : 'star_outline'}
                      </span>
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts about this book..."
                  className="w-full bg-surface border border-outline-variant/30 rounded-xl p-4 min-h-[100px] outline-none focus:border-primary/50 text-sm mb-4"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || reviewRating === 0}
                  className="px-6 py-2.5 bg-primary text-white font-bold text-sm rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors cursor-pointer min-h-[44px]"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}

            {/* Review List / Error / Empty States */}
            <div className="space-y-4 sm:space-y-6">
              {reviewsError ? (
                <p className="text-on-surface-variant opacity-70 text-sm italic">
                  Reviews are currently unavailable.
                </p>
              ) : safeReviews.length === 0 ? (
                <p className="text-on-surface-variant opacity-70 text-sm">
                  No reviews yet. Be the first to review this book!
                </p>
              ) : (
                safeReviews.map(review => {
                  const authorName = review.userName || 'Anonymous Reader';
                  const avatarSrc = review.userAvatar ? (review.userAvatar.includes('/') ? review.userAvatar : `/avatars/${review.userAvatar}`) : null;
                  return (
                    <div key={review.id} className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/30">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center shrink-0">
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={authorName}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <span className="text-primary font-bold text-xs">{authorName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface text-sm">{authorName}</p>
                            <p className="text-xs text-on-surface-variant opacity-70">
                              {review.reviewDate ? new Date(review.reviewDate).toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <div className="flex text-[#FFB800]">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: (review.rating || 0) >= star ? "'FILL' 1" : "'FILL' 0" }}>
                              {(review.rating || 0) >= star ? 'star' : 'star_outline'}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-on-surface text-sm leading-relaxed mb-4">{review.comment}</p>

                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <button
                          onClick={() => handleLikeReview(review.id, review.isLikedByCurrentUser)}
                          className={`flex items-center gap-1.5 transition-colors cursor-pointer ${review.isLikedByCurrentUser ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                        >
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: review.isLikedByCurrentUser ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span>
                          {review.likesCount || 0} {(review.likesCount === 1) ? 'Like' : 'Likes'}
                        </button>

                        {review.userId === user?.id && (
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Similar Works */}
          {safeSimilarBooks.length > 0 && (
            <section className="mt-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-on-surface">Readers Also Liked</h3>
                <button
                  onClick={() => navigate(`/search?category=${encodeURIComponent(book.category)}`)}
                  className="text-primary font-bold text-xs sm:text-sm flex items-center gap-1 hover:underline cursor-pointer"
                >
                  View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
              <div className="flex gap-4 sm:gap-6 overflow-x-auto custom-scrollbar pb-4">
                {safeSimilarBooks.map(simBook => (
                  <div
                    key={simBook.id}
                    className="flex-none w-36 sm:w-48 group cursor-pointer"
                    onClick={() => navigate(`/book/${simBook.id}`)}
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-shadow">
                      <img
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        src={simBook.cover}
                        alt={simBook.title}
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'; }}
                      />
                    </div>
                    <p className="font-bold text-on-surface truncate text-xs sm:text-sm">{simBook.title}</p>
                    <p className="text-xs text-on-surface-variant truncate">{simBook.author}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default BookDetails;
