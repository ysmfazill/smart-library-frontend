import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../context/UserProfileContext';
import { getFirstName } from '../utils/mappers';

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

interface SidebarProps {
  onClose?: () => void;
  className?: string;
  isDrawer?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, className = '', isDrawer = false }) => {
  const { user, isAdmin, logout } = useAuth();
  const { profile } = useUserProfile();

  const accountItems = isAdmin ? [...ACCOUNT_ITEMS, ADMIN_ITEM] : ACCOUNT_ITEMS;

  const displayName = user?.fullName || profile.name || 'Reader';
  const firstName = getFirstName(displayName);
  const roleLabel = (user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN') ? 'Administrator' : 'Member';
  const rawAvatar = profile.avatar || user?.avatar;
  const avatarUrl = rawAvatar ? (rawAvatar.includes('/') ? rawAvatar : `/avatars/${rawAvatar}`) : null;

  const baseClasses = isDrawer
    ? 'flex flex-col w-full h-full py-5 gap-y-2 bg-surface text-on-surface'
    : 'hidden lg:flex lg:flex-col w-[280px] bg-surface/80 backdrop-blur-xl border-r border-outline-variant/20 py-6 gap-y-2 shrink-0';

  return (
    <aside className={`${baseClasses} ${className}`}>
      {/* Brand & Close */}
      <div className="px-5 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Readify Logo" className="h-9 w-auto object-contain shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-primary leading-none">Readify</h1>
            <p className="text-[11px] text-on-surface-variant opacity-70">Smart Recommendation System</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-on-surface-variant hover:bg-primary/10 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close navigation menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* User Info Header (Mobile Drawer Only) */}
      {isDrawer && (
        <div className="mx-4 mb-4 p-3 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest border-2 border-primary/30 overflow-hidden shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full accent-gradient flex items-center justify-center text-white text-xs font-bold">
                {firstName[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{displayName}</p>
            <p className="text-[11px] text-primary font-medium">{roleLabel}</p>
          </div>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3">
        <div className="space-y-1">
          {NAV_ITEMS.map(({ icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] ${
                  isActive
                    ? 'sidebar-active font-semibold'
                    : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Account section */}
        <div className="mt-6 pt-5 border-t border-outline-variant/30 px-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline mb-2 px-1">Account</p>
          <div className="space-y-1">
            {accountItems.map(({ icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                    isActive ? 'text-primary font-semibold bg-primary/5' : 'text-on-surface-variant hover:bg-primary/5 hover:text-primary'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}

            {isDrawer && (
              <button
                onClick={() => {
                  onClose?.();
                  logout();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors min-h-[44px] text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Find Books CTA */}
      <div className="px-4 mt-auto pt-3 pb-2">
        <NavLink
          to="/search"
          onClick={onClose}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
        >
          <span className="material-symbols-outlined">search</span>
          <span>Find Books</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;

