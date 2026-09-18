import React, { useState } from 'react';
import { BriefcaseBusiness, ShieldCheck, UserRound } from 'lucide-react';
import { UserSession } from '../types/index.js';

interface LoginPageProps {
  users: UserSession[];
  onLogin: (userId: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ users, onLogin }) => {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.authUserId || '');

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <BriefcaseBusiness className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-slate-900">Sign in to Reflex</h1>
        <p className="mt-2 text-center text-sm text-slate-500">Choose your workspace to continue.</p>

        <div className="mt-6 space-y-3">
          {users.map((user) => {
            const selected = selectedUserId === user.authUserId;
            const Icon = user.role === 'MANAGER' ? ShieldCheck : UserRound;
            return (
              <button
                key={user.authUserId}
                type="button"
                onClick={() => setSelectedUserId(user.authUserId)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  selected ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{user.name}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{user.role}</span>
                </span>
                <Icon className={`h-4 w-4 ${selected ? 'text-indigo-600' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!selectedUserId}
          onClick={() => onLogin(selectedUserId)}
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
        <p className="mt-4 text-center text-[11px] text-slate-400">Demo authentication is backed by the configured user directory.</p>
      </div>
    </div>
  );
};
