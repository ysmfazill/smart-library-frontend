import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Redirects authenticated users who have not completed interest selection
 * to the /welcome onboarding page.
 *
 * Call this at the top of the Home page (and any page that requires onboarding).
 */
export function useOnboardingGuard(): void {
  const { user, isAuthenticated, needsOnboarding, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated && user && needsOnboarding) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, user, needsOnboarding, loading, navigate]);
}
