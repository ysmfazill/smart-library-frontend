import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useUserProfile } from '../context/UserProfileContext';
import type { Theme, FontSize, Language } from '../context/UserProfileContext';

// ── Sub-components ────────────────────────────────────────────

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}
const Toggle: React.FC<ToggleProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-4 border-b border-outline-variant/15 last:border-0">
    <div>
      <p className="text-body-md font-medium text-on-surface">{label}</p>
      {description && <p className="text-label-sm text-on-surface-variant mt-0.5">{description}</p>}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${checked ? 'bg-primary' : 'bg-surface-container-high'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'translate-x-7' : 'translate-x-1'}`}
      />
    </button>
  </div>
);

interface SectionCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}
const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children }) => (
  <div className="glass-card rounded-2xl p-8">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl ai-gradient-bg flex items-center justify-center text-white">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <h2 className="font-headline-md text-body-lg font-bold">{title}</h2>
    </div>
    {children}
  </div>
);

// ── Theme Switcher ────────────────────────────────────────────
const THEMES: { value: Theme; label: string; icon: string; preview: string }[] = [
  { value: 'light',  label: 'Light',  icon: 'light_mode',     preview: 'bg-white border-outline-variant/30' },
  { value: 'dark',   label: 'Dark',   icon: 'dark_mode',      preview: 'bg-gray-900 border-gray-700' },
  { value: 'system', label: 'System', icon: 'devices',        preview: 'bg-gradient-to-r from-white to-gray-900 border-outline-variant/30' },
];

const ThemeSwitcher: React.FC<{ value: Theme; onChange: (v: Theme) => void }> = ({ value, onChange }) => (
  <div className="grid grid-cols-3 gap-3">
    {THEMES.map(theme => (
      <button
        key={theme.value}
        onClick={() => onChange(theme.value)}
        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
          value === theme.value
            ? 'border-primary bg-primary/5 shadow-md'
            : 'border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container'
        }`}
      >
        {/* Mini preview window */}
        <div className={`w-full h-14 rounded-xl border ${theme.preview} flex items-end gap-1 p-2 overflow-hidden`}>
          <div className={`h-1.5 flex-1 rounded-full ${theme.value === 'dark' ? 'bg-purple-400' : 'bg-primary/40'}`} />
          <div className={`h-3 w-3 rounded ${theme.value === 'dark' ? 'bg-gray-700' : 'bg-surface-container-high'}`} />
        </div>
        <span className={`material-symbols-outlined ${value === theme.value ? 'text-primary' : 'text-on-surface-variant'}`}>
          {theme.icon}
        </span>
        <span className={`text-label-md font-semibold ${value === theme.value ? 'text-primary' : 'text-on-surface-variant'}`}>
          {theme.label}
        </span>
        {value === theme.value && (
          <span className="w-2 h-2 rounded-full bg-primary" />
        )}
      </button>
    ))}
  </div>
);

// ── Font Size Selector ────────────────────────────────────────
const FONT_SIZES: { value: FontSize; label: string; example: string }[] = [
  { value: 'small',  label: 'Small',  example: 'text-xs'  },
  { value: 'medium', label: 'Medium', example: 'text-sm'  },
  { value: 'large',  label: 'Large',  example: 'text-base' },
];

// ── Language Selector ─────────────────────────────────────────
const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English',  flag: '🇬🇧' },
  { value: 'ar', label: 'Arabic',   flag: '🇸🇦' },
  { value: 'fr', label: 'French',   flag: '🇫🇷' },
  { value: 'de', label: 'German',   flag: '🇩🇪' },
];

// ── Main Page ─────────────────────────────────────────────────
type SettingsTab = 'appearance' | 'notifications' | 'privacy' | 'display' | 'account';

const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useUserProfile();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [saveNotice, setSaveNotice] = useState(false);

  const save = (updates: Parameters<typeof updateSettings>[0]) => {
    updateSettings(updates);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2000);
  };

  const TABS: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'appearance',    label: 'Appearance',     icon: 'palette'        },
    { id: 'notifications', label: 'Notifications',  icon: 'notifications'  },
    { id: 'privacy',       label: 'Privacy',        icon: 'shield'         },
    { id: 'display',       label: 'Display',        icon: 'tune'           },
    { id: 'account',       label: 'Account',        icon: 'manage_accounts' },
  ];

  return (
    <AppLayout>

          {/* Save toast */}
          <div className={`fixed top-20 sm:top-24 right-4 sm:right-6 z-50 flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl ai-gradient-bg text-white shadow-lg text-xs sm:text-sm transition-all duration-300 ${saveNotice ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Settings saved!
          </div>

          <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 max-w-[1440px] mx-auto w-full">

            {/* ── Header ── */}
            <section className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2.5 sm:gap-3 text-primary">
                <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  settings
                </span>
                Settings
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Customize your Readify experience. All preferences are stored locally.
              </p>
            </section>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

              {/* ── Sidebar tabs ── */}
              <nav className="lg:w-56 shrink-0">
                <div className="glass-card rounded-2xl p-1.5 sm:p-2 flex lg:flex-col flex-row overflow-x-auto custom-scrollbar gap-1">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[40px] ${
                        activeTab === tab.id
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]" style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}>
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </nav>

          {/* ── Content panels ── */}
          <div className="flex-1 min-w-0">

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div className="flex flex-col gap-gutter">
                <SectionCard title="Theme" icon="palette">
                  <ThemeSwitcher
                    value={settings.theme}
                    onChange={v => save({ theme: v })}
                  />
                  <p className="text-label-sm text-on-surface-variant mt-4 opacity-70">
                    Dark and System themes are UI-only previews. Full implementation will be available in Phase 4.
                  </p>
                </SectionCard>

                <SectionCard title="Text Size" icon="text_fields">
                  <div className="flex gap-3">
                    {FONT_SIZES.map(fs => (
                      <button
                        key={fs.value}
                        onClick={() => save({ fontSize: fs.value })}
                        className={`flex-1 py-4 px-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          settings.fontSize === fs.value
                            ? 'border-primary bg-primary/5'
                            : 'border-outline-variant/30 hover:border-primary/30'
                        }`}
                      >
                        <span className={`font-bold ${fs.example} ${settings.fontSize === fs.value ? 'text-primary' : 'text-on-surface'}`}>Aa</span>
                        <span className={`text-label-sm font-medium ${settings.fontSize === fs.value ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {fs.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Language" icon="language">
                  <div className="grid grid-cols-2 gap-3">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.value}
                        onClick={() => save({ language: lang.value })}
                        className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all text-left ${
                          settings.language === lang.value
                            ? 'border-primary bg-primary/5'
                            : 'border-outline-variant/30 hover:border-primary/30'
                        }`}
                      >
                        <span className="text-2xl">{lang.flag}</span>
                        <span className={`text-label-md font-semibold ${settings.language === lang.value ? 'text-primary' : 'text-on-surface'}`}>
                          {lang.label}
                        </span>
                        {settings.language === lang.value && (
                          <span className="ml-auto material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-label-sm text-on-surface-variant mt-4 opacity-70">
                    Additional languages are UI previews. Full localization coming in a future update.
                  </p>
                </SectionCard>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <SectionCard title="Notifications" icon="notifications">
                <Toggle
                  label="New Recommendations"
                  description="Get notified when the AI finds new books matching your interests."
                  checked={settings.notifyNewRecommendations}
                  onChange={v => save({ notifyNewRecommendations: v })}
                />
                <Toggle
                  label="Reading Reminders"
                  description="Daily nudges to maintain your reading streak."
                  checked={settings.notifyReadingReminders}
                  onChange={v => save({ notifyReadingReminders: v })}
                />
                <Toggle
                  label="New Arrivals"
                  description="Be first to know when new titles are added to the library."
                  checked={settings.notifyNewArrivals}
                  onChange={v => save({ notifyNewArrivals: v })}
                />
                <Toggle
                  label="Weekly Digest"
                  description="A curated summary of your reading progress and new highlights."
                  checked={settings.notifyWeeklyDigest}
                  onChange={v => save({ notifyWeeklyDigest: v })}
                />
                <p className="text-label-sm text-on-surface-variant mt-5 opacity-60 pt-5 border-t border-outline-variant/20">
                  Push notifications require browser permission. These settings are stored locally.
                </p>
              </SectionCard>
            )}

            {/* Privacy */}
            {activeTab === 'privacy' && (
              <SectionCard title="Privacy & Sharing" icon="shield">
                <Toggle
                  label="Public Profile"
                  description="Allow other researchers to view your profile and reading list."
                  checked={settings.profilePublic}
                  onChange={v => save({ profilePublic: v })}
                />
                <Toggle
                  label="Show Reading Activity"
                  description="Display which books you are currently reading on your profile."
                  checked={settings.showReadingActivity}
                  onChange={v => save({ showReadingActivity: v })}
                />
                <Toggle
                  label="Share Reading Progress"
                  description="Contribute anonymized reading data to improve AI recommendations."
                  checked={settings.shareProgress}
                  onChange={v => save({ shareProgress: v })}
                />

                <div className="mt-8 p-5 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                    <div>
                      <p className="text-label-md font-bold text-on-surface mb-1">Your data stays local</p>
                      <p className="text-label-sm text-on-surface-variant">
                        All profile data, reading history, and favorites are stored entirely in your browser's localStorage.
                        No data is transmitted to any server in this phase.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Display */}
            {activeTab === 'display' && (
              <SectionCard title="Display & Behavior" icon="tune">
                <Toggle
                  label="Compact Mode"
                  description="Show more content with reduced padding and smaller cards."
                  checked={settings.compactMode}
                  onChange={v => save({ compactMode: v })}
                />
                <Toggle
                  label="Enable Animations"
                  description="Hover effects, transitions, and micro-animations throughout the app."
                  checked={settings.animationsEnabled}
                  onChange={v => save({ animationsEnabled: v })}
                />
                <Toggle
                  label="Auto-play Previews"
                  description="Automatically start AI-generated audio summaries when viewing book details."
                  checked={settings.autoPlayPreviews}
                  onChange={v => save({ autoPlayPreviews: v })}
                />
              </SectionCard>
            )}

            {/* Account */}
            {activeTab === 'account' && (
              <div className="flex flex-col gap-gutter">
                <SectionCard title="Account Management" icon="manage_accounts">
                  <div className="space-y-4">
                    {[
                      { label: 'Change Password',     icon: 'lock',          desc: 'Update your account password'             },
                      { label: 'Two-Factor Auth',     icon: 'security',      desc: 'Add an extra layer of security'           },
                      { label: 'Connected Apps',      icon: 'api',           desc: 'Manage third-party integrations'          },
                      { label: 'Download My Data',    icon: 'download',      desc: 'Export all your data as JSON'             },
                      { label: 'Activity Log',        icon: 'history',       desc: 'View recent account activity'            },
                    ].map(({ label, icon, desc }) => (
                      <button
                        key={label}
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container transition-all group text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <span className="material-symbols-outlined text-sm">{icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-label-md font-semibold text-on-surface">{label}</p>
                          <p className="text-label-sm text-on-surface-variant">{desc}</p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors">chevron_right</span>
                      </button>
                    ))}
                  </div>
                </SectionCard>

                <div className="glass-card rounded-2xl p-8 border border-red-200/50">
                  <h3 className="text-label-sm text-red-500 uppercase tracking-wider font-bold mb-2">Danger Zone</h3>
                  <p className="text-label-md text-on-surface-variant mb-6">
                    These actions are irreversible. Please proceed with caution.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={resetSettings}
                      className="flex-1 py-3 rounded-xl border border-outline-variant/40 text-on-surface-variant font-semibold text-label-md hover:bg-surface-container transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">restart_alt</span>
                      Reset All Settings
                    </button>
                    <button className="flex-1 py-3 rounded-xl border border-red-200 text-red-500 font-semibold text-label-md hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">delete_forever</span>
                      Delete Account
                    </button>
                  </div>
                  <p className="text-label-sm text-on-surface-variant/50 mt-4">
                    "Reset All Settings" clears all your preferences from localStorage. "Delete Account" is UI-only in this phase.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

    </AppLayout>
  );
};

export default Settings;
