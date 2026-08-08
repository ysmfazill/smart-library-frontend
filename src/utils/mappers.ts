import type { Book, HistoryEntry, FavoriteItem, Interest, UserProfileData } from '../types';

// ── Fallback cover image ──────────────────────────────────────────────────────
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';

// ── Book DTO → Frontend Book ──────────────────────────────────────────────────
export function mapBookDTO(dto: any): Book {
  if (!dto || typeof dto !== 'object') {
    return {
      id: '',
      title: 'Untitled',
      author: 'Unknown Author',
      cover: DEFAULT_COVER,
      rating: 0,
      category: 'General',
      description: '',
      keywords: [],
    };
  }
  return {
    id: dto.id !== undefined && dto.id !== null ? String(dto.id) : '',
    title: dto.title || 'Untitled',
    author: dto.author || 'Unknown Author',
    cover: dto.coverImage || dto.cover || DEFAULT_COVER,
    rating: typeof dto.rating === 'number' && !isNaN(dto.rating) ? dto.rating : 0,
    category: dto.category?.name || dto.categoryName || (typeof dto.category === 'string' ? dto.category : 'General'),
    categoryId: dto.category?.id || dto.categoryId,
    description: dto.description || '',
    publicationYear: dto.publicationYear,
    language: dto.language || 'English',
    pages: dto.pages,

    keywords: dto.keywords
      ? (typeof dto.keywords === 'string' ? dto.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : Array.isArray(dto.keywords) ? dto.keywords : [])
      : [],
    isbn: dto.isbn,
    availableCopies: dto.availableCopies,
    totalCopies: dto.totalCopies,
    createdAt: dto.createdAt,
  };
}

// ── BookSummaryDTO → Frontend Book ────────────────────────────────────────────
export function mapBookSummaryDTO(dto: any): Book {
  if (!dto || typeof dto !== 'object') {
    return {
      id: '',
      title: 'Untitled',
      author: 'Unknown Author',
      cover: DEFAULT_COVER,
      rating: 0,
      category: 'General',
      description: '',
    };
  }
  return {
    id: dto.id !== undefined && dto.id !== null ? String(dto.id) : '',
    title: dto.title || 'Untitled',
    author: dto.author || 'Unknown Author',
    cover: dto.coverImage || dto.cover || DEFAULT_COVER,
    rating: typeof dto.rating === 'number' && !isNaN(dto.rating) ? dto.rating : 0,
    category: dto.categoryName || dto.category?.name || (typeof dto.category === 'string' ? dto.category : 'General'),
    categoryId: dto.categoryId || dto.category?.id,
    description: dto.description || '',
    publicationYear: dto.publicationYear,
    language: dto.language || 'English',
    pages: dto.pages,
    matchReason: dto.matchReason,
    recommendationScore: dto.recommendationScore,
    recommendationReason: dto.recommendationReason,
  };
}

// ── ReadingHistoryResponseDTO → HistoryEntry ──────────────────────────────────
export function mapHistoryDTO(dto: any): HistoryEntry {
  const book = mapBookSummaryDTO(dto.book || {});
  const progress = typeof dto.progressPercentage === 'number'
    ? Math.round(dto.progressPercentage)
    : 0;
  return {
    id: String(dto.id),
    bookId: String(dto.book?.id || dto.bookId || ''),
    book,
    progress,
    completed: dto.completed === true || progress >= 100,
    lastReadAt: dto.lastReadDate || dto.lastReadAt || new Date().toISOString(),
    startedAt: dto.startedAt,
  };
}

// ── FavoriteResponseDTO → FavoriteItem ────────────────────────────────────────
export function mapFavoriteDTO(dto: any): FavoriteItem {
  return {
    id: String(dto.id),
    book: mapBookSummaryDTO(dto.book || {}),
    addedAt: dto.addedAt || dto.createdAt || new Date().toISOString(),
  };
}

// ── UserProfileDTO → UserProfileData ──────────────────────────────────────────
export function mapUserProfileDTO(dto: any): UserProfileData {
  return {
    id: dto.id,
    fullName: dto.fullName || '',
    email: dto.email || '',
    role: dto.role || 'USER',
    avatar: dto.avatar,
    createdAt: dto.createdAt,
    totalFavorites: dto.totalFavorites || 0,
    totalReadingHistory: dto.totalReadingHistory || 0,
    totalReviews: dto.totalReviews || 0,
    interests: (dto.interests || []).map((i: any): Interest => ({
      id: i.id,
      name: i.interestName || i.name || '',
      icon: i.icon || 'book',
      desc: i.desc || i.description || '',
    })),
  };
}

// ── InterestResponseDTO → Interest ───────────────────────────────────────────
export function mapInterestDTO(dto: any): Interest {
  return {
    id: dto.id,
    name: dto.interestName || dto.name || '',
    icon: dto.icon || 'bookmark',
    desc: dto.desc || dto.description || '',
  };
}

// ── Compute reading streak from history entries ───────────────────────────────
export function computeStreak(entries: HistoryEntry[]): number {
  if (entries.length === 0) return 0;

  // Get unique reading days (YYYY-MM-DD)
  const readingDays = new Set<string>(
    entries.map(e => e.lastReadAt.split('T')[0])
  );

  const sortedDays = Array.from(readingDays).sort().reverse();
  if (sortedDays.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Streak must include today or yesterday to be active
  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < sortedDays.length - 1; i++) {
    const curr = new Date(sortedDays[i]);
    const prev = new Date(sortedDays[i + 1]);
    const diffMs = curr.getTime() - prev.getTime();
    if (diffMs === 86400000) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ── Compute estimated reading time from pages ─────────────────────────────────
export function estimateReadingTime(pages?: number): string {
  if (!pages) return '—';
  const minutes = Math.round(pages * 1.3);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// ── Format join date from ISO string ─────────────────────────────────────────
export function formatJoinDate(iso?: string): string {
  if (!iso) return 'Recently';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

// ── Get user's first name ─────────────────────────────────────────────────────
export function getFirstName(fullName?: string): string {
  if (!fullName) return 'Reader';
  return fullName.split(' ')[0];
}
