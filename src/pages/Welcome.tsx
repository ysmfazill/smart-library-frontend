import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { interestService } from '../services/interestService';
import type { Interest } from '../types';

// ── Icon and description mapping for API interests ───────────────────────────
interface InterestMeta {
  icon?: string;
  desc?: string;
}

const INTEREST_META: Record<string, InterestMeta> = {
  'Artificial Intelligence': { icon: 'neurology', desc: 'Neural networks, LLMs, and AI ethics.' },
  'Machine Learning': { icon: 'memory', desc: 'Algorithms and predictive modeling.' },
  'Python': { icon: 'code', desc: 'Scripting, automation, AI, and data science.' },
  'C++': { icon: 'terminal', desc: 'High-performance systems and memory management.' },
  'Cyber Security': { icon: 'shield_lock', desc: 'Ethical hacking and network defense.' },
  'Data Engineering': { icon: 'database', desc: 'Big data pipelines and ETL architecture.' },
  'Distributed Systems': { icon: 'hub', desc: 'Consensus, scalability, and microservices.' },
  'Quantum Computing': { icon: 'atom', desc: 'Qubits, superposition, and quantum logic.' },
  'Web Architecture': { icon: 'html', desc: 'Full-stack systems and cloud web design.' },
  'Philosophy of Mind': { icon: 'lightbulb', desc: 'Consciousness, logic, and cognition.' },
  'Data Science': { icon: 'analytics', desc: 'Big data, analytics, and visualization.' },
  'Java Programming': { icon: 'code_blocks', desc: 'Enterprise development and JVM.' },
  'Web Development': { icon: 'web', desc: 'Full-stack, React, and modern CSS.' },
  'Cloud Computing': { icon: 'cloud', desc: 'AWS, Azure, and infrastructure.' },
  'Mobile App Dev': { icon: 'smartphone', desc: 'iOS, Android, and Flutter.' },
  'UI/UX Design': { icon: 'palette', desc: 'Product design and user research.' },
  'Business': { icon: 'business_center', desc: 'Strategy and corporate growth.' },
  'Entrepreneurship': { icon: 'rocket_launch', desc: 'Startups and building ventures.' },
  'Finance': { icon: 'payments', desc: 'Markets, personal finance, and crypto.' },
  'Marketing': { icon: 'campaign', desc: 'Branding and digital advertising.' },
  'Self Help': { icon: 'psychology_alt', desc: 'Personal growth and mindset.' },
  'Productivity': { icon: 'timer', desc: 'Time management and workflows.' },
  'Science': { icon: 'science', desc: 'Physics, biology, and the universe.' },
  'History': { icon: 'history_edu', desc: 'Past civilizations and events.' },
  'Biography': { icon: 'person_book', desc: 'Stories of influential lives.' },
  'Fantasy': { icon: 'auto_fix_high', desc: 'Magic systems and world building.' },
  'Mystery': { icon: 'search_check', desc: 'Thrillers and investigative plots.' },
  'Romance': { icon: 'favorite', desc: 'Relationships and emotional journeys.' },
  'Psychology': { icon: 'psychology', desc: 'Behavior and the human mind.' },
  'Health & Fitness': { icon: 'fitness_center', desc: 'Nutrition and physical wellness.' },
  'Philosophy': { icon: 'lightbulb', desc: 'Ethics, logic, and metaphysics.' },
};

// ── Static fallback interests (shown while API loads) ─────────────────────────
const FALLBACK_INTERESTS: Interest[] = [
  { id: 1, name: 'Artificial Intelligence', icon: 'neurology', desc: 'Neural networks, LLMs, and AI ethics.' },
  { id: 2, name: 'Machine Learning', icon: 'memory', desc: 'Algorithms and predictive modeling.' },
  { id: 3, name: 'Python', icon: 'code', desc: 'Scripting, automation, AI, and data science.' },
  { id: 4, name: 'C++', icon: 'terminal', desc: 'High-performance systems and memory management.' },
  { id: 5, name: 'Cyber Security', icon: 'shield_lock', desc: 'Ethical hacking and network defense.' },
  { id: 6, name: 'Data Engineering', icon: 'database', desc: 'Big data pipelines and ETL architecture.' },
  { id: 7, name: 'Distributed Systems', icon: 'hub', desc: 'Consensus, scalability, and microservices.' },
  { id: 8, name: 'Quantum Computing', icon: 'atom', desc: 'Qubits, superposition, and quantum logic.' },
  { id: 9, name: 'Web Architecture', icon: 'html', desc: 'Full-stack systems and cloud web design.' },
  { id: 10, name: 'Philosophy of Mind', icon: 'lightbulb', desc: 'Consciousness, logic, and cognition.' },
  { id: 11, name: 'Data Science', icon: 'analytics', desc: 'Big data, analytics, and visualization.' },
  { id: 12, name: 'Java Programming', icon: 'code_blocks', desc: 'Enterprise development and JVM.' },
  { id: 13, name: 'Web Development', icon: 'web', desc: 'Full-stack, React, and modern CSS.' },
  { id: 14, name: 'Cloud Computing', icon: 'cloud', desc: 'AWS, Azure, and infrastructure.' },
  { id: 15, name: 'Mobile App Dev', icon: 'smartphone', desc: 'iOS, Android, and Flutter.' },
  { id: 16, name: 'UI/UX Design', icon: 'palette', desc: 'Product design and user research.' },
  { id: 17, name: 'Business', icon: 'business_center', desc: 'Strategy and corporate growth.' },
  { id: 18, name: 'Entrepreneurship', icon: 'rocket_launch', desc: 'Startups and building ventures.' },
  { id: 19, name: 'Finance', icon: 'payments', desc: 'Markets, personal finance, and crypto.' },
  { id: 20, name: 'Marketing', icon: 'campaign', desc: 'Branding and digital advertising.' },
  { id: 21, name: 'Self Help', icon: 'psychology_alt', desc: 'Personal growth and mindset.' },
  { id: 22, name: 'Productivity', icon: 'timer', desc: 'Time management and workflows.' },
  { id: 23, name: 'Science', icon: 'science', desc: 'Physics, biology, and the universe.' },
  { id: 24, name: 'History', icon: 'history_edu', desc: 'Past civilizations and events.' },
  { id: 25, name: 'Biography', icon: 'person_book', desc: 'Stories of influential lives.' },
  { id: 26, name: 'Fantasy', icon: 'auto_fix_high', desc: 'Magic systems and world building.' },
  { id: 27, name: 'Mystery', icon: 'search_check', desc: 'Thrillers and investigative plots.' },
  { id: 28, name: 'Romance', icon: 'favorite', desc: 'Relationships and emotional journeys.' },
  { id: 29, name: 'Psychology', icon: 'psychology', desc: 'Behavior and the human mind.' },
  { id: 30, name: 'Health & Fitness', icon: 'fitness_center', desc: 'Nutrition and physical wellness.' },
  { id: 31, name: 'Philosophy', icon: 'lightbulb', desc: 'Ethics, logic, and metaphysics.' },
];

const MIN_INTERESTS = 1;
const MAX_INTERESTS = 10;

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateNeedsOnboarding } = useAuth();
  const [interests, setInterests] = useState<Interest[]>(FALLBACK_INTERESTS);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to load interests from API, fall back to static list
  useEffect(() => {
    let cancelled = false;
    interestService.getAllInterests().then((res: any) => {
      if (cancelled) return;
      const list = Array.isArray(res) ? res : (res?.content || []);
      if (list.length > 0) {
        setInterests(list.map((i: any): Interest => {
          const name = i.interestName || i.name || '';
          const meta = INTEREST_META[name];
          return {
            id: i.id,
            name,
            icon: i.icon || meta?.icon || 'bookmark',
            desc: i.desc || i.description || meta?.desc || 'Explore related books and concepts.',
          };
        }));
      }
    }).catch(() => {/* stay with fallback */});
    return () => { cancelled = true; };
  }, []);

  const toggle = (interest: Interest) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(interest.id)) {
        next.delete(interest.id);
      } else if (next.size < MAX_INTERESTS) {
        next.add(interest.id);
      }
      return next;
    });
  };

  const canContinue = selected.size >= MIN_INTERESTS;

  const handleContinue = async () => {
    if (!canContinue || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (user?.id) {
        await interestService.updateUserInterests(user.id, Array.from(selected));
      }
      updateNeedsOnboarding(false);
      navigate('/home', { replace: true });
    } catch {
      setError('Failed to save your interests. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    updateNeedsOnboarding(false);
    navigate('/home', { replace: true });
  };

  return (
    <div
      className="flex items-center justify-center p-3 sm:p-6 md:p-8 min-h-screen w-full overflow-x-hidden"
      style={{
        background: 'radial-gradient(circle at top right, #ebddff 0%, #f7f9fb 40%), radial-gradient(circle at bottom left, #d8e2ff 0%, #f7f9fb 40%)',
      }}
    >
      <div className="fixed top-0 right-0 -z-10 w-1/2 h-1/2 bg-gradient-to-br from-primary/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-1/2 h-1/2 bg-gradient-to-tr from-secondary/10 to-transparent blur-[120px] pointer-events-none" />

      <main className="w-full max-w-5xl glass-card rounded-2xl sm:rounded-[32px] overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] relative">
        {/* Progress bar */}
        <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-3 sm:pb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] sm:text-xs font-semibold text-on-surface-variant">Step 1 of 2</span>
            <span className="text-[10px] sm:text-xs font-bold text-primary">Personalization</span>
          </div>
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full accent-gradient transition-all duration-500 ease-out"
              style={{ width: `${Math.max(10, (selected.size / MAX_INTERESTS) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex-1 p-4 sm:p-8 md:p-12 flex flex-col max-h-[85vh] sm:max-h-[870px]">
            <header className="relative mb-4 sm:mb-8 flex items-center gap-4">
              <img src="/logo.png" alt="Readify App Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain shrink-0" />
              <div className="relative z-10">
                <h1 className="text-xl sm:text-2xl md:text-[32px] font-bold leading-tight tracking-tight text-on-surface mb-1 flex items-center gap-2">
                  👋 Welcome to Readify App
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-on-surface-variant max-w-xl">
                  Let's personalize your reading experience. Select the topics you're interested in so our smart engine can recommend books you'll love.
                </p>
              </div>
            </header>

            {/* Interest grid */}
            <div className="flex-1 overflow-y-auto pr-1 sm:pr-4 mb-4 sm:mb-8 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {interests.map(cat => {
                  const isSelected = selected.has(cat.id);
                  const isDisabled = !isSelected && selected.size >= MAX_INTERESTS;
                  return (
                    <div
                      key={cat.id}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={isDisabled ? -1 : 0}
                      onClick={() => !isDisabled && toggle(cat)}
                      onKeyDown={(e) => e.key === 'Enter' && !isDisabled && toggle(cat)}
                      className={`interest-card glass-card rounded-2xl p-3.5 sm:p-4 border border-white/40 flex flex-col gap-1.5 sm:gap-2 relative group cursor-pointer min-h-[80px] ${isSelected ? 'selected' : ''} ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-1.5 sm:p-2 rounded-xl bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                          <span className="material-symbols-outlined text-[20px] sm:text-[24px]">{cat.icon}</span>
                        </div>
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-white flex items-center justify-center transition-all duration-300 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                        >
                          <span className="material-symbols-outlined text-[14px] sm:text-[16px] font-bold">check</span>
                        </div>
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-on-surface">{cat.name}</h3>
                      <p className="text-[10px] sm:text-[11px] leading-tight text-on-surface-variant opacity-70 line-clamp-2">{cat.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-4 sm:pt-6 border-t border-outline-variant/30">
              {error && (
                <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
                  {error}
                </div>
              )}
              <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs sm:text-sm">
                <span className="material-symbols-outlined text-primary text-base sm:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lightbulb
                </span>
                <p className="text-on-surface-variant">
                  <span className="font-bold text-primary">Tip:</span> The more interests you select, the better your recommendations become.
                  {' '}({selected.size}/{MAX_INTERESTS} selected)
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <p className="text-[11px] sm:text-xs font-semibold text-outline text-center sm:text-left order-2 sm:order-1">
                  You can change your interests anytime from your Profile.
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                  <button
                    onClick={handleSkip}
                    disabled={saving}
                    className="flex-1 sm:flex-initial px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium text-on-surface-variant hover:text-primary transition-colors min-h-[48px]"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={handleContinue}
                    disabled={!canContinue || saving}
                    className={`flex-1 sm:flex-initial px-6 sm:px-8 py-3 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all min-h-[48px] justify-center ${
                      canContinue && !saving
                        ? 'accent-gradient shadow-primary/20 hover:scale-105 active:scale-95 cursor-pointer'
                        : 'bg-outline/30 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {saving ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                    ) : (
                      <>Continue <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Welcome;
