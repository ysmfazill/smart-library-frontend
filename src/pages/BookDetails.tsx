import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useReadingHistory } from '../context/ReadingHistoryContext';
import { useFavorites } from '../context/FavoritesContext';
import { bookService } from '../services/bookService';
import { recommendationService } from '../services/recommendationService';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import type { Book } from '../types';
import { mapBookDTO, estimateReadingTime } from '../utils/mappers';

// ── Skeleton ─────────────────────────────────────────────────────────────────
const DetailSkeleton = () => (
  <div className="grid grid-cols-12 gap-gutter animate-pulse">
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
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);


  // Load book from API
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    bookService.getBookById(id)
      .then((res: any) => {
        if (cancelled) return;
        const dto = res?.data || res;
        const mapped = mapBookDTO(dto);
        setBook(mapped);
        if (mapped.id) {
          recommendationService.getSimilarBooks(mapped.id, 3)
            .then(books => {
              if (cancelled) return;
              setSimilarBooks(books);
            }).catch(() => {});
            
          reviewService.getReviewsByBook(mapped.id, 0, 50)
            .then((res: any) => {
              if (cancelled) return;
              setReviews(res.content || res);
            }).catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setError('Book not found.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const entry = book ? getEntry(book.id) : undefined;
  const reading = book ? isReading(book.id) : false;
  const completed = book ? isCompleted(book.id) : false;
  const favorited = book ? isFavorite(book.id) : false;

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
      const newReview = await reviewService.addReview(user.id, parseInt(book.id, 10), reviewRating, reviewText);
      setReviews([newReview, ...reviews]);
      setReviewText('');
      setReviewRating(0);
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
        setReviews(reviews.map(r => r.id === reviewId ? { ...r, isLikedByCurrentUser: false, likesCount: r.likesCount - 1 } : r));
      } else {
        await reviewService.likeReview(reviewId);
        setReviews(reviews.map(r => r.id === reviewId ? { ...r, isLikedByCurrentUser: true, likesCount: r.likesCount + 1 } : r));
      }
    } catch (err) {
      console.error('Failed to like/unlike review', err);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (err) {
      console.error('Failed to delete review', err);
    }
  };



  if (loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen">
        <Sidebar />
        <Navbar />
        <main className="pt-20 md:ml-sidebar-width min-h-screen px-container-padding pb-section-gap">
          <div className="max-w-[1440px] mx-auto mt-10"><DetailSkeleton /></div>
        </main>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
        <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">menu_book</span>
        <h2 className="text-2xl font-bold text-on-surface mb-2">Book Not Found</h2>
        <p className="text-on-surface-variant mb-6">This book doesn't exist or was removed.</p>
        <button onClick={() => navigate('/search')} className="px-6 py-3 rounded-xl ai-gradient-bg text-white font-semibold">
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen relative overflow-x-hidden selection:bg-primary/20">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5" />
      </div>
      <Sidebar />
      <Navbar />
      <main className="relative z-10 pt-20 md:ml-sidebar-width min-h-screen px-container-padding pb-section-gap">
        <div className="max-w-[1440px] mx-auto mt-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-label-sm text-on-surface-variant/60 mb-8 fade-in">
            <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/search')}>Search</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{book.category}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold truncate max-w-[200px]">{book.title}</span>
          </nav>

          <div className="grid grid-cols-12 gap-gutter">
            {/* Left column — cover + actions */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-8 fade-in">
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(109,40,217,0.25)] hover-lift">
                  <img
                    className="w-full h-full object-cover"
                    src={book.cover}
                    alt={book.title}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="font-display text-headline-lg font-bold text-on-surface">{book.title}</h2>
                  <p className="text-headline-md text-primary font-medium">{book.author}</p>
                </div>

                {/* Star rating */}
                <div className="flex items-center gap-2">
                  <div className="flex text-[#FFB800]">
                    {[1,2,3,4,5].map(star => {
                      const isFull = book.rating >= star;
                      const isHalf = !isFull && book.rating >= star - 0.5;
                      return (
                        <span key={star} className="material-symbols-outlined" style={{ fontVariationSettings: isFull || isHalf ? "'FILL' 1" : "'FILL' 0" }}>
                          {isFull ? 'star' : isHalf ? 'star_half' : 'star_outline'}
                        </span>
                      );
                    })}
                  </div>
                  <span className="font-label-md text-on-surface font-bold">{book.rating.toFixed(1)}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-label-sm">{book.category}</span>
                  {book.keywords?.slice(0, 2).map(kw => (
                    <span key={kw} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-label-sm">{kw}</span>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-outline-variant/30 py-6">
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Language</p>
                  <p className="text-body-md font-medium">{book.language || 'English'}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Year</p>
                  <p className="text-body-md font-medium">{book.publicationYear || '—'}</p>
                </div>
                {book.pages && (
                  <div>
                    <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Pages</p>
                    <p className="text-body-md font-medium">{book.pages}</p>
                  </div>
                )}
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Read Time</p>
                  <p className="text-body-md font-medium">{estimateReadingTime(book.pages)}</p>
                </div>
              </div>

              {/* Progress tracker (if reading) */}
              {(reading || completed) && entry && (
                <div className="glass-card p-4 rounded-xl border border-white/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                      {completed ? '✅ Completed' : '📖 Reading Progress'}
                    </span>
                    <span className="text-label-md font-bold text-primary">{entry.progress}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-2 mb-3">
                    <div className="h-2 rounded-full accent-gradient transition-all duration-500" style={{ width: `${entry.progress}%` }} />
                  </div>
                  {!completed && (
                    <>
                      <input
                        type="range"
                        min={0} max={100}
                        value={entry.progress}
                        onChange={e => updateProgress(book.id, parseInt(e.target.value))}
                        className="w-full accent-slider cursor-pointer"
                      />
                      <button
                        onClick={() => markCompleted(book.id)}
                        className="mt-2 w-full py-2 rounded-lg border border-primary/30 text-primary text-label-sm font-semibold hover:bg-primary/5 transition-all"
                      >
                        Mark as Completed
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => !completed && startReading(book.id)}
                  disabled={completed}
                  className={`h-14 rounded-xl font-bold text-body-md shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${
                    completed
                      ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                      : 'accent-gradient text-white shadow-primary/25 hover:shadow-primary/40'
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {completed ? 'check_circle' : reading ? 'play_arrow' : 'menu_book'}
                  </span>
                  {completed ? 'Finished Reading' : reading ? 'Continue Reading' : 'Start Reading'}
                </button>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleFavorite}
                    disabled={favoriteLoading}
                    className={`flex-1 h-12 border-1.5 rounded-xl font-semibold text-label-md transition-colors flex items-center justify-center gap-2 ${
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
              <div className="glass-card p-6 rounded-xl border border-white/20 flex flex-col items-center justify-center mt-4">
                <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Scan to Share</h3>
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <QRCodeSVG 
                    value={window.location.href} 
                    size={150} 
                    fgColor="#1a1a1a"
                    bgColor="#ffffff"
                    level="Q"
                  />
                </div>
                <p className="text-xs text-on-surface-variant mt-4 text-center">Share this book with friends instantly</p>
              </div>
            </div>

            {/* Right column — details */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-10 fade-in" style={{ animationDelay: '0.2s' }}>
              {/* Synopsis */}
              <section>
                <h3 className="text-label-sm text-on-surface-variant uppercase tracking-widest font-bold mb-4">Synopsis</h3>
                <p className="font-body-lg text-body-lg text-on-surface leading-relaxed max-w-3xl">
                  {book.description || `A comprehensive exploration of ${book.category}. ${book.author} delivers an in-depth look at foundational principles and modern applications in the field.`}
                </p>
              </section>

              {/* Book stats */}
              {book.pages && (
                <section className="grid grid-cols-3 gap-6">
                  <div className="glass-card p-6 rounded-xl border border-white/20 flex flex-col items-center text-center bg-white/40">
                    <span className="material-symbols-outlined text-primary mb-2">description</span>
                    <span className="text-headline-md font-bold">{book.pages}</span>
                    <span className="text-label-sm text-on-surface-variant">Pages</span>
                  </div>
                  <div className="glass-card p-6 rounded-xl border border-white/20 flex flex-col items-center text-center bg-white/40">
                    <span className="material-symbols-outlined text-primary mb-2">schedule</span>
                    <span className="text-headline-md font-bold">{estimateReadingTime(book.pages)}</span>
                    <span className="text-label-sm text-on-surface-variant">Est. Read Time</span>
                  </div>
                  <div className="glass-card p-6 rounded-xl border border-white/20 flex flex-col items-center text-center bg-white/40">
                    <span className="material-symbols-outlined text-primary mb-2">star</span>
                    <span className="text-headline-md font-bold">{book.rating.toFixed(1)}</span>
                    <span className="text-label-sm text-on-surface-variant">Rating</span>
                  </div>
                </section>
              )}



              {/* Reviews Section */}
              <section className="mt-8">
                <h3 className="font-headline-md text-headline-md mb-6">Reviews & Ratings</h3>
                
                {/* Write Review */}
                {!reviews.some(r => r.userId === user?.id) && (
                  <div className="bg-surface-container-low p-6 rounded-2xl mb-8 border border-outline-variant/30">
                    <h4 className="font-bold text-on-surface mb-4">Write a Review</h4>
                    <div className="flex gap-2 mb-4">
                      {[1,2,3,4,5].map(star => (
                        <button key={star} onClick={() => setReviewRating(star)} className="text-[#FFB800] hover:scale-110 transition-transform">
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
                      className="px-6 py-2 bg-primary text-white font-bold rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                )}

                {/* Review List */}
                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <p className="text-on-surface-variant opacity-70">No reviews yet. Be the first to review this book!</p>
                  ) : (
                    reviews.map(review => (
                      <div key={review.id} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden flex items-center justify-center shrink-0">
                              {review.userAvatar ? (
                                <img src={review.userAvatar.includes('/') ? review.userAvatar : `/avatars/${review.userAvatar}`} alt={review.userName} className="w-full h-full object-cover" onError={(e) => { if (!(e.target as HTMLImageElement).src.endsWith('/avatars/avatar1.png')) { (e.target as HTMLImageElement).src = '/avatars/avatar1.png'; } }} />
                              ) : (
                                <span className="text-primary font-bold">{review.userName.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-on-surface text-sm">{review.userName}</p>
                              <p className="text-xs text-on-surface-variant opacity-70">
                                {new Date(review.reviewDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex text-[#FFB800]">
                            {[1,2,3,4,5].map(star => (
                              <span key={star} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: review.rating >= star ? "'FILL' 1" : "'FILL' 0" }}>
                                {review.rating >= star ? 'star' : 'star_outline'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-on-surface text-sm leading-relaxed mb-4">{review.comment}</p>
                        
                        <div className="flex items-center gap-4 text-xs font-semibold">
                          <button 
                            onClick={() => handleLikeReview(review.id, review.isLikedByCurrentUser)}
                            className={`flex items-center gap-1.5 transition-colors ${review.isLikedByCurrentUser ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                          >
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: review.isLikedByCurrentUser ? "'FILL' 1" : "'FILL' 0" }}>thumb_up</span>
                            {review.likesCount} {review.likesCount === 1 ? 'Like' : 'Likes'}
                          </button>
                          
                          {review.userId === user?.id && (
                            <button 
                              onClick={() => handleDeleteReview(review.id)}
                              className="text-red-500 hover:text-red-600 flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Similar Works */}
              {similarBooks.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-headline-md text-headline-md">Readers Also Liked</h3>
                    <button
                      onClick={() => navigate(`/search?category=${book.category}`)}
                      className="text-primary font-bold text-label-md flex items-center gap-1 hover:underline"
                    >
                      View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                  <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                    {similarBooks.map(simBook => (
                      <div
                        key={simBook.id}
                        className="flex-none w-48 group cursor-pointer"
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
                        <p className="font-bold text-on-surface truncate">{simBook.title}</p>
                        <p className="text-label-sm text-on-surface-variant truncate">{simBook.author}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookDetails;
