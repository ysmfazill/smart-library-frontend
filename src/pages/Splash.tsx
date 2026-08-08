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

    // Preload important images
    const img = new Image();
    img.src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAteYLaI6fKJ6E6TySQQR6CCI88yln9fkVUmPONkwyKUw5TrmNNJDWbXfZnBhYSOQE-rRJvLLID5JSGf_H0zq6Y29yuIUhdS1X6WsbF63lgvujruooc0BhuatnubmfAWiTBAJDZWwLc4ZocnRYCJ00IJ_nC7U9VgWyaCU0tg9kO3DrseQW8uvJIEc9vxl7_xjVutFCFhqY3jCG0cG8DCOzvlrGYLuMsFw4hpLtnlRW6ZQC1KB7_rgY';

    // Animation timeline
    const t1 = setTimeout(() => setPhase(1), 100);   // Logo fades in
    const t2 = setTimeout(() => setPhase(2), 600);   // Book appears & opens
    const t3 = setTimeout(() => setPhase(3), 1600);  // Text displays
    const t4 = setTimeout(() => setPhase(4), 2600);  // Fade out
    const t5 = setTimeout(() => onComplete(), 3000); // Redirect

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [loading, reducedMotion, onComplete]);

  return (
    <>
      <style>
        {`
          .splash-container {
            transition: opacity 0.4s ease-out;
            opacity: ${phase === 4 ? 0 : 1};
          }
          .logo-fade {
            opacity: ${phase >= 1 ? 1 : 0};
            transform: scale(${phase >= 1 ? 1 : 0.9});
            transition: opacity 0.5s ease-out, transform 0.5s ease-out;
          }
          .text-fade {
            opacity: ${phase >= 3 ? 1 : 0};
            transform: translateY(${phase >= 3 ? 0 : '10px'});
            transition: opacity 0.5s ease-out, transform 0.5s ease-out;
          }
          
          .book-wrapper {
            perspective: 800px;
            opacity: ${phase >= 2 ? 1 : 0};
            transform: scale(${phase >= 2 ? 1 : 0.8});
            transition: opacity 0.4s ease-out, transform 0.4s ease-out;
            display: flex;
            justify-content: center;
            margin: 2rem 0;
          }
          .book-3d {
            position: relative;
            width: 80px;
            height: 110px;
            transform-style: preserve-3d;
            transform: rotateX(20deg) rotateY(0deg);
            transition: transform 0.6s ease-in-out;
          }
          .book-3d.open {
            transform: rotateX(20deg) rotateY(-15deg);
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
            transition: transform 0.6s ease-in-out;
            box-shadow: inset 4px 0 10px rgba(0,0,0,0.1);
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
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(-135deg); }
          }
          
          .book-3d.open .page1 { animation: flipPage 0.7s 0.5s forwards cubic-bezier(0.645, 0.045, 0.355, 1); }
          .book-3d.open .page2 { animation: flipPage 0.7s 0.65s forwards cubic-bezier(0.645, 0.045, 0.355, 1); }
          .book-3d.open .page3 { animation: flipPage 0.7s 0.8s forwards cubic-bezier(0.645, 0.045, 0.355, 1); }
        `}
      </style>

      <div className="splash-container flex items-center justify-center min-h-screen p-6 overflow-hidden bg-surface relative">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full" />
        </div>

        <main className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center">
          
          {/* Logo */}
          <div className="logo-fade w-32 h-32 mb-2 flex items-center justify-center">
            <img
              alt="Readify App Logo"
              className="w-full h-full object-contain drop-shadow-xl"
              src="/logo.png"
            />
          </div>

          {/* Book Animation */}
          <div className="book-wrapper">
            <div className={`book-3d ${phase >= 2 ? 'open' : ''}`}>
              <div className="book-back"></div>
              <div className="book-page page3"></div>
              <div className="book-page page2"></div>
              <div className="book-page page1"></div>
              <div className="book-cover flex items-center justify-center">
                <span className="material-symbols-outlined text-white/50 text-3xl">auto_stories</span>
              </div>
            </div>
          </div>

          {/* Title Text */}
          <div className="text-fade space-y-2 mt-2">
            <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-primary">
              Readify App
            </h1>
            <p className="text-on-surface-variant font-medium tracking-wide uppercase text-xs sm:text-sm">
              Smart Recommendation System
            </p>
          </div>

        </main>
      </div>
    </>
  );
};

export default Splash;
