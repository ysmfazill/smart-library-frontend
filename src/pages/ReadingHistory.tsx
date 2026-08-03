import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useReadingHistory } from '../context/ReadingHistoryContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { computeStreak } from '../utils/mappers';
import type { HistoryEntry } from '../types';

type Tab = 'in_progress' | 'completed' | 'analytics';

// ── Time ago helper ────────────────────────────────────────────
const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  if (hours < 168) return `${Math.floor(hours / 24)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── Progress Card ──────────────────────────────────────────────
const ProgressCard: React.FC<{ entry: HistoryEntry }> = ({ entry }) => {
  const navigate = useNavigate();
  const { updateProgress, markCompleted } = useReadingHistory();
  const { book, progress, bookId, lastReadAt } = entry;

  const coverFallback = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';

  return (
    <div
      className="glass-card rounded-2xl p-5 flex gap-5 items-start book-card-hover transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/book/${bookId}`)}
    >
      <div className="relative shrink-0">
        <img
          src={book.cover || coverFallback}
          alt={book.title}
          className="w-20 h-28 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow"
          onError={(e) => { (e.target as HTMLImageElement).src = coverFallback; }}
        />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 accent-gradient rounded-full flex items-center justify-center text-white shadow-md">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1", fontSize: '16px' }}>
            play_arrow
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-headline-md text-body-lg font-bold mb-0.5 line-clamp-1">{book.title}</h3>
        <p className="text-label-md text-on-surface-variant mb-3">{book.author}</p>
        <div className="mb-2">
          <div className="flex justify-between text-label-sm mb-1">
            <span className="text-on-surface-variant">Progress</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-2">
            <div
              className="h-2 rounded-full accent-gradient transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <input
          type="range"
          min={0} max={100}
          value={progress}
          onClick={e => e.stopPropagation()}
          onChange={e => { e.stopPropagation(); updateProgress(bookId, parseInt(e.target.value)); }}
          className="w-full accent-slider cursor-pointer mb-2"
        />
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-on-surface-variant/60">Last read: {timeAgo(lastReadAt)}</span>
          <button
            onClick={e => { e.stopPropagation(); markCompleted(bookId); }}
            className="text-label-sm text-primary font-semibold hover:underline"
          >
            Mark Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Completed Card ─────────────────────────────────────────────
const CompletedCard: React.FC<{ entry: HistoryEntry }> = ({ entry }) => {
  const navigate = useNavigate();
  const { book, bookId, lastReadAt } = entry;
  const coverFallback = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';

  return (
    <div
      className="glass-card rounded-2xl p-5 flex gap-5 items-start book-card-hover transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/book/${bookId}`)}
    >
      <div className="relative shrink-0">
        <img
          src={book.cover || coverFallback}
          alt={book.title}
          className="w-20 h-28 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow"
          onError={(e) => { (e.target as HTMLImageElement).src = coverFallback; }}
        />
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1", fontSize: '16px' }}>
            check
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-headline-md text-body-lg font-bold mb-0.5 line-clamp-1">{book.title}</h3>
        <p className="text-label-md text-on-surface-variant mb-3">{book.author}</p>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[11px] font-bold">Completed</span>
          <span className="text-label-sm text-on-surface-variant">{book.category}</span>
        </div>
        <p className="text-label-sm text-on-surface-variant/60">Finished: {timeAgo(lastReadAt)}</p>
      </div>
    </div>
  );
};

// ── Simple bar chart using divs ────────────────────────────────
const BarChart: React.FC<{ data: { label: string; value: number; color?: string }[]; maxValue: number }> = ({ data, maxValue }) => (
  <div className="flex items-end gap-2 h-32">
    {data.map((item, i) => (
      <div key={i} className="flex-1 flex flex-col items-center gap-1">
        <div
          className="w-full rounded-t-md transition-all duration-700"
          style={{
            height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
            minHeight: item.value > 0 ? '4px' : '0',
            background: item.color || 'var(--color-primary)',
          }}
        />
        <span className="text-[10px] text-on-surface-variant">{item.label}</span>
      </div>
    ))}
  </div>
);

// ── Main Component ─────────────────────────────────────────────
const ReadingHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('in_progress');
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const { historyEntries, inProgressBooks, completedBooks, loading } = useReadingHistory();
  const { count: favCount } = useFavorites();

  // ── Stats ────────────────────────────────────────────────────
  const streak = computeStreak(historyEntries);
  const totalBooks = historyEntries.length;
  const completedCount = completedBooks.length;
  const avgProgress = inProgressBooks.length > 0
    ? Math.round(inProgressBooks.reduce((s, e) => s + e.progress, 0) / inProgressBooks.length)
    : 0;

  // ── Filter by search ─────────────────────────────────────────
  const filteredProgress = inProgressBooks.filter(e =>
    !search || e.book.title.toLowerCase().includes(search.toLowerCase()) || e.book.author.toLowerCase().includes(search.toLowerCase())
  );
  const filteredCompleted = completedBooks.filter(e =>
    !search || e.book.title.toLowerCase().includes(search.toLowerCase()) || e.book.author.toLowerCase().includes(search.toLowerCase())
  );

  // ── Analytics: compute from real history ─────────────────────
  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts: Record<string, number> = {};
    days.forEach(d => { counts[d] = 0; });
    historyEntries.forEach(e => {
      const day = days[new Date(e.lastReadAt).getDay()];
      counts[day]++;
    });
    return days.map(d => ({ label: d, value: counts[d] }));
  }, [historyEntries]);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    completedBooks.forEach(e => {
      const key = new Date(e.lastReadAt).toLocaleDateString('en-US', { month: 'short' });
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).slice(-6).map(([month, books]) => ({ label: month, value: books }));
  }, [completedBooks]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    historyEntries.forEach(e => {
      const cat = e.book.category || 'Other';
      cats[cat] = (cats[cat] || 0) + 1;
    });
    const total = Object.values(cats).reduce((s, v) => s + v, 0) || 1;
    const COLORS = ['#5300b7', '#2170e4', '#0b34a4', '#6d28d9', '#ccc3d7'];
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], i) => ({
        label,
        value: Math.round((value / total) * 100),
        color: COLORS[i],
      }));
  }, [historyEntries]);

  const weekMax = Math.max(...weeklyData.map(d => d.value), 1);
  const monthMax = Math.max(...monthlyData.map(d => d.value), 1);

  const tabs: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: 'in_progress', label: 'In Progress',  icon: 'play_circle',  count: inProgressBooks.length },
    { id: 'completed',   label: 'Completed',    icon: 'check_circle', count: completedBooks.length },
    { id: 'analytics',   label: 'Analytics',    icon: 'analytics' },
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen relative overflow-x-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      </div>
      <Navbar />
      <Sidebar />
      <main className="md:ml-sidebar-width pt-28 px-container-padding pb-section-gap max-w-[1440px] mx-auto min-h-screen">

        {/* ── Header ── */}
        <section className="mb-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container shrink-0">
            <img src={user?.avatar?.includes('/') ? user.avatar : `/avatars/${user?.avatar || 'avatar1.png'}`} alt="Avatar" className="w-full h-full object-cover" onError={(e) => { if (!(e.target as HTMLImageElement).src.endsWith('/avatars/avatar1.png')) { (e.target as HTMLImageElement).src = '/avatars/avatar1.png'; } }} />
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg mb-1 flex items-center gap-3 text-[28px] font-bold text-primary">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
              Reading History
            </h1>
            <p className="text-on-surface-variant">Your complete reading journey and progress tracker.</p>
          </div>
        </section>

        {/* ── KPIs ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Books',      value: totalBooks.toString(),              icon: 'auto_stories' },
            { label: 'Completed',        value: completedCount.toString(),           icon: 'check_circle' },
            { label: 'Reading Streak',   value: streak > 0 ? `${streak} days` : '—', icon: 'local_fire_department' },
            { label: 'Avg. Progress',    value: inProgressBooks.length > 0 ? `${avgProgress}%` : '—', icon: 'trending_up' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="glass-card p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
                <p className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">{label}</p>
              </div>
              <p className="text-2xl font-bold text-primary">{value}</p>
            </div>
          ))}
        </section>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-8 border-b border-outline-variant/30">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-label-md border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-black">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Search bar (for in_progress / completed) ── */}
        {activeTab !== 'analytics' && (
          <div className="relative mb-6 max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your books…"
              className="w-full pl-12 pr-4 py-3 bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-base"
            />
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* ── In Progress tab ── */}
        {!loading && activeTab === 'in_progress' && (
          <>
            {filteredProgress.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">menu_book</span>
                <h3 className="font-headline-md mb-2">No Books In Progress</h3>
                <p className="text-on-surface-variant mb-6">Find a book and start reading to track your progress here.</p>
                <a href="/search" className="px-6 py-3 rounded-xl ai-gradient-bg text-white font-semibold">
                  Browse Books
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProgress.map(entry => <ProgressCard key={entry.id} entry={entry} />)}
              </div>
            )}
          </>
        )}

        {/* ── Completed tab ── */}
        {!loading && activeTab === 'completed' && (
          <>
            {filteredCompleted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">check_circle</span>
                <h3 className="font-headline-md mb-2">No Completed Books Yet</h3>
                <p className="text-on-surface-variant mb-6">Finish a book to add it to your completed list.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCompleted.map(entry => <CompletedCard key={entry.id} entry={entry} />)}
              </div>
            )}
          </>
        )}

        {/* ── Analytics tab ── */}
        {!loading && activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Weekly activity */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold mb-1">Weekly Activity</h4>
              <p className="text-label-sm text-on-surface-variant mb-6">Books read per day this week</p>
              {historyEntries.length === 0 ? (
                <p className="text-center text-on-surface-variant/50 py-8">No data yet</p>
              ) : (
                <BarChart data={weeklyData} maxValue={weekMax} />
              )}
            </div>

            {/* Monthly books */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold mb-1">Monthly Books Completed</h4>
              <p className="text-label-sm text-on-surface-variant mb-6">Books finished per month</p>
              {monthlyData.length === 0 ? (
                <p className="text-center text-on-surface-variant/50 py-8">Complete books to see monthly stats</p>
              ) : (
                <BarChart data={monthlyData} maxValue={monthMax} />
              )}
            </div>

            {/* Category breakdown */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold mb-6">Category Breakdown</h4>
              {categoryData.length === 0 ? (
                <p className="text-center text-on-surface-variant/50 py-8">No data yet</p>
              ) : (
                <div className="space-y-4">
                  {categoryData.map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-label-sm mb-1">
                        <span className="font-medium">{item.label}</span>
                        <span className="font-bold" style={{ color: item.color }}>{item.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-highest rounded-full">
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{ width: `${item.value}%`, background: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary stats */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold mb-6">Reading Summary</h4>
              <div className="space-y-4">
                {[
                  { label: 'Total Books Tracked', value: totalBooks.toString() },
                  { label: 'Books Completed',      value: completedCount.toString() },
                  { label: 'Books In Progress',    value: inProgressBooks.length.toString() },
                  { label: 'Favorites Saved',      value: favCount.toString() },
                  { label: 'Current Streak',       value: streak > 0 ? `${streak} days` : 'Start reading!' },
                  { label: 'Avg. Progress',        value: inProgressBooks.length > 0 ? `${avgProgress}%` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-outline-variant/20 last:border-0">
                    <span className="text-on-surface-variant text-sm">{label}</span>
                    <span className="font-bold text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReadingHistory;
