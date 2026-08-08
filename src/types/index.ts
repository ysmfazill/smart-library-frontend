// ── Core Domain Types ─────────────────────────────────────────────────────────

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'ROLE_USER' | 'ROLE_ADMIN';
  avatar?: string;
  createdAt?: string;
}

export interface Interest {
  id: number;
  name: string;
  icon: string;
  desc: string;
}

// ── Book (frontend canonical type) ────────────────────────────────────────────

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  category: string;
  categoryId?: number;
  matchReason?: string;
  recommendationScore?: number;
  recommendationReason?: string;
  progress?: number;
  description?: string;
  publicationYear?: number;
  language?: string;
  pages?: number;

  bookFileUrl?: string;
  bookFileType?: string;
  bookFileName?: string;

  keywords?: string[];
  similarBooks?: string[];
  isbn?: string;
  availableCopies?: number;
  totalCopies?: number;
  createdAt?: string;
}

// ── Reading History ────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  bookId: string;
  book: Book;
  progress: number;        // 0–100
  currentPage?: number;
  totalPages?: number;
  status?: 'NOT_STARTED' | 'READING' | 'COMPLETED' | string;
  completed: boolean;
  lastReadAt: string;      // ISO string
  startedAt?: string;
  completedAt?: string;
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export interface FavoriteItem {
  id: string;
  book: Book;
  addedAt: string;         // ISO string
}

// ── User Profile (full, with stats) ───────────────────────────────────────────

export interface UserProfileData {
  id: number;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt?: string;
  totalFavorites: number;
  totalReadingHistory: number;
  totalReviews: number;
  interests: Interest[];
}

// ── Category ─────────────────────────────────────────────────────────────────

export interface CategoryDTO {
  id: number;
  name: string;
  description?: string;
}

// ── API Response wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // current page
  size: number;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  selectedInterests: Interest[];
}
