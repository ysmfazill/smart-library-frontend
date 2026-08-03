import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthNavbar from '../components/AuthNavbar';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';
import { useAuth } from '../context/AuthContext';

type Strength = 'none' | 'weak' | 'medium' | 'strong';

function calcStrength(val: string): Strength {
  if (!val) return 'none';
  let score = 0;
  if (val.length > 5) score++;
  if (val.length > 8 && /[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
  if (val.length > 12 && /[^A-Za-z0-9]/.test(val)) score++;
  if (score === 1) return 'weak';
  if (score === 2) return 'medium';
  if (score === 3) return 'strong';
  return 'none';
}

const METER_COLORS: Record<Strength, { bars: number; color: string; label: string; textClass: string }> = {
  none:   { bars: 0, color: 'bg-outline/20',  label: 'Too short', textClass: 'text-outline' },
  weak:   { bars: 1, color: 'bg-error',        label: 'Weak',      textClass: 'text-error' },
  medium: { bars: 2, color: 'bg-yellow-400',   label: 'Medium',    textClass: 'text-yellow-500' },
  strong: { bars: 3, color: 'bg-green-500',    label: 'Strong',    textClass: 'text-green-500' },
};

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', username: '', password: '', confirmPassword: '', terms: false,
  });

  const strength = calcStrength(form.password);
  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      navigate('/welcome');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Email may already be in use.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-12 pr-4 py-4 rounded-xl border border-outline-variant bg-surface/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base';

  return (
    <div className="bg-surface text-on-surface overflow-x-hidden min-h-screen">
      <AuthNavbar rightLink={{ label: 'Sign In', href: '/login' }} />

      <main className="min-h-screen flex pt-20">
        {/* ── LEFT PANEL ── */}
        <section className="hidden lg:flex lg:w-[45%] brand-gradient relative flex-col justify-center px-16 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          </div>
          <div className="relative z-10 text-white space-y-6">
            <h1 className="text-[48px] font-bold leading-tight tracking-[-0.02em]">
              Start Your<br />Reading Journey
            </h1>
            <p className="text-[18px] text-white/80 max-w-md leading-relaxed">
              Create your account and let our engine personalize your reading experience from day one. Precision in knowledge, tailored to your intellect.
            </p>
          </div>
        </section>

        {/* ── RIGHT PANEL ── */}
        <section className="w-full lg:w-[55%] flex items-center justify-center p-8 bg-background relative overflow-y-auto">
          <div className="w-full max-w-xl fade-in-card">
            <div className="glass-card rounded-3xl p-10 shadow-sm border border-white/50">
              {/* Header */}
              <div className="mb-8 text-center">
                <h2 className="text-[32px] font-semibold leading-[1.2] tracking-[-0.01em] text-on-surface mb-2">
                  Create Your Account 🚀
                </h2>
                <p className="text-on-surface-variant text-base">Join the next generation of academic discovery.</p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center">
                  {errorMsg}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Full Name */}
                <AuthInput
                  id="fullName" type="text" required placeholder="Dr. John Doe"
                  label="Full Name" icon="person"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  labelClass="text-sm font-medium text-on-surface-variant"
                  iconClass="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline"
                  className={inputClass}
                />

                {/* Email + Username grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AuthInput
                    id="reg-email" type="email" required placeholder="name@example.com"
                    label="Email Address" icon="mail"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    labelClass="text-sm font-medium text-on-surface-variant"
                    iconClass="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline"
                    className={inputClass}
                  />
                  <AuthInput
                    id="username" type="text" required placeholder="johndoe"
                    label="Username" icon="alternate_email"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    labelClass="text-sm font-medium text-on-surface-variant"
                    iconClass="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline"
                    className={inputClass}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2 relative">
                  <AuthInput
                    id="reg-password" type={showPwd ? 'text' : 'password'} required placeholder="••••••••"
                    label="Password" icon="lock"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    labelClass="text-sm font-medium text-on-surface-variant"
                    iconClass="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline"
                    className={`${inputClass} pr-12`}
                    containerClass=""
                    labelRight={
                      <span className={`text-xs font-semibold ${METER_COLORS[strength].textClass}`}>
                        {METER_COLORS[strength].label}
                      </span>
                    }
                    rightElement={
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">{showPwd ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    }
                  />
                  {/* Strength meter */}
                  <div className="h-1.5 w-full bg-surface-container rounded-full mt-2 overflow-hidden flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className={`h-full w-1/3 transition-all duration-500 ${
                          i < METER_COLORS[strength].bars ? METER_COLORS[strength].color : 'bg-outline/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Confirm Password */}
                <AuthInput
                  id="confirmPassword" type={showConfirm ? 'text' : 'password'} required placeholder="••••••••"
                  label="Confirm Password" icon="lock_reset"
                  value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  labelClass="text-sm font-medium text-on-surface-variant"
                  iconClass="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline"
                  className={`${inputClass} pr-24 ${passwordsMatch ? 'border-secondary' : 'border-outline-variant'}`}
                  rightElement={
                    <>
                      {passwordsMatch && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 text-secondary">
                          <span className="material-symbols-outlined">check_circle</span>
                        </div>
                      )}
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">{showConfirm ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </>
                  }
                />

                {/* Terms */}
                <div className="flex items-start gap-3 py-2">
                  <input
                    id="terms" type="checkbox" required
                    checked={form.terms}
                    onChange={e => setForm(f => ({ ...f, terms: e.target.checked }))}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all cursor-pointer mt-1"
                  />
                  <label className="text-xs font-semibold text-on-surface-variant leading-tight" htmlFor="terms">
                    I agree to the{' '}
                    <a href="#" className="text-primary hover:underline">Terms &amp; Conditions</a> and{' '}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                  </label>
                </div>

                {/* Submit */}
                <AuthButton
                  type="submit"
                  loading={loading}
                  loadingText="Processing..."
                  icon="arrow_forward"
                  className="ripple w-full py-5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-2xl shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  Create Account
                </AuthButton>
              </form>

              <p className="mt-8 text-center text-on-surface-variant text-sm font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Registration;
