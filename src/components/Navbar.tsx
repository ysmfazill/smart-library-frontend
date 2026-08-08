import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../context/UserProfileContext';
import { useMobileDrawer } from '../context/MobileDrawerContext';
import { getFirstName } from '../utils/mappers';
import { notificationService, type NotificationDTO } from '../services/notificationService';

// Generate initials avatar placeholder
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('');
}

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { profile } = useUserProfile();
  const { isDrawerOpen, openDrawer, closeDrawer } = useMobileDrawer();
  const navigate = useNavigate();

  const displayName = user?.fullName || profile.name || 'Reader';
  const firstName = getFirstName(displayName);
  const roleLabel = (user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN') ? 'Administrator' : 'Member';
  const rawAvatar = profile.avatar || user?.avatar;
  const avatarUrl = rawAvatar ? (rawAvatar.includes('/') ? rawAvatar : `/avatars/${rawAvatar}`) : null;
  const initials = getInitials(displayName);

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifRef]);

  // Lock scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications(0, 10);
      setNotifications(data.content || data);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'REMINDER': return 'schedule';
      case 'RECOMMENDATION': return 'auto_awesome';
      case 'ACHIEVEMENT': return 'emoji_events';
      case 'SYSTEM': return 'info';
      default: return 'notifications';
    }
  };

  return (
    <>
      <header className="h-16 sm:h-20 flex items-center justify-between px-3 sm:px-6 lg:px-10 bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 z-30 sticky top-0 shrink-0 w-full max-w-full overflow-hidden">
        {/* Left: Mobile Hamburger + Brand Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openDrawer}
            className="lg:hidden p-2 text-on-surface-variant hover:bg-primary/10 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Open mobile navigation drawer"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>

          {/* Brand Logo & Name */}
          <div
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 cursor-pointer shrink-0"
          >
            <img src="/logo.png" alt="Readify Logo" className="h-8 sm:h-10 w-auto object-contain" />
            <span className="font-bold text-base sm:text-lg text-primary tracking-tight">Readify</span>
          </div>
        </div>

        {/* Center: Search Bar (Desktop / Tablet only) */}
        <button
          onClick={() => navigate('/search')}
          className="relative hidden md:flex flex-1 items-center max-w-md mx-4 min-h-[44px] group min-w-0"
        >
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50 group-hover:text-primary transition-colors text-[20px]">
            search
          </span>
          <div className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs sm:text-sm text-on-surface-variant/70 hover:bg-surface-container text-left cursor-pointer transition-all truncate">
            Search across your digital library…
          </div>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
          {/* Mobile Search Button */}
          <button
            onClick={() => navigate('/search')}
            className="md:hidden p-2 text-on-surface-variant hover:bg-primary/10 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Search"
          >
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
              className="p-2 text-on-surface-variant hover:bg-primary/10 rounded-full transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-surface border border-outline-variant/30 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
                  <h3 className="font-bold text-on-surface text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="text-primary text-xs font-semibold hover:underline">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_paused</span>
                      <p className="text-xs sm:text-sm">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                          className={`p-3.5 border-b border-outline-variant/10 flex gap-3 hover:bg-surface-container-low transition-colors cursor-pointer ${n.isRead ? 'opacity-60' : 'bg-primary/5'}`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.isRead ? 'bg-surface-container-highest' : 'bg-primary/20 text-primary'}`}>
                            <span className="material-symbols-outlined text-[18px]">{getNotifIcon(n.type)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-on-surface leading-tight">{n.message}</p>
                            <p className="text-[10px] text-on-surface-variant mt-1">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-outline-variant/30 text-center bg-surface-container-lowest">
                  <button className="text-primary text-xs font-semibold hover:underline">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-outline-variant/30 hidden sm:block" />

          {/* User info */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs sm:text-sm font-semibold text-on-surface line-clamp-1">{firstName}</p>
              <p className="text-[10px] text-on-surface-variant opacity-70">{roleLabel}</p>
            </div>

            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-highest border-2 border-primary/20 p-0.5 overflow-hidden hover:border-primary/60 transition-colors shrink-0 min-h-[36px] min-w-[36px] cursor-pointer"
              aria-label="Go to profile"
              title={displayName}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-full accent-gradient flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              aria-label="Logout"
              title="Sign out"
              className="p-2 text-on-surface-variant hover:bg-error/10 hover:text-error rounded-full transition-colors flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer hidden sm:flex"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Mobile Drawer for Tablet / Mobile */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="fixed top-0 left-0 h-screen w-[280px] max-w-[85vw] bg-surface shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out translate-x-0">
            <Sidebar onClose={closeDrawer} isDrawer className="w-full h-full border-r-0" />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

