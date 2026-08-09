import React, { useState } from 'react';
import type { Book } from '../types';

interface BookCoverProps {
  book: Book | { title?: string; author?: string; cover?: string; category?: string };
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'auto';
  showBadge?: boolean;
}

/**
 * Generates an inline SVG Data URI custom professional book cover as fallback
 */
function generateSvgCover(title: string = 'Untitled', author: string = 'Unknown Author', category: string = 'General'): string {
  const cleanTitle = title.replace(/[&<>"']/g, '');
  const cleanAuthor = author.replace(/[&<>"']/g, '');
  const cleanCategory = (category || 'General').toUpperCase().replace(/[&<>"']/g, '');

  const catLower = category.toLowerCase();
  const titleLower = title.toLowerCase();

  let bgStart = '#0f172a';
  let bgEnd = '#1e1b4b';
  let accent = '#6366f1';

  if (catLower.includes('artificial') || catLower.includes('ai') || titleLower.includes('neural')) {
    bgStart = '#0f172a'; bgEnd = '#1e1b4b'; accent = '#818cf8';
  } else if (catLower.includes('machine learning') || titleLower.includes('learning')) {
    bgStart = '#022c22'; bgEnd = '#064e3b'; accent = '#34d399';
  } else if (catLower.includes('computer science') || catLower.includes('c++') || catLower.includes('python') || catLower.includes('code') || catLower.includes('web')) {
    bgStart = '#0f172a'; bgEnd = '#1e293b'; accent = '#38bdf8';
  } else if (catLower.includes('cyber') || catLower.includes('security')) {
    bgStart = '#18181b'; bgEnd = '#27272a'; accent = '#c084fc';
  } else if (catLower.includes('business') || catLower.includes('startup') || catLower.includes('finance')) {
    bgStart = '#1e293b'; bgEnd = '#334155'; accent = '#fbbf24';
  } else if (catLower.includes('science') || catLower.includes('physics')) {
    bgStart = '#1a103c'; bgEnd = '#2e1065'; accent = '#f472b6';
  } else if (catLower.includes('philosophy') || catLower.includes('psychology') || catLower.includes('self help')) {
    bgStart = '#292524'; bgEnd = '#44403c'; accent = '#fb923c';
  }

  // Format title lines
  const words = cleanTitle.split(' ');
  let lines: string[] = [];
  let currentLine = '';
  words.forEach(w => {
    if ((currentLine + ' ' + w).trim().length > 18) {
      lines.push(currentLine.trim());
      currentLine = w;
    } else {
      currentLine += (currentLine ? ' ' : '') + w;
    }
  });
  if (currentLine) lines.push(currentLine.trim());
  if (lines.length > 4) lines = lines.slice(0, 4);

  const titleSvgText = lines.map((line, idx) => 
    `<tspan x="30" dy="${idx === 0 ? 0 : 34}">${line}</tspan>`
  ).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0.2"/>
      </linearGradient>
    </defs>
    <rect width="300" height="450" rx="12" fill="url(#bg)"/>
    <rect x="15" y="15" width="270" height="420" rx="8" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
    <rect x="30" y="45" width="60" height="4" fill="url(#accent)" rx="2"/>
    <text x="30" y="70" fill="${accent}" font-family="system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="1.5">${cleanCategory}</text>
    <text x="30" y="125" fill="#ffffff" font-family="Georgia, serif" font-size="22" font-weight="bold">
      ${titleSvgText}
    </text>
    <text x="30" y="380" fill="rgba(255,255,255,0.8)" font-family="system-ui, sans-serif" font-size="13" font-weight="500">By ${cleanAuthor}</text>
    <rect x="0" y="0" width="12" height="450" fill="rgba(0,0,0,0.25)"/>
    <rect x="12" y="0" width="1.5" height="450" fill="rgba(255,255,255,0.15)"/>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const BookCover: React.FC<BookCoverProps> = ({
  book,
  className = '',
  size = 'auto',
  showBadge = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(true);

  const title = book.title || 'Untitled';
  const author = book.author || 'Unknown Author';
  const category = (book as any).categoryName || (book as any).category?.name || (typeof book.category === 'string' ? book.category : 'General');
  const initialSrc = book.cover;

  const fallbackSvgSrc = generateSvgCover(title, author, category);
  const displaySrc = imgError || !initialSrc ? fallbackSvgSrc : initialSrc;

  return (
    <div className={`relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-container-high shadow-md group/cover ${className}`}>
      {loading && !imgError && (
        <div className="absolute inset-0 bg-surface-container-highest animate-pulse flex items-center justify-center">
          <span className="material-symbols-outlined text-outline-variant text-2xl animate-spin">sync</span>
        </div>
      )}
      <img
        src={displaySrc}
        alt={title}
        className={`w-full h-full object-cover transition-all duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={() => {
          setImgError(true);
          setLoading(false);
        }}
      />
      {showBadge && (book as any).coverSource === 'GENERATED' && (
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/90 text-white shadow backdrop-blur-sm">
          Edition Cover
        </span>
      )}
    </div>
  );
};

export default BookCover;
