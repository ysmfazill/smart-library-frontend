import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthNavbar from '../components/AuthNavbar';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', remember: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await login({ email: form.email, password: form.password });
      // Navigation is now handled natively by AuthRoute when isAuthenticated becomes true
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid email or password. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen overflow-hidden">
      <AuthNavbar />

      <main className="flex min-h-screen w-full pt-0">
        {/* ── LEFT PANEL: Marketing (desktop only) ── */}
        <section className="hidden lg:flex lg:w-[45%] relative bg-primary-container overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-secondary opacity-90 z-0" />
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-12 text-center">
            <div className="animate-fade-in space-y-4 mt-16">
              <h1 className="text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-white drop-shadow-sm">
                Discover Smarter.<br />Read Better.
              </h1>
              <p className="text-[18px] text-white/80 max-w-md mx-auto leading-relaxed">
                Find books you'll love with personalized recommendations tailored to your interests.
              </p>
            </div>
          </div>
          {/* Atmosphere circles */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        </section>

        {/* ── RIGHT PANEL: Login Form ── */}
        <section className="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 lg:p-16 bg-surface relative">
          <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card p-10 rounded-xl relative overflow-hidden">
              {/* Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />

              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                  <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    auto_stories
                  </span>
                </div>
                <h2 className="text-[32px] font-semibold leading-[1.2] tracking-[-0.01em] text-primary mb-2">
                  Welcome Back 👋
                </h2>
                <p className="text-base text-on-surface-variant">
                  Sign in to continue your personalized reading journey.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center">
                  {errorMsg}
                </div>
              )}

              {/* Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email */}
                <AuthInput
                  id="email"
                  type="email"
                  required
                  label="Email Address"
                  icon="mail"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  labelClass="text-sm font-medium tracking-[0.01em] text-on-surface-variant block"
                  iconClass="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base outline-none"
                />

                {/* Password */}
                <AuthInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  label="Password"
                  icon="lock"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  labelClass="text-sm font-medium tracking-[0.01em] text-on-surface-variant block"
                  iconClass="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg"
                  className="w-full pl-10 pr-12 py-3 bg-white border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base outline-none"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  }
                />

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.remember}
                      onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary transition-colors cursor-pointer"
                    />
                    <span className="text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">
                      Remember Me
                    </span>
                  </label>
                  <a href="#" className="text-sm font-semibold text-primary hover:underline decoration-2 underline-offset-4">
                    Forgot Password?
                  </a>
                </div>

                {/* Actions */}
                <div className="space-y-4 pt-2">
                  <AuthButton
                    type="submit"
                    loading={loading}
                    className="accent-gradient w-full py-4 text-white font-bold rounded-lg shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Login
                  </AuthButton>
                  <Link
                    to="/register"
                    className="block w-full py-4 border-2 border-primary/20 text-primary font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all duration-200 text-center"
                  >
                    Create New Account
                  </Link>
                </div>
              </form>

              {/* Card Footer */}
              <div className="mt-10 pt-8 border-t border-outline-variant/20 flex flex-wrap justify-between gap-4 text-xs font-semibold text-on-surface-variant/60">
                <span>Version 1.0</span>
                <div className="flex gap-4">
                  <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-primary transition-colors">Terms &amp; Conditions</a>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile branding */}
          <div className="lg:hidden absolute bottom-8 text-center w-full">
            <p className="text-xs font-semibold text-on-surface-variant/40 uppercase tracking-widest">
              Smart Library Recommendation System
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
