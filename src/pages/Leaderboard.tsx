import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
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
    <div className="bg-surface text-on-surface min-h-screen relative overflow-x-hidden">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      </div>
      <Navbar />
      <Sidebar />
      
      <main className="md:ml-sidebar-width pt-28 px-container-padding pb-section-gap max-w-[1440px] mx-auto min-h-screen">
        <section className="mb-10 text-center animate-fade-in">
          <h1 className="font-headline-lg text-headline-lg mb-2 flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-yellow-500 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
            Reading Leaderboard
          </h1>
          <p className="text-on-surface-variant">See how you stack up against the top readers.</p>
        </section>

        {/* ── Tabs ── */}
        <div className="flex justify-center gap-2 mb-12">
          {[
            { id: 'monthly', label: 'This Month' },
            { id: 'all_time', label: 'All Time' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-8 py-3 rounded-full font-bold text-label-md transition-all ${
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
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Podium ── */}
            {podiumData.length > 0 && (
              <div className="flex justify-center items-end gap-2 md:gap-6 mb-16 pt-10">
                {podiumData.map((entry) => {
                  if (!entry) return null;
                  const style = getPodiumStyle(entry.rank);
                  const isUser = user?.id === entry.userId;
                  return (
                    <div key={entry.userId} className="flex flex-col items-center animate-slide-up" style={{ animationDelay: style.delay, animationFillMode: 'both' }}>
                      <div className="text-4xl mb-2 animate-bounce" style={{ animationDuration: '2s' }}>{style.icon}</div>
                      <div className={`relative mb-4 ${entry.rank === 1 ? 'w-24 h-24' : 'w-20 h-20'}`}>
                        <img src={entry.avatar.includes('/') ? entry.avatar : `/avatars/${entry.avatar}`} alt={entry.name} className={`w-full h-full rounded-full object-cover border-4 ${isUser ? 'border-primary' : 'border-surface-container-highest'}`} onError={(e) => { if (!(e.target as HTMLImageElement).src.endsWith('/avatars/avatar1.png')) { (e.target as HTMLImageElement).src = '/avatars/avatar1.png'; } }} />
                        {entry.topBadge && (
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-surface rounded-full flex items-center justify-center text-lg shadow-md border border-outline-variant">
                            {entry.topBadge}
                          </div>
                        )}
                      </div>
                      <div className="text-center mb-4">
                        <p className={`font-bold line-clamp-1 max-w-[120px] ${isUser ? 'text-primary' : 'text-on-surface'}`}>{isUser ? 'You' : entry.name}</p>
                        <p className="text-xs text-on-surface-variant">{entry.booksCompleted} books</p>
                      </div>
                      <div className={`w-24 md:w-32 rounded-t-lg bg-gradient-to-t ${style.color} shadow-lg relative flex justify-center`} style={{ height: style.height }}>
                        <span className="text-white font-black text-2xl mt-4 opacity-50">{entry.rank}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── List ── */}
            {data.length === 0 ? (
              <div className="text-center py-20 text-on-surface-variant">
                No reading data available yet.
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-3">
                {data.map((entry) => {
                  const isUser = user?.id === entry.userId;
                  return (
                    <div
                      key={entry.userId}
                      className={`glass-card p-4 rounded-xl flex items-center gap-4 transition-transform hover:scale-[1.01] ${isUser ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                    >
                      <div className="w-8 font-black text-on-surface-variant text-center text-lg">
                        #{entry.rank}
                      </div>
                      <div className="relative w-12 h-12 shrink-0">
                        <img src={entry.avatar.includes('/') ? entry.avatar : `/avatars/${entry.avatar}`} alt={entry.name} className="w-full h-full rounded-full object-cover bg-surface-container" onError={(e) => { if (!(e.target as HTMLImageElement).src.endsWith('/avatars/avatar1.png')) { (e.target as HTMLImageElement).src = '/avatars/avatar1.png'; } }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm line-clamp-1 flex items-center gap-2 ${isUser ? 'text-primary' : 'text-on-surface'}`}>
                          {isUser ? 'You' : entry.name}
                          {entry.topBadge && <span className="text-base" title="Top Achievement">{entry.topBadge}</span>}
                        </p>
                        <p className="text-xs text-on-surface-variant flex gap-3 mt-1">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">book</span> {entry.booksCompleted} Books</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">auto_stories</span> {entry.pagesRead} Pages</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end text-orange-500 font-bold text-sm">
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                          {entry.readingStreak}
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-1 uppercase tracking-wider">Day Streak</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
