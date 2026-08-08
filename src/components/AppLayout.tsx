import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import { MobileDrawerProvider } from '../context/MobileDrawerContext';

interface AppLayoutProps {
  children: React.ReactNode;
  containerClassName?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, containerClassName = '' }) => {
  return (
    <MobileDrawerProvider>
      <div className="bg-surface text-on-surface min-h-screen relative overflow-x-hidden">
        {/* Background atmosphere */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        </div>

        <div className="flex min-h-screen overflow-x-hidden w-full max-w-full">
          {/* Desktop Sidebar — ONLY rendered here, hidden on mobile */}
          <Sidebar className="hidden lg:flex" />

          {/* Main Content Area — starts at x = 0 on mobile */}
          <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden w-full max-w-full pb-16 lg:pb-0">
            <Navbar />
            <main className={`flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 max-w-[1440px] mx-auto w-full ${containerClassName}`}>
              {children}
            </main>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </MobileDrawerProvider>
  );
};

export default AppLayout;

