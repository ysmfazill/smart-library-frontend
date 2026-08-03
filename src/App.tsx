import React, { useState } from 'react';
import AppRouter from './routes/AppRouter';
import GlobalToast from './components/GlobalToast';
import Splash from './pages/Splash';

import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ReadingHistoryProvider } from './context/ReadingHistoryContext';
import { UserProfileProvider } from './context/UserProfileContext';

const AppContent: React.FC = () => {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splash_shown');
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('splash_shown', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <Splash onComplete={handleSplashComplete} />;
  }

  return (
    <>
      <AppRouter />
      <GlobalToast />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <FavoritesProvider>
          <ReadingHistoryProvider>
            <AppContent />
          </ReadingHistoryProvider>
        </FavoritesProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}

export default App;
