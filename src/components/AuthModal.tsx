import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  ShieldCheck,
  Building2,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  KeyRound
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
}

type LoginMode = 'citizen' | 'operator' | 'admin';

const MySonodMark: React.FC<{ className?: string }> = ({ className = 'h-10 w-10' }) => (
  <img src="/mysonod-logo.webp" alt="MySonod" className={className + ' object-contain'} />
);

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen }) => {
  const { login, loginAdmin, loginOperator, signup, loginWithGoogle } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [mode, setMode] = useState<LoginMode>('citizen');
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isAdminLogin = mode === 'admin';
  const isOperatorLogin = mode === 'operator';

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setIsSignUp(false);
    setError(null);
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isAdminLogin) {
        await loginAdmin(email, password);
      } else if (isOperatorLogin) {
        await loginOperator(email, password);
      } else if (isSignUp) {
        if (!name.trim()) throw new Error('দয়া করে আপনার পূর্ণ নাম লিখুন');
        if (password.length < 6) throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
        await signup(name, email, password, phone);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করে পুনরায় চেষ্টা করুন।';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        msg = 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'এই ইমেইল দিয়ে পূর্বেই একাউন্ট তৈরি করা আছে। অনুগ্রহ করে লগইন করুন।';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'পাসওয়ার্ড আরও শক্তিশালী করুন (কমপক্ষে ৬ অক্ষর)।';
      } else if (msg.includes('auth/operation-not-allowed')) {
        msg = 'Firebase কনসোলে Email/Password সাইন-ইন সক্রিয় করা নেই।';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const modeMeta = {
    citizen: {
      title: 'নাগরিক সেবা',
      subtitle: 'সনদ আবেদন, ট্র্যাকিং ও যাচাই',
      accent: 'emerald',
      icon: User,
      badge: 'Citizen Portal'
    },
    operator: {
      title: 'ইউনিয়ন উদ্যোক্তা',
      subtitle: 'আবেদন যাচাই, অনুমোদন ও সনদ ব্যবস্থাপনা',
      accent: 'amber',
      icon: Building2,
      badge: 'Operator Desk'
    },
    admin: {
      title: 'প্রধান প্রশাসক',
      subtitle: 'পূর্ণ প্রশাসনিক নিয়ন্ত্রণ ও সেটিংস',
      accent: 'violet',
      icon: ShieldCheck,
      badge: 'Admin Console'
    }
  } as const;

  const activeMeta = modeMeta[mode];
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_30px_100px_rgba(2,6,23,0.35)]">
        {/* Background glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl ms-auth-glow ms-auth-glow-one" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl ms-auth-glow ms-auth-glow-two" />

        <div className="relative grid min-h-[560px] lg:grid-cols-[0.92fr_1.08fr]">
          {/* Premium brand panel */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#063b2e] via-[#006a4e] to-[#0b7a59] p-8 text-white lg:flex lg:flex-col">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full border-[24px] border-white/20 ms-auth-orbit ms-auth-orbit-one" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full border-[28px] border-white/10 ms-auth-orbit ms-auth-orbit-two" />
              <div className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-white/10 ms-auth-orbit ms-auth-orbit-three" />
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur-sm ms-auth-logo-float">
                <MySonodMark className="h-10 w-10" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/80">
                  mysonod
                </div>
                <div className="text-lg font-bold">MySonod পোর্টাল</div>
              </div>
            </div>

            <div className="relative mt-auto mb-auto max-w-md py-10 ms-auth-content-reveal">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                ডিজিটাল ইউনিয়ন সেবা
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight ms-auth-headline">
                দ্রুত, নিরাপদ ও
                <span className="block text-emerald-200">আধুনিক সনদ ব্যবস্থাপনা</span>
              </h1>

              <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-50/80">
                নাগরিক আবেদন, উদ্যোক্তা অনুমোদন এবং সনদ ব্যবস্থাপনা—সবকিছু একটি আধুনিক প্ল্যাটফর্মে।
              </p>

              <div className="mt-7 space-y-3">
                {[
                  'ডিজিটাল আবেদন ও ট্র্যাকিং',
                  'উদ্যোক্তা অনুমোদন workflow',
                  'নিরাপদ প্রশাসনিক নিয়ন্ত্রণ'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/90">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-[11px] text-emerald-100/70">
              <span>mysonod • ডিজিটাল সনদ পোর্টাল</span>
              <span>মিরপুর, কুষ্টিয়া</span>
            </div>
          </div>

          {/* Auth panel */}
          <div className="relative overflow-y-auto bg-white/95 p-5 sm:p-6">
            <div className="mx-auto max-w-xl">
              <div className="lg:hidden mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#063b2e] to-[#006a4e] p-4 text-white shadow-lg">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <MySonodMark className="h-9 w-9" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/80">MYSONOD</div>
                  <div className="text-base font-bold">MySonod পোর্টাল</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {activeMeta.badge}
                  </span>
                  <span className="text-[11px] text-slate-400">Secure access</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {activeMeta.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{activeMeta.subtitle}</p>
              </div>

              {/* Role selector */}
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5">
                {(Object.keys(modeMeta) as LoginMode[]).map((item) => {
                  const meta = modeMeta[item];
                  const Icon = meta.icon;
                  const active = mode === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => switchMode(item)}
                      className={
                        'group rounded-xl px-2 py-3 text-center transition ' +
                        (active
                          ? 'bg-white shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-500 hover:bg-white/70 hover:text-slate-800')
                      }
                    >
                      <div className="flex items-center justify-center">
                        <Icon
                          className={
                            'h-4 w-4 ' +
                            (active
                              ? item === 'admin'
                                ? 'text-violet-600'
                                : item === 'operator'
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              : 'text-slate-400')
                          }
                        />
                      </div>
                      <div className="mt-1 text-[10px] font-bold sm:text-[11px]">{meta.title}</div>
                    </button>
                  );
                })}
              </div>

              {mode === 'citizen' && (
                <div className="mt-3 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(null); }}
                    className={
                      'flex-1 rounded-lg py-2 text-xs font-bold transition ' +
                      (!isSignUp ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800')
                    }
                  >
                    লগইন
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setError(null); }}
                    className={
                      'flex-1 rounded-lg py-2 text-xs font-bold transition ' +
                      (isSignUp ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800')
                    }
                  >
                    নতুন নিবন্ধন
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                {isSignUp && mode === 'citizen' && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">পূর্ণ নাম <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="আপনার পূর্ণ নাম"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700">মোবাইল নম্বর</label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">ইমেইল এড্রেস <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={mode === 'admin' ? 'admin@email.com' : 'আপনার ইমেইল এড্রেস'}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">পাসওয়ার্ড <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="আপনার পাসওয়ার্ড"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-2.5 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                      aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                    নিরাপদ সাইন-ইন
                  </div>
                  {mode !== 'citizen' && (
                    <span className="text-[11px] font-semibold text-slate-400">Authorized access only</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={
                    'group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 ' +
                    (isAdminLogin
                      ? 'bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-800 hover:to-indigo-800 shadow-violet-500/20'
                      : isOperatorLogin
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20'
                        : 'bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-800 hover:to-teal-700 shadow-emerald-500/20')
                  }
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                      <span>
                        {isAdminLogin
                          ? 'Admin প্যানেলে প্রবেশ করুন'
                          : isOperatorLogin
                            ? 'উদ্যোক্তা লগইন করুন'
                            : isSignUp
                              ? 'একাউন্ট তৈরি করুন'
                              : 'পোর্টালে প্রবেশ করুন'}
                      </span>
                      {!isSignUp && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                    </>
                  )}
                </button>
              </form>

              {mode === 'citizen' && !isSignUp && (
                <div className="mt-3">
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">or continue with</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:opacity-60"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68l3.88 3.05c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                    Google দিয়ে সরাসরি সাইন ইন
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                <span>কারিগরি সহায়তায়: ইউনিয়ন ডিজিটাল সেন্টার</span>
                <span>© 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
