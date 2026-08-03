import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProfile } from '../context/UserProfileContext';
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
    <header className="h-20 flex items-center justify-between px-10 bg-surface/80 backdrop-blur-md border-b border-white/20 z-20 sticky top-0 shrink-0">
      {/* Search shortcut */}
      <div className="flex items-center gap-4 w-full max-w-xl">
        <button
          onClick={() => navigate('/search')}
          className="relative w-full flex items-center"
        >
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-50">
            search
          </span>
          <div className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl text-base outline-none text-on-surface-variant/50 hover:bg-surface-container text-left cursor-pointer transition-all">
            Search across your digital library…
          </div>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="p-2 text-on-surface-variant hover:bg-primary/5 rounded-full transition-colors relative"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-outline-variant/30 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
                <h3 className="font-bold text-on-surface">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className="text-primary text-label-sm font-semibold hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_paused</span>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                        className={`p-4 border-b border-outline-variant/10 flex gap-3 hover:bg-surface-container-low transition-colors cursor-pointer ${n.isRead ? 'opacity-60' : 'bg-primary/5'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.isRead ? 'bg-surface-container-highest' : 'bg-primary/20 text-primary'}`}>
                          <span className="material-symbols-outlined text-[20px]">{getNotifIcon(n.type)}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-on-surface">{n.message}</p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-outline-variant/30 text-center bg-surface-container-lowest">
                <button className="text-primary text-label-sm font-semibold hover:underline">
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-outline-variant/30" />

        {/* User info */}
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-on-surface">{firstName}</p>
            <p className="text-[11px] text-on-surface-variant opacity-70">{roleLabel}</p>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-surface-container-highest border-2 border-primary/20 p-0.5 overflow-hidden hover:border-primary/60 transition-colors"
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
            className="p-2 text-on-surface-variant hover:bg-error/10 hover:text-error rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
