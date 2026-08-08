import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SplashProps {
  onComplete: () => void;
}

const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const { loading } = useAuth();
  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    // If auth is still loading, wait
    if (loading) return;

    if (reducedMotion) {
      onComplete();
      return;
    }

    // Preload logo image
    const img = new Image();
    img.src = '/logo.png';

    // Choreographed 7-phase timeline
    // Phase 1: 0–500ms (Initial logo & book appearance)
    const t1 = setTimeout(() => setPhase(1), 50);

    // Phase 2: 500–1400ms (Book opening animation)
    const t2 = setTimeout(() => setPhase(2), 500);

    // Phase 3: 1400–2000ms (Brand reveal text appears)
    const t3 = setTimeout(() => setPhase(3), 1400);

    // Phase 4: 2000–2700ms (Hero scale-up — composition becomes large)
    const t4 = setTimeout(() => setPhase(4), 2000);

    // Phase 5: 2700–3200ms (Hold completed large hero)
    const t5 = setTimeout(() => setPhase(5), 2700);

    // Phase 6: 3200–3800ms (Cinematic fade & final zoom-through)
    const t6 = setTimeout(() => setPhase(6), 3200);

    // Phase 7: 3800ms+ (Clean navigation to next page)
    const t7 = setTimeout(() => onComplete(), 3850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
    };
  }, [loading, reducedMotion, onComplete]);

  return (
    <>
      <style>
        {`
          .splash-viewport {
            transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
            opacity: ${phase === 6 ? 0 : 1};
          }

          .hero-composition {
            transform-origin: center center;
            transition: opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
            opacity: ${phase >= 1 ? (phase === 6 ? 0 : 1) : 0};
            transform: scale(${
              phase >= 6 ? 1.7 :
              phase >= 4 ? 1.35 :
              phase >= 1 ? 1 : 0.75
            });
          }

          .book-wrapper {
            perspective: 800px;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .book-3d {
            position: relative;
            width: 76px;
            height: 104px;
            transform-style: preserve-3d;
            transform: rotateX(18deg) rotateY(0deg);
            transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          }

          .book-3d.open {
            transform: rotateX(18deg) rotateY(-15deg);
          }

          .book-cover, .book-page, .book-back {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            transform-origin: left center;
            border-radius: 2px 6px 6px 2px;
          }

          .book-back {
            background: #5300b7;
            border: 2px solid #3b0082;
            z-index: 1;
          }

          .book-cover {
            background: linear-gradient(135deg, #6d28d9 0%, #2170e4 100%);
            border: 2px solid #3b0082;
            z-index: 10;
            transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
            box-shadow: inset 4px 0 10px rgba(0,0,0,0.15);
          }

          .book-3d.open .book-cover {
            transform: rotateY(-140deg);
          }

          .book-page {
            background: #ffffff;
            border: 1px solid #e0e3e5;
            z-index: 5;
            box-shadow: inset 2px 0 5px rgba(0,0,0,0.05);
          }

          @keyframes flipPage {
            0%   { transform: rotateY(0deg); }
            100% { transform: rotateY(-135deg); }
          }

          .book-3d.open .page1 { animation: flipPage 0.75s 0.35s forwards cubic-bezier(0.22, 1, 0.36, 1); }
          .book-3d.open .page2 { animation: flipPage 0.75s 0.50s forwards cubic-bezier(0.22, 1, 0.36, 1); }
          .book-3d.open .page3 { animation: flipPage 0.75s 0.65s forwards cubic-bezier(0.22, 1, 0.36, 1); }

          @media (prefers-reduced-motion: reduce) {
            .splash-viewport,
            .hero-composition,
            .book-3d,
            .book-cover {
              transition: none !important;
              animation: none !important;
              transform: none !important;
              opacity: 1 !important;
            }
          }
        `}
      </style>

      <div className="splash-viewport flex items-center justify-center min-h-screen w-full p-6 overflow-hidden bg-surface relative select-none">
        {/* Ambient background glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-[15%] -right-[15%] w-[50%] h-[50%] bg-primary/10 blur-[130px] rounded-full transition-opacity duration-700"
            style={{ opacity: phase >= 1 && phase < 6 ? 1 : 0 }}
          />
          <div
            className="absolute -bottom-[15%] -left-[15%] w-[50%] h-[50%] bg-secondary/10 blur-[130px] rounded-full transition-opacity duration-700"
            style={{ opacity: phase >= 1 && phase < 6 ? 1 : 0 }}
          />
        </div>

        {/* ── Single Vertical Center Axis Container ── */}
        <main className="hero-composition relative z-10 w-full max-w-lg flex flex-col items-center justify-center text-center">
          
          {/* 1. Logo */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 flex items-center justify-center shrink-0">
            <img
              alt="Readify App Logo"
              className="w-full h-full object-contain drop-shadow-xl"
              src="/logo.png"
            />
          </div>

          {/* 2. 3D Opening Book */}
          <div className="book-wrapper my-2">
            <div className={`book-3d ${phase >= 2 ? 'open' : ''}`}>
              <div className="book-back"></div>
              <div className="book-page page3"></div>
              <div className="book-page page2"></div>
              <div className="book-page page1"></div>
              <div className="book-cover flex items-center justify-center">
                <span className="material-symbols-outlined text-white/70 text-2xl sm:text-3xl">auto_stories</span>
              </div>
            </div>
          </div>

          {/* 3. Readify Brand Reveal (Phase 3+) */}
          <div
            className="flex flex-col items-center justify-center text-center mt-3"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              transform: `translateY(${phase >= 3 ? '0px' : '10px'})`,
              transition: 'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div className="flex items-center gap-1.5 justify-center">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-primary font-display">
                Readify
              </h1>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                APP
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold tracking-widest text-on-surface-variant uppercase mt-1">
              Smart Recommendation System
            </p>
          </div>

        </main>
      </div>
    </>
  );
};

export default Splash;
