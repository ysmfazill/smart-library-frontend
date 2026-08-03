import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useReadingHistory } from '../context/ReadingHistoryContext';
import { analyticsService, type UserStatistics } from '../services/analyticsService';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { historyEntries, completedBooks } = useReadingHistory();
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await analyticsService.getUserStatistics(user.id);
        setStats(data);
      } catch (err) {
        console.error('Failed to load statistics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user?.id]);

  // Derived Client-Side Data for Charts
  const monthlyReadsData = useMemo(() => {
    const months: Record<string, number> = {};
    completedBooks.forEach(e => {
      const key = new Date(e.lastReadAt).toLocaleDateString('en-US', { month: 'short' });
      months[key] = (months[key] || 0) + 1;
    });
    // Ensure last 6 months have at least 0
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      if (!months[key]) months[key] = 0;
    }
    return Object.entries(months).slice(-6).map(([label, value]) => ({ label, value }));
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

  const monthMax = Math.max(...monthlyReadsData.map(d => d.value), 1);

  return (
    <div className="bg-surface text-on-surface min-h-screen relative overflow-x-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      </div>
      <Navbar />
      <Sidebar />
      
      <main className="md:ml-sidebar-width pt-28 px-container-padding pb-section-gap max-w-[1440px] mx-auto min-h-screen">
        <section className="mb-10 animate-fade-in">
          <h1 className="font-headline-lg text-headline-lg mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
            Reading Analytics
          </h1>
          <p className="text-on-surface-variant">Deep dive into your reading habits and statistics.</p>
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {[
                { label: 'Books Read', value: stats?.booksRead || 0, icon: 'auto_stories' },
                { label: 'Pages Read', value: stats?.pagesRead || 0, icon: 'layers' },
                { label: 'Reading Hours', value: stats?.readingHours || 0, icon: 'schedule' },
                { label: 'Current Streak', value: `${stats?.currentStreak || 0} Days`, icon: 'local_fire_department' },
                { label: 'Max Streak', value: `${stats?.maxStreak || 0} Days`, icon: 'workspace_premium' },
                { label: 'Global Rank', value: stats?.globalRank ? `#${stats.globalRank}` : 'Unranked', icon: 'public' },
              ].map(({ label, value, icon }, idx) => (
                <div key={idx} className="glass-card p-5 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined">{icon}</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{label}</p>
                    <p className="text-2xl font-black text-on-surface">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              
              {/* Bar Chart */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">bar_chart</span>
                  Books Read per Month
                </h3>
                <div className="flex items-end gap-2 h-48 mt-4">
                  {monthlyReadsData.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="relative w-full h-full flex items-end">
                        <div
                          className="w-full rounded-t-md transition-all duration-700 bg-primary/80 group-hover:bg-primary"
                          style={{
                            height: `${monthMax > 0 ? (item.value / monthMax) * 100 : 0}%`,
                            minHeight: item.value > 0 ? '4px' : '0'
                          }}
                        />
                        <div className="absolute -top-6 inset-x-0 text-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-primary">
                          {item.value}
                        </div>
                      </div>
                      <span className="text-xs text-on-surface-variant font-semibold">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown (Horizontal Bars) */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">pie_chart</span>
                  Top Categories
                </h3>
                {categoryData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-on-surface-variant">No category data yet</div>
                ) : (
                  <div className="space-y-5 flex flex-col justify-center h-48">
                    {categoryData.map(item => (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium">{item.label}</span>
                          <span className="font-bold" style={{ color: item.color }}>{item.value}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${item.value}%`, background: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
