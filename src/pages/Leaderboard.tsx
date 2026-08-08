import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { analyticsService, type LeaderboardEntry } from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';

type Tab = 'monthly' | 'all_time';

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('monthly');
  const [monthlyData, setMonthlyData] = useState<LeaderboardEntry[]>([]);
  const [allTimeData, setAllTimeData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [monthly, allTime] = await Promise.all([
          analyticsService.getMonthlyLeaderboard(),
          analyticsService.getAllTimeLeaderboard()
        ]);
        setMonthlyData(monthly);
        setAllTimeData(allTime);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const data = activeTab === 'monthly' ? monthlyData : allTimeData;

  const top3 = data.slice(0, 3);

  // Helper to get podium style
  const getPodiumStyle = (rank: number) => {
    if (rank === 1) return { height: '160px', color: 'from-yellow-400 to-yellow-600', icon: '🏆', delay: '0.3s' };
    if (rank === 2) return { height: '120px', color: 'from-gray-300 to-gray-500', icon: '🥈', delay: '0.4s' };
    if (rank === 3) return { height: '100px', color: 'from-orange-400 to-orange-700', icon: '🥉', delay: '0.5s' };
    return { height: '0', color: '', icon: '', delay: '0' };
  };

  // Reorder top 3 for UI (2nd, 1st, 3rd)
  const podiumData = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <AppLayout>
            <section className="mb-6 sm:mb-8 text-center animate-fade-in">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 flex items-center justify-center gap-2 sm:gap-3">
                <span className="material-symbols-outlined text-yellow-500 text-3xl sm:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
                Reading Leaderboard
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant">See how you stack up against the top readers.</p>
            </section>

            {/* ── Tabs ── */}
            <div className="flex justify-center gap-2 mb-8 sm:mb-12">
              {[
                { id: 'monthly', label: 'This Month' },
                { id: 'all_time', label: 'All Time' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all min-h-[40px] ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* ── Podium ── */}
                {podiumData.length > 0 && (
                  <div className="flex justify-center items-end gap-1.5 sm:gap-4 md:gap-6 mb-10 sm:mb-16 pt-6 sm:pt-10 overflow-x-auto custom-scrollbar pb-2">
                    {podiumData.map((entry) => {
                      if (!entry) return null;
                      const style = getPodiumStyle(entry.rank);
                      const isUser = user?.id === entry.userId;
                      return (
                        <div key={entry.userId} className="flex flex-col items-center animate-slide-up shrink-0" style={{ animationDelay: style.delay, animationFillMode: 'both' }}>
                          <div className="text-2xl sm:text-4xl mb-1.5 animate-bounce" style={{ animationDuration: '2s' }}>{style.icon}</div>
                          <div className={`relative mb-2 sm:mb-4 ${entry.rank === 1 ? 'w-16 h-16 sm:w-24 sm:h-24' : 'w-14 h-14 sm:w-20 sm:h-20'}`}>
                            <img src={entry.avatar.includes('/') ? entry.avatar : `/avatars/${entry.avatar}`} alt={entry.name} className={`w-full h-full rounded-full object-cover border-2 sm:border-4 ${isUser ? 'border-primary' : 'border-surface-container-highest'}`} onError={(e) => { if (!(e.target as HTMLImageElement).src.endsWith('/avatars/avatar1.png')) { (e.target as HTMLImageElement).src = '/avatars/avatar1.png'; } }} />
                            {entry.topBadge && (
                              <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-surface rounded-full flex items-center justify-center text-xs sm:text-lg shadow-md border border-outline-variant">
                                {entry.topBadge}
                              </div>
                            )}
                          </div>
                          <div className="text-center mb-2 sm:mb-4">
                            <p className={`font-bold text-xs sm:text-sm line-clamp-1 max-w-[90px] sm:max-w-[120px] ${isUser ? 'text-primary' : 'text-on-surface'}`}>{isUser ? 'You' : entry.name}</p>
                            <p className="text-[10px] sm:text-xs text-on-surface-variant">{entry.booksCompleted} books</p>
                          </div>
                          <div className={`w-20 sm:w-28 md:w-32 rounded-t-lg bg-gradient-to-t ${style.color} shadow-lg relative flex justify-center`} style={{ height: style.height }}>
                            <span className="text-white font-black text-lg sm:text-2xl mt-2 sm:mt-4 opacity-50">{entry.rank}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── List ── */}
                {data.length === 0 ? (
                  <div className="text-center py-16 text-on-surface-variant text-xs sm:text-sm">
                    No reading data available yet.
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
                    {data.map((entry) => {
                      const isUser = user?.id === entry.userId;
                      return (
                        <div
                          key={entry.userId}
                          className={`glass-card p-3 sm:p-4 rounded-xl flex items-center gap-2.5 sm:gap-4 transition-transform hover:scale-[1.01] ${isUser ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                        >
                          <div className="w-6 sm:w-8 font-black text-on-surface-variant text-center text-sm sm:text-lg shrink-0">
                            #{entry.rank}
                          </div>
                          <div className="relative w-9 h-9 sm:w-12 sm:h-12 shrink-0">
                            <img src={entry.avatar.includes('/') ? entry.avatar : `/avatars/${entry.avatar}`} alt={entry.name} className="w-full h-full rounded-full object-cover bg-surface-container" onError={(e) => { if (!(e.target as HTMLImageElement).src.endsWith('/avatars/avatar1.png')) { (e.target as HTMLImageElement).src = '/avatars/avatar1.png'; } }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-xs sm:text-sm line-clamp-1 flex items-center gap-1.5 ${isUser ? 'text-primary' : 'text-on-surface'}`}>
                              {isUser ? 'You' : entry.name}
                              {entry.topBadge && <span className="text-sm sm:text-base" title="Top Achievement">{entry.topBadge}</span>}
                            </p>
                            <p className="text-[10px] sm:text-xs text-on-surface-variant flex gap-2 sm:gap-3 mt-0.5">
                              <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px] sm:text-[14px]">book</span> {entry.booksCompleted} Books</span>
                              <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px] sm:text-[14px]">auto_stories</span> {entry.pagesRead} Pages</span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 justify-end text-orange-500 font-bold text-xs sm:text-sm">
                              <span className="material-symbols-outlined text-[14px] sm:text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                              {entry.readingStreak}
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-on-surface-variant uppercase tracking-wider">Day Streak</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
    </AppLayout>
  );
};

export default Leaderboard;
