import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useMobileDrawer } from '../context/MobileDrawerContext';

const BOTTOM_NAV_ITEMS = [
  { icon: 'dashboard', label: 'Home', to: '/home' },
  { icon: 'auto_awesome', label: 'Explore', to: '/recommendations' },
  { icon: 'search', label: 'Search', to: '/search' },
  { icon: 'favorite', label: 'Favorites', to: '/favorites' },
];

export const MobileBottomNav: React.FC = () => {
  const { openDrawer, isDrawerOpen } = useMobileDrawer();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-surface/95 backdrop-blur-xl border-t border-outline-variant/20 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      aria-label="Mobile Bottom Navigation"
    >
      {BOTTOM_NAV_ITEMS.map(({ icon, label, to }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 min-h-[44px] min-w-[56px] ${
              isActive
                ? 'text-primary font-bold scale-105'
                : 'text-on-surface-variant/70 hover:text-primary font-medium'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px] leading-none mb-0.5">{icon}</span>
          <span className="text-[10px] tracking-tight leading-none">{label}</span>
        </NavLink>
      ))}

      {/* Drawer Menu Button */}
      <button
        onClick={openDrawer}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 min-h-[44px] min-w-[56px] cursor-pointer ${
          isDrawerOpen || (location.pathname !== '/home' && location.pathname !== '/recommendations' && location.pathname !== '/search' && location.pathname !== '/favorites')
            ? 'text-primary font-bold'
            : 'text-on-surface-variant/70 hover:text-primary font-medium'
        }`}
        aria-label="Open full menu"
      >
        <span className="material-symbols-outlined text-[22px] leading-none mb-0.5">menu</span>
        <span className="text-[10px] tracking-tight leading-none">Menu</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
