import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { icon: 'dashboard',         label: 'Dashboard',          to: '/home' },
  { icon: 'star',              label: 'Recommended Books',  to: '/recommendations' },
  { icon: 'search',            label: 'Search Books',       to: '/search' },
  { icon: 'favorite',          label: 'Favorites',          to: '/favorites' },
  { icon: 'collections_bookmark', label: 'Collections',       to: '/collections' },
  { icon: 'history',           label: 'Reading History',    to: '/history' },
  { icon: 'monitoring',        label: 'Analytics',          to: '/analytics' },
  { icon: 'trophy',            label: 'Leaderboard',        to: '/leaderboard' },
];

const ACCOUNT_ITEMS = [
  { icon: 'person',               label: 'Profile',  to: '/profile' },
  { icon: 'settings',             label: 'Settings', to: '/settings' },
];

const ADMIN_ITEM = { icon: 'admin_panel_settings', label: 'Admin Panel', to: '/admin' };

const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();

  const accountItems = isAdmin ? [...ACCOUNT_ITEMS, ADMIN_ITEM] : ACCOUNT_ITEMS;

  return (
    <aside className="w-[280px] bg-surface/60 backdrop-blur-xl border-r border-white/20 flex flex-col py-8 gap-y-2 hidden md:flex shrink-0">
      {/* Brand */}
      <div className="px-8 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined">auto_stories</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary leading-none">Smart Library</h1>
            <p className="text-xs text-on-surface-variant opacity-70">Recommendation System</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto scroll-hide px-2">
        <div className="space-y-1">
          {NAV_ITEMS.map(({ icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-4 px-6 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'sidebar-active'
                    : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Account section */}
        <div className="mt-8 pt-8 border-t border-outline-variant/30 px-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-4">Account</p>
          <div className="space-y-1">
            {accountItems.map(({ icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* New Research CTA */}
      <div className="px-6 mt-auto">
        <NavLink
          to="/search"
          className="w-full py-4 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">search</span>
          <span>Find Books</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
