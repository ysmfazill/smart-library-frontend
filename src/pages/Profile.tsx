import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { useUserProfile } from '../context/UserProfileContext';
import { useAuth } from '../context/AuthContext';
import { useReadingHistory } from '../context/ReadingHistoryContext';
import { computeStreak } from '../utils/mappers';

// ── Editable field row ────────────────────────────────────────
interface FieldRowProps {
  label: string;
  value: string;
  name: string;
  type?: string;
  placeholder?: string;
  onSave: (name: string, value: string) => void;
  multiline?: boolean;
}
const FieldRow: React.FC<FieldRowProps> = React.memo(({ label, value, name, type = 'text', placeholder, onSave, multiline = false }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    onSave(name, draft);
    setEditing(false);
  };

  return (
    <div className="py-5 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="sm:w-40 shrink-0">
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold pt-1">{label}</p>
      </div>
      <div className="flex-1">
        {editing ? (
          <div className="flex flex-col gap-2">
            {multiline ? (
              <textarea
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-body-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 border-none"
                rows={3}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={placeholder}
                autoFocus
              />
            ) : (
              <input
                type={type}
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 border-none"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={placeholder}
                autoFocus
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg ai-gradient-bg text-white text-label-md font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                Save
              </button>
              <button
                onClick={() => { setDraft(value); setEditing(false); }}
                className="px-5 py-2 rounded-lg border border-outline-variant/50 text-on-surface-variant text-label-md font-semibold hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between group">
            <span className={`text-body-md ${value ? 'text-on-surface' : 'text-on-surface-variant/50 italic'}`}>
              {value || `Add your ${label.toLowerCase()}`}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="ml-4 shrink-0 opacity-0 group-hover:opacity-100 text-label-sm text-primary font-semibold hover:underline transition-opacity"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// ── Tier badge ────────────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  Scholar:    'bg-amber-100 text-amber-700 border border-amber-200',
  Researcher: 'bg-primary/10 text-primary border border-primary/20',
  Archivist:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Librarian:  'bg-secondary/10 text-secondary border border-secondary/20',
};

// ── Avatar Options ─────────────────────────────────────────────
const AVATAR_OPTIONS = [
  { id: 'avatar1.png', name: 'Scholar' },
  { id: 'avatar2.png', name: 'Explorer' },
  { id: 'avatar3.png', name: 'Reader' },
  { id: 'avatar4.png', name: 'Innovator' },
  { id: 'avatar5.png', name: 'Book Lover' },
];

// ── Main Page ─────────────────────────────────────────────────
const Profile: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { completedBooks, inProgressBooks, historyEntries } = useReadingHistory();
  const [saveNotice, setSaveNotice] = useState(false);

  // Computed streak from real history data
  const streak = React.useMemo(() => computeStreak(historyEntries), [historyEntries]);

  const handleSave = React.useCallback((name: string, value: string) => {
    let finalValue = value;
    if (name === 'role') {
      finalValue = value.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
    }
    updateProfile({ [name]: finalValue } as any);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2500);
  }, [updateProfile]);

  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (user?.id) {
        try {
          const [userStats, userAchievements] = await Promise.all([
            import('../services/analyticsService').then(m => m.analyticsService.getUserStatistics(user.id)),
            import('../services/analyticsService').then(m => m.analyticsService.getUserAchievements(user.id))
          ]);
          setStats(userStats);
          setAchievements(userAchievements);
        } catch (e) {
          console.error(e);
        }
      }
    };
    loadStats();
  }, [user?.id]);

  const statCards = React.useMemo(() => [
    { label: 'Books Completed',  value: completedBooks.length,    icon: 'check_circle',   color: 'text-emerald-600', bg: 'bg-emerald-50'    },
    { label: 'In Progress',      value: inProgressBooks.length,   icon: 'menu_book',      color: 'text-primary',     bg: 'bg-primary/10'    },
    { label: 'Global Rank',      value: stats?.globalRank ? `#${stats.globalRank}` : '—', icon: 'public', color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Reading Streak',   value: streak > 0 ? `${streak} days` : '—', icon: 'local_fire_department', color: 'text-orange-500', bg: 'bg-orange-50' },
  ], [completedBooks.length, inProgressBooks.length, stats?.globalRank, streak]);

  return (
    <AppLayout>

            {/* Save toast */}
            <div className={`fixed top-20 sm:top-24 right-4 sm:right-6 z-50 flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl ai-gradient-bg text-white shadow-lg text-xs sm:text-sm transition-all duration-300 ${saveNotice ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Profile updated!
            </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">

          {/* ── Left: Profile Card ── */}
          <div className="xl:col-span-1 flex flex-col gap-gutter">

            {/* Avatar + Identity */}
            <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center gap-4">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl bg-surface-container">
                  <img src={profile.avatar?.includes('/') ? profile.avatar : `/avatars/${profile.avatar || 'avatar1.png'}`} alt={profile.name} className="w-full h-full object-cover" onError={(e) => { if (!(e.target as HTMLImageElement).src.endsWith('/avatars/avatar1.png')) { (e.target as HTMLImageElement).src = '/avatars/avatar1.png'; } }} />
                </div>
                {/* Avatar change overlay (UI only) */}
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-on-surface">{profile.name}</h2>
                <p className="text-label-md text-on-surface-variant">{profile.username}</p>
                <p className="text-label-sm text-on-surface-variant/60 mt-1">Joined {profile.joinDate}</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-label-sm font-bold ${TIER_COLORS[profile.tier]}`}>
                ✦ {profile.tier}
              </span>
              {profile.bio && (
                <p className="text-body-md text-on-surface-variant text-sm leading-relaxed text-center max-w-xs">
                  {profile.bio}
                </p>
              )}
              <div className="w-full pt-4 border-t border-outline-variant/20 space-y-2">
                {profile.location && (
                  <div className="flex items-center gap-2 text-label-md text-on-surface-variant justify-center">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {profile.location}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-2 text-label-md text-primary justify-center">
                    <span className="material-symbols-outlined text-sm">link</span>
                    {profile.website}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold mb-5">Reading Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                {statCards.map(({ label, value, icon, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl p-4 flex flex-col gap-2`}>
                    <span className={`material-symbols-outlined ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-label-sm text-on-surface-variant leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests (UI only) */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Interests</h3>
                <a href="/welcome" className="text-label-sm text-primary font-semibold hover:underline">Edit</a>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests && profile.interests.length > 0 ? (
                  profile.interests.map(interest => (
                    <span key={interest.id} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-label-sm font-semibold">
                      {interest.name}
                    </span>
                  ))
                ) : (
                  <p className="text-label-sm text-on-surface-variant/60 italic">No interests selected yet. <a href="/welcome" className="text-primary underline">Select interests</a></p>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Achievements</h3>
                <span className="text-label-sm font-bold text-primary">{achievements.length} Unlocked</span>
              </div>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map(ach => (
                    <div key={ach.id} className="bg-surface-container-low rounded-xl p-3 flex flex-col items-center text-center gap-1 border border-outline-variant/20 hover:border-primary/50 transition-colors cursor-default group" title={ach.description}>
                      <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">{ach.icon}</span>
                      <span className="text-xs font-bold leading-tight line-clamp-1">{ach.name}</span>
                      <span className="text-[10px] text-on-surface-variant">{new Date(ach.unlockedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-label-sm text-on-surface-variant/60 italic text-center py-4">Read books to unlock achievements!</p>
              )}
            </div>
          </div>

          {/* ── Right: Edit Profile ── */}
          <div className="xl:col-span-2 flex flex-col gap-gutter">

            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl ai-gradient-bg flex items-center justify-center text-white">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>manage_accounts</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-body-lg font-bold">Edit Profile</h2>
                <p className="text-label-md text-on-surface-variant">Changes to name and email are saved to the server.</p>
                </div>
              </div>

              <FieldRow label="Full Name"  name="name"     value={profile.name}     onSave={handleSave} placeholder="Your full name" />
              <FieldRow label="Email"      name="email"    value={profile.email}    onSave={handleSave} placeholder="your@email.com" type="email" />
              <FieldRow label="Username"   name="username" value={profile.username} onSave={handleSave} placeholder="@yourhandle" />
              <FieldRow label="Bio"        name="bio"      value={profile.bio}      onSave={handleSave} placeholder="Tell us about yourself..." multiline />
              <FieldRow label="Location"   name="location" value={profile.location} onSave={handleSave} placeholder="City, Country" />
              <FieldRow label="Website"    name="website"  value={profile.website}  onSave={handleSave} placeholder="yourwebsite.com" />
              <FieldRow label="Role"       name="role"     value={profile.role || 'USER'} onSave={handleSave} placeholder="USER or ADMIN" />
            </div>

            {/* Avatar Gallery */}
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>imagesmode</span>
                Choose Your Avatar
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {AVATAR_OPTIONS.map((avatar) => {
                  const isSelected = profile.avatar === avatar.id || profile.avatar?.endsWith(avatar.id);
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => handleSave('avatar', avatar.id)}
                      className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${isSelected ? 'bg-primary/10 border-2 border-primary shadow-md scale-[1.02]' : 'bg-surface-container-low border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container hover:shadow-sm'}`}
                    >
                      <img src={`/avatars/${avatar.id}`} alt={avatar.name} className="w-16 h-16 rounded-full object-cover shadow-sm bg-white" onError={(e) => { if (!(e.target as HTMLImageElement).src.endsWith('/avatars/avatar1.png')) { (e.target as HTMLImageElement).src = '/avatars/avatar1.png'; } }} />
                      <span className={`text-label-sm font-semibold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{avatar.name}</span>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Danger zone (UI only) */}
            <div className="glass-card rounded-2xl p-8 border border-red-200/50">
              <h3 className="text-label-sm text-red-500 uppercase tracking-wider font-bold mb-6">Account Actions</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="flex-1 py-3 rounded-xl border border-outline-variant/40 text-on-surface-variant font-semibold text-label-md hover:bg-surface-container transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export Data
                </button>
                <button className="flex-1 py-3 rounded-xl border border-red-200 text-red-500 font-semibold text-label-md hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                  Delete Account
                </button>
              </div>
              <p className="text-label-sm text-on-surface-variant/50 mt-4">
                These actions are UI-only. No data will be permanently deleted.
              </p>
            </div>
          </div>
        </div>
    </AppLayout>
  );
};

export default Profile;
