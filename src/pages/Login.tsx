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
  
  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      await login({ email: form.email, password: form.password });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid email or password. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitted(true);
  };

  return (
    <div className="bg-background text-on-background min-h-screen overflow-x-hidden relative flex flex-col">
      <AuthNavbar />

      <main className="flex-1 flex min-h-screen w-full pt-16 sm:pt-20">
        {/* ── LEFT PANEL: Marketing (desktop only) ── */}
        <section className="hidden lg:flex lg:w-[45%] relative bg-primary-container overflow-hidden items-center justify-center p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container to-secondary opacity-90 z-0" />
          <div className="relative z-10 w-full flex flex-col items-center justify-center text-center max-w-lg">
            <div className="animate-fade-in space-y-6">
              <h1 className="text-3xl lg:text-5xl font-bold leading-tight tracking-tight text-white drop-shadow-sm">
                Discover Smarter.<br />Read Better.
              </h1>
              <p className="text-base lg:text-lg text-white/80 leading-relaxed">
                Find books you'll love with personalized recommendations tailored to your interests.
              </p>
            </div>
          </div>
          {/* Atmosphere circles */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        </section>

        {/* ── RIGHT PANEL: Login Form ── */}
        <section className="w-full lg:w-[55%] flex flex-col items-center justify-center px-4 py-8 sm:p-12 lg:p-16 bg-surface relative">
          <div className="w-full max-w-[420px] mx-auto animate-fade-in my-auto">
            <div className="glass-card p-6 sm:p-8 lg:p-10 rounded-2xl relative overflow-hidden shadow-xl border border-white/40">
              {/* Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />

              {/* Centered Vertical Branding Group */}
              <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
                {/* 1. Logo */}
                <div className="login-anim-logo inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mb-1.5 shrink-0">
                  <img
                    src="/logo.png"
                    alt="Readify App Logo"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* 2. Readify Brand Heading directly below logo */}
                <h1 className="login-anim-heading text-lg sm:text-xl font-extrabold tracking-tight text-primary mb-3">
                  Readify
                </h1>

                {/* 3. Login Title & Subtitle */}
                <div className="login-anim-heading space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                    Welcome Back 👋
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant max-w-xs mx-auto">
                    Sign in to continue your personalized reading journey.
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium text-center">
                  {errorMsg}
                </div>
              )}

              {/* Form */}
              <form className="space-y-4 sm:space-y-6 login-anim-form" onSubmit={handleSubmit}>
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
                  labelClass="text-xs sm:text-sm font-medium text-on-surface-variant block"
                  iconClass="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm sm:text-base outline-none min-h-[44px]"
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
                  labelClass="text-xs sm:text-sm font-medium text-on-surface-variant block"
                  iconClass="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg"
                  className="w-full pl-10 pr-12 py-3 bg-white border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm sm:text-base outline-none min-h-[44px]"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors p-1 min-h-[40px] min-w-[40px] flex items-center justify-center"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  }
                />

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.remember}
                      onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary transition-colors cursor-pointer"
                    />
                    <span className="font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">
                      Remember Me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotSubmitted(false); setForgotEmail(form.email); }}
                    className="font-semibold text-primary hover:underline decoration-2 underline-offset-4 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2 login-anim-buttons">
                  <AuthButton
                    type="submit"
                    loading={loading}
                    className="accent-gradient w-full min-h-[48px] py-3.5 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Login
                  </AuthButton>
                  <Link
                    to="/register"
                    className="block w-full min-h-[48px] py-3.5 border-2 border-primary/20 text-primary font-bold text-sm sm:text-base rounded-xl hover:bg-primary/5 active:scale-95 transition-all text-center flex items-center justify-center"
                  >
                    Create New Account
                  </Link>
                </div>
              </form>

              {/* Card Footer */}
              <div className="mt-8 pt-6 border-t border-outline-variant/20 flex flex-wrap justify-between gap-3 text-[11px] font-semibold text-on-surface-variant/60">
                <span>Version 1.0</span>
                <div className="flex gap-3">
                  <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-primary transition-colors">Terms &amp; Conditions</a>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile branding */}
          <div className="mt-6 text-center w-full lg:hidden">
            <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
              Readify App — Smart Recommendation System
            </p>
          </div>
        </section>
      </main>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-[420px] mx-auto p-6 sm:p-8 rounded-2xl shadow-2xl relative border border-white/40">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary p-1 rounded-full hover:bg-surface-container"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3 text-primary">
                <span className="material-symbols-outlined text-2xl">lock_reset</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">Reset Password</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                Enter your registered email address and we'll send you instructions to reset your password.
              </p>
            </div>

            {forgotSubmitted ? (
              <div className="text-center py-4 space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs sm:text-sm font-semibold">
                  Password reset link sent to <strong>{forgotEmail}</strong>! Check your inbox.
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="w-full py-3 rounded-xl ai-gradient-bg text-white font-bold text-sm min-h-[48px]"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <AuthInput
                  id="forgot-email"
                  type="email"
                  required
                  label="Email Address"
                  icon="mail"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  labelClass="text-xs sm:text-sm font-medium text-on-surface-variant block"
                  iconClass="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm outline-none min-h-[44px]"
                />
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl ai-gradient-bg text-white font-bold text-sm shadow-md min-h-[48px] cursor-pointer"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
