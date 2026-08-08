import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { bookService } from '../services/bookService';
import { historyService } from '../services/historyService';
import { useAuth } from '../context/AuthContext';
import { useReadingHistory } from '../context/ReadingHistoryContext';
import type { Book } from '../types';
import { mapBookDTO } from '../utils/mappers';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const Reader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reload: reloadHistory } = useReadingHistory();

  const [book, setBook] = useState<Book | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [fitToWidth, setFitToWidth] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showCompletedModal, setShowCompletedModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progressPercentage = numPages > 0 ? Math.min(100, Math.round((currentPage / numPages) * 100)) : 0;

  // 1. Fetch Book & Initial Progress
  useEffect(() => {
    if (!id) {
      setError('Invalid Book ID');
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const initReader = async () => {
      try {
        // Fetch book details
        const res: any = await bookService.getBookById(id);
        const dto = res?.data !== undefined ? res.data : res;
        const mappedBook = mapBookDTO(dto);

        if (!mappedBook || !mappedBook.id) {
          throw new Error('Book not found.');
        }

        if (!mappedBook.bookFileUrl) {
          throw new Error('Digital reading copy is not available for this book.');
        }

        if (isMounted) setBook(mappedBook);

        // Determine PDF file source URL
        let pdfUrl = mappedBook.bookFileUrl;
        if (!pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://')) {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
          pdfUrl = `${baseUrl}/books/${mappedBook.id}/file`;
        }

        // Fetch auth headers if available
        const token = localStorage.getItem('token');
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          httpHeaders: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });

        const pdf = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(pdf);
        setNumPages(pdf.numPages);

        // Fetch initial user progress
        let initialPage = 1;
        if (user?.id) {
          try {
            const historyRes: any = await historyService.getReadingProgressByBook(user.id, Number(mappedBook.id));
            const historyData = historyRes?.data || historyRes;
            if (historyData && historyData.currentPage && historyData.currentPage > 0) {
              initialPage = Math.min(historyData.currentPage, pdf.numPages);
            }
          } catch {
            // Default to page 1 if progress fetch fails
            initialPage = 1;
          }
        }

        setCurrentPage(initialPage);
      } catch (err: any) {
        console.error('Failed to load digital book:', err);
        if (isMounted) {
          setError(err.message || 'Unable to load digital book file. Please try again later.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initReader();

    return () => {
      isMounted = false;
    };
  }, [id, user?.id]);

  // 2. Render Page Canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || currentPage < 1 || currentPage > numPages) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Ignore cancellation error
      }
    }

    setRendering(true);

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      let currentScale = scale;
      if (fitToWidth && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 32; // padding
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        currentScale = containerWidth / unscaledViewport.width;
      }

      const viewport = page.getViewport({ scale: currentScale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', err);
      }
    } finally {
      setRendering(false);
    }
  }, [pdfDoc, currentPage, numPages, scale, fitToWidth]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // 3. Handle Auto-Save Reading Progress
  const saveProgress = useCallback(async (page: number, total: number) => {
    if (!user?.id || !book?.id || total === 0) return;
    setIsSaving(true);
    const pPercent = Math.min(100, Math.round((page / total) * 100));
    try {
      await historyService.updateProgress(user.id, Number(book.id), pPercent, page, total);
      reloadHistory();
    } catch (err) {
      console.error('Failed to auto-save reading progress:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, book?.id, reloadHistory]);

  // Debounced save when page changes
  useEffect(() => {
    if (currentPage > 0 && numPages > 0) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveProgress(currentPage, numPages);
      }, 1000);
    }

    if (currentPage === numPages && numPages > 0) {
      setShowCompletedModal(true);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [currentPage, numPages, saveProgress]);

  // Save on page exit / unmount
  useEffect(() => {
    return () => {
      if (currentPage > 0 && numPages > 0 && user?.id && book?.id) {
        const pPercent = Math.min(100, Math.round((currentPage / numPages) * 100));
        historyService.updateProgress(user.id, Number(book.id), pPercent, currentPage, numPages);
      }
    };
  }, [currentPage, numPages, user?.id, book?.id]);

  // 4. Controls Handlers
  const handleNextPage = () => {
    if (currentPage < numPages) setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleZoomIn = () => {
    setFitToWidth(false);
    setScale(prev => Math.min(3.0, prev + 0.2));
  };

  const handleZoomOut = () => {
    setFitToWidth(false);
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  const handleFitWidth = () => {
    setFitToWidth(true);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const handleMarkCompleted = async () => {
    if (!user?.id || !book?.id) return;
    setIsSaving(true);
    try {
      await historyService.saveProgress(user.id, Number(book.id), 100, numPages, numPages, true);
      reloadHistory();
      setShowCompletedModal(false);
    } catch (err) {
      console.error('Failed to mark completed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'ArrowLeft') handlePrevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (fitToWidth) renderPage();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitToWidth, renderPage]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-base font-semibold text-slate-300">Loading Digital Reader...</p>
        <p className="text-xs text-slate-500 mt-2">Preparing your reading experience</p>
      </div>
    );
  }

  // Error State
  if (error || !book) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">menu_book</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Digital Reader Unavailable</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">{error || 'Unable to open the requested digital book file.'}</p>
        <button
          onClick={() => navigate(book ? `/book/${book.id}` : '/search')}
          className="px-6 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg hover:opacity-90 transition-all cursor-pointer min-h-[44px]"
        >
          ← Back to Book Details
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-primary selection:text-white">
      {/* ── Top Header Navbar ── */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/book/${book.id}`)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px]"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span className="hidden sm:inline">Back to Details</span>
          </button>
          <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />
          <div className="truncate max-w-[160px] sm:max-w-md">
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate">{book.title}</h1>
            <p className="text-[11px] text-slate-400 truncate">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {isSaving && (
            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded animate-pulse hidden sm:inline">
              Saving...
            </span>
          )}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <span className="text-xs font-bold text-primary">{progressPercentage}%</span>
            <div className="w-16 sm:w-24 bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <span className="material-symbols-outlined text-lg">
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>
        </div>
      </header>

      {/* ── Main PDF Canvas Container ── */}
      <main className="flex-1 overflow-auto flex flex-col items-center justify-center p-4 sm:p-8 relative custom-scrollbar">
        {rendering && (
          <div className="absolute top-4 right-4 z-20 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Rendering page...
          </div>
        )}

        <div className="shadow-2xl rounded-lg overflow-hidden bg-white border border-slate-800 transition-transform duration-200">
          <canvas ref={canvasRef} className="block max-w-full" />
        </div>
      </main>

      {/* ── Bottom Controls Bar ── */}
      <footer className="sticky bottom-0 z-30 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 order-2 sm:order-1">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-lg">zoom_out</span>
          </button>
          <button
            onClick={handleFitWidth}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              fitToWidth ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Fit Width
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-lg">zoom_in</span>
          </button>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-3 order-1 sm:order-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 cursor-pointer min-h-[38px]"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-xl text-xs sm:text-sm font-medium border border-slate-700">
            <input
              type="number"
              min={1}
              max={numPages || 1}
              value={currentPage}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= numPages) setCurrentPage(val);
              }}
              className="w-10 bg-slate-900 text-center text-white rounded py-0.5 border border-slate-700 focus:outline-none focus:border-primary text-xs font-bold"
            />
            <span className="text-slate-400">/</span>
            <span className="text-slate-300 font-semibold">{numPages}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
            className="px-3 py-1.5 rounded-xl bg-primary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 cursor-pointer min-h-[38px]"
          >
            <span>Next</span>
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </footer>

      {/* ── Completion Modal ── */}
      {showCompletedModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 text-3xl">
              🎉
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">Book Completed!</h3>
            <p className="text-slate-400 text-sm">
              Congratulations! You reached page {numPages} of <span className="text-white font-semibold">{book.title}</span>.
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={handleMarkCompleted}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg hover:bg-emerald-500 transition-colors cursor-pointer min-h-[44px]"
              >
                Mark as Completed 🎉
              </button>
              <button
                onClick={() => setShowCompletedModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reader;
