import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  Repeat,
  AlertTriangle,
  History,
  Sliders,
  CalendarCheck,
  User,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Role } from '../../types/index.js';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: Role;
  pendingReallocationsCount: number;
  atRiskTasksCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  pendingReallocationsCount,
  atRiskTasksCount,
}) => {
  const managerNav: NavItem[] = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks & Schedular', icon: CheckSquare, badge: atRiskTasksCount > 0 ? `${atRiskTasksCount}` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'reallocations', label: 'Reallocations Hub', icon: Repeat, badge: pendingReallocationsCount > 0 ? `${pendingReallocationsCount}` : undefined, badgeColor: 'bg-indigo-100 text-indigo-800' },
    { id: 'employees', label: 'Engineering Pool', icon: Users },
    { id: 'skill-gaps', label: 'Skill Gap Intelligence', icon: AlertTriangle },
    { id: 'audit', label: 'Decision Audit Trail', icon: History },
    { id: 'settings', label: 'Agent Policy & Config', icon: Sliders },
  ];

  const employeeNav: NavItem[] = [
    { id: 'my-dashboard', label: 'My Workspace', icon: LayoutDashboard },
    { id: 'my-tasks', label: 'Assigned Work', icon: CheckSquare },
    { id: 'availability', label: 'Leave & Availability', icon: CalendarCheck },
    { id: 'profile', label: 'Skills & Profile', icon: User },
  ];

  const navItems: NavItem[] = userRole === 'MANAGER' ? managerNav : employeeNav;

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {userRole === 'MANAGER' ? 'Operational Management' : 'Engineer Portal'}
          </p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-indigo-700 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Reflex System Status Card */}
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-slate-50 p-3.5 text-xs">
          <div className="flex items-center space-x-2 text-indigo-900 font-semibold mb-1.5">
            <Zap className="h-4 w-4 text-indigo-600" />
            <span>Deterministic Scoring</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Multi-factor engine evaluates 100% hard constraints before weighting Skill Match, Availability, Workload, SLA Buffer, and Location.
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-indigo-100/60">
            <span>Model: gemini-3.8-flash</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-400 text-center">
        Reflex Decision Engine &bull; AI-04 Spec
      </div>
    </aside>
  );
};
