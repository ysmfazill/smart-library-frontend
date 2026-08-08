import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

// Lazy loaded pages
const Login             = React.lazy(() => import('../pages/Login'));
const Registration      = React.lazy(() => import('../pages/Registration'));
const Welcome           = React.lazy(() => import('../pages/Welcome'));
const Home              = React.lazy(() => import('../pages/Home'));
const SearchBooks       = React.lazy(() => import('../pages/SearchBooks'));
const Recommendations   = React.lazy(() => import('../pages/Recommendations'));
const BookDetails       = React.lazy(() => import('../pages/BookDetails'));
const Favorites         = React.lazy(() => import('../pages/Favorites'));
const ReadingHistory    = React.lazy(() => import('../pages/ReadingHistory'));
const Analytics         = React.lazy(() => import('../pages/Analytics'));
const Leaderboard       = React.lazy(() => import('../pages/Leaderboard'));
const Collections       = React.lazy(() => import('../pages/Collections'));
const Profile           = React.lazy(() => import('../pages/Profile'));
const Settings          = React.lazy(() => import('../pages/Settings'));
const Admin             = React.lazy(() => import('../pages/Admin'));

// ── Loading Fallback ────────────────────────────────────────────────────────
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-surface">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-on-surface-variant font-medium">Loading Readify…</p>
    </div>
  </div>
);

// ── Protected Route — requires authentication ───────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ── Admin Route — requires ROLE_ADMIN ──────────────────────────────────────
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
};

// ── Onboarding Route — redirects to /welcome if no interests set ────────────
const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { needsOnboarding, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (needsOnboarding) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
};

// ── Public Auth Route — redirects authenticated users away from login/register
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, needsOnboarding, isAdmin, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to={needsOnboarding ? '/welcome' : '/home'} replace />;
  }
  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public — Redirect Root */}
          <Route path="/"         element={<AuthRoute><Navigate to="/login" replace /></AuthRoute>} />

          {/* Auth Flow — redirect away if already logged in */}
          <Route path="/login"    element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Registration /></AuthRoute>} />

          {/* Onboarding — requires auth but not onboarding complete */}
          <Route path="/welcome"  element={<ProtectedRoute><Welcome /></ProtectedRoute>} />

          {/* Main App — requires auth + completed onboarding */}
          <Route
            path="/home"
            element={<ProtectedRoute><OnboardingRoute><Home /></OnboardingRoute></ProtectedRoute>}
          />
          <Route path="/search"           element={<ProtectedRoute><SearchBooks /></ProtectedRoute>} />
          <Route path="/recommendations"  element={<ProtectedRoute><OnboardingRoute><Recommendations /></OnboardingRoute></ProtectedRoute>} />
          <Route path="/book/:id"          element={<ProtectedRoute><ErrorBoundary fallbackMessage="Unable to display book details."><BookDetails /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/favorites"         element={<ProtectedRoute><OnboardingRoute><Favorites /></OnboardingRoute></ProtectedRoute>} />
          <Route path="/history"           element={<ProtectedRoute><OnboardingRoute><ReadingHistory /></OnboardingRoute></ProtectedRoute>} />
          <Route path="/collections"       element={<ProtectedRoute><OnboardingRoute><Collections /></OnboardingRoute></ProtectedRoute>} />
          <Route path="/analytics"         element={<ProtectedRoute><OnboardingRoute><Analytics /></OnboardingRoute></ProtectedRoute>} />
          <Route path="/leaderboard"       element={<ProtectedRoute><OnboardingRoute><Leaderboard /></OnboardingRoute></ProtectedRoute>} />
          <Route path="/profile"           element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings"          element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin"             element={<AdminProtectedRoute><Admin /></AdminProtectedRoute>} />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;
