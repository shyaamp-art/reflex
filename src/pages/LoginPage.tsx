import React, { useState } from 'react';
import { BriefcaseBusiness, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onLogin(username, password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <BriefcaseBusiness className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-slate-900">Sign in to Reflex</h1>
        <p className="mt-2 text-center text-sm text-slate-500">Use your Reflex username and password.</p>

        <label className="mt-6 block text-xs font-bold uppercase tracking-wider text-slate-700">Username</label>
        <div className="relative mt-1">
          <UserRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Email or full name"
            autoComplete="username"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-slate-700">Password</label>
        <div className="relative mt-1">
          <LockKeyhole className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            required
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-2.5 text-slate-400">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="mt-4 text-center text-[11px] text-slate-400">Passwords are verified by Supabase Auth.</p>
      </form>
    </div>
  );
};
