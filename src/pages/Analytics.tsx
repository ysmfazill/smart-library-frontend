import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '../components/AppLayout';
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
    <AppLayout>
            <section className="mb-6 sm:mb-8 animate-fade-in">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2.5 sm:gap-3 text-primary">
                <span className="material-symbols-outlined text-primary text-2xl sm:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
                Reading Analytics
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant">Deep dive into your reading habits and statistics.</p>
            </section>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {/* KPI Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  {[
                    { label: 'Books Read', value: stats?.booksRead || 0, icon: 'auto_stories' },
                    { label: 'Pages Read', value: stats?.pagesRead || 0, icon: 'layers' },
                    { label: 'Reading Hours', value: stats?.readingHours || 0, icon: 'schedule' },
                    { label: 'Current Streak', value: `${stats?.currentStreak || 0} Days`, icon: 'local_fire_department' },
                    { label: 'Max Streak', value: `${stats?.maxStreak || 0} Days`, icon: 'workspace_premium' },
                    { label: 'Global Rank', value: stats?.globalRank ? `#${stats.globalRank}` : 'Unranked', icon: 'public' },
                  ].map(({ label, value, icon }, idx) => (
                    <div key={idx} className="glass-card p-3.5 sm:p-5 rounded-2xl flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-lg sm:text-xl">{icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-on-surface-variant font-bold truncate">{label}</p>
                        <p className="text-base sm:text-2xl font-black text-on-surface truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  
                  {/* Bar Chart */}
                  <div className="glass-card p-4 sm:p-6 rounded-2xl">
                    <h3 className="font-bold text-sm sm:text-base mb-4 sm:mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
                      Books Read per Month
                    </h3>
                    <div className="flex items-end gap-2 h-40 sm:h-48 mt-4 overflow-x-auto custom-scrollbar pb-1">
                      {monthlyReadsData.map((item, i) => (
                        <div key={i} className="flex-1 min-w-[28px] flex flex-col items-center gap-2 group">
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
                          <span className="text-[10px] sm:text-xs text-on-surface-variant font-semibold truncate w-full text-center">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Breakdown (Horizontal Bars) */}
                  <div className="glass-card p-4 sm:p-6 rounded-2xl">
                    <h3 className="font-bold text-sm sm:text-base mb-4 sm:mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">pie_chart</span>
                      Top Categories
                    </h3>
                    {categoryData.length === 0 ? (
                      <div className="h-40 sm:h-48 flex items-center justify-center text-on-surface-variant text-xs sm:text-sm">No category data yet</div>
                    ) : (
                      <div className="space-y-4 sm:space-y-5 flex flex-col justify-center h-40 sm:h-48">
                        {categoryData.map(item => (
                          <div key={item.label}>
                            <div className="flex justify-between text-xs sm:text-sm mb-1 sm:mb-1.5">
                              <span className="font-medium truncate max-w-[150px]">{item.label}</span>
                              <span className="font-bold shrink-0" style={{ color: item.color }}>{item.value}%</span>
                            </div>
                            <div className="w-full h-2 sm:h-2.5 bg-surface-container-highest rounded-full overflow-hidden">
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
    </AppLayout>
  );
};

export default Analytics;
