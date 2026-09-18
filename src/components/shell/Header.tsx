import React, { useState, useEffect } from 'react';
import { UserSession, AppEvent } from '../../types/index.js';
import { api } from '../../lib/api.js';
import {
  ShieldAlert,
  Bell,
  Cpu,
  RefreshCw,
  Clock,
  UserCheck,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserSession;
  onUserSwitch: (userId: string) => void;
  onNewTaskClick: () => void;
  pendingReallocationsCount: number;
  atRiskCount: number;
  onNavigate: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserSwitch,
  onNewTaskClick,
  pendingReallocationsCount,
  atRiskCount,
  onNavigate,
}) => {
  const [availableUsers, setAvailableUsers] = useState<UserSession[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentEvents, setRecentEvents] = useState<AppEvent[]>([]);
  const [isScanningSla, setIsScanningSla] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getUsers().then((res) => setAvailableUsers(res.users)).catch(console.error);
    api.getEvents({ limit: 6 }).then((res) => setRecentEvents(res.items)).catch(console.error);
  }, []);

  const handleRunSlaCron = async () => {
    try {
      setIsScanningSla(true);
      const res = await api.runSlaCron();
      setScanMessage(`Scan complete: ${res.escalated_count} escalated, ${res.proposals_created} proposals created`);
      setTimeout(() => setScanMessage(null), 4000);
      const evts = await api.getEvents({ limit: 6 });
      setRecentEvents(evts.items);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsScanningSla(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:px-8">
      {/* Brand & Identity */}
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-700 shadow-sm text-white font-bold">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold tracking-tight text-slate-900 text-lg">REFLEX</span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
              AI-04 Decision Agent
            </span>
          </div>
          <p className="hidden text-xs text-slate-500 sm:block">
            Dynamic Resource Allocation & Workforce Intelligence
          </p>
        </div>
      </div>

      {/* Operational Highlights & Actions */}
      <div className="flex items-center space-x-3">
        {/* SLA Risk Counter */}
        {atRiskCount > 0 && (
          <button
            onClick={() => onNavigate('tasks')}
            className="flex items-center space-x-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
            title="Tasks with SLA deadlines within 4 hours"
          >
            <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
            <span>{atRiskCount} SLA At Risk</span>
          </button>
        )}

        {/* Pending Reallocations Badge */}
        {pendingReallocationsCount > 0 && (
          <button
            onClick={() => onNavigate('reallocations')}
            className="flex items-center space-x-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            <Zap className="h-4 w-4 text-indigo-600" />
            <span>{pendingReallocationsCount} Reallocations Queue</span>
          </button>
        )}

        {/* SLA Background Worker Trigger */}
        <button
          onClick={handleRunSlaCron}
          disabled={isScanningSla}
          className="hidden md:flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
          title="Run background SLA lookahead scan (15m cron simulation)"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isScanningSla ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>{isScanningSla ? 'Scanning...' : 'SLA Scan'}</span>
        </button>

        {scanMessage && (
          <div className="absolute top-18 right-8 z-50 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg animate-fade-in">
            {scanMessage}
          </div>
        )}

        {/* New Task Button (for manager) */}
        {currentUser.role === 'MANAGER' && (
          <button
            onClick={onNewTaskClick}
            className="flex items-center space-x-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            <span>New Task</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            title="Operational Events Stream"
          >
            <Bell className="h-4 w-4" />
            {recentEvents.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live System Events</span>
                <span className="text-[10px] text-slate-400">Auto-Refreshed</span>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {recentEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No recent events</p>
                ) : (
                  recentEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-xs hover:bg-slate-100 transition cursor-pointer"
                      onClick={() => {
                        setNotificationsOpen(false);
                        if (ev.type === 'SLA_RISK' || ev.type === 'PERSON_UNAVAILABLE') {
                          onNavigate('reallocations');
                        } else {
                          onNavigate('tasks');
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${
                          ev.type === 'SLA_RISK' ? 'text-amber-700' :
                          ev.type === 'PERSON_UNAVAILABLE' ? 'text-rose-700' : 'text-indigo-700'
                        }`}>
                          {ev.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">
                        {ev.payload?.title || ev.payload?.task_title || ev.payload?.reason || JSON.stringify(ev.payload)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role & Persona Switcher */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center space-x-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-left hover:bg-slate-100 transition"
          >
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-300"
            />
            <div className="hidden sm:block text-xs">
              <p className="font-semibold text-slate-900 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wide">
                {currentUser.role}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch Demo Persona</p>
                <p className="text-xs text-slate-500">Test Manager vs Employee Workflows</p>
              </div>
              <div className="space-y-1">
                {availableUsers.map((u) => (
                  <button
                    key={u.authUserId}
                    onClick={() => {
                      onUserSwitch(u.authUserId);
                      setUserDropdownOpen(false);
                    }}
                    className={`flex w-full items-center space-x-2.5 rounded-lg px-2 py-1.5 text-xs text-left transition ${
                      currentUser.authUserId === u.authUserId
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <img src={u.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">
                        {u.role === 'MANAGER' ? 'Director of Eng' : 'Software Engineer'}
                      </p>
                    </div>
                    {currentUser.authUserId === u.authUserId && (
                      <UserCheck className="h-4 w-4 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
