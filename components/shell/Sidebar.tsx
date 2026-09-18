'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  KanbanSquare,
  Users,
  GitPullRequest,
  GraduationCap,
  ShieldCheck,
  Settings,
  CalendarDays,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/lib/store/ui';
import { getStoredSession } from '@/lib/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MANAGER_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
  { label: 'Create Task', href: '/manager/tasks/new', icon: PlusCircle },
  { label: 'Task Board', href: '/manager/tasks', icon: KanbanSquare },
  { label: 'Employees', href: '/manager/employees', icon: Users },
  { label: 'Reallocation Center', href: '/manager/reallocations', icon: GitPullRequest },
  { label: 'Skill Gaps', href: '/manager/skill-gaps', icon: GraduationCap },
  { label: 'Audit Logs', href: '/manager/audit', icon: ShieldCheck },
  { label: 'Settings', href: '/manager/settings', icon: Settings },
];

const EMPLOYEE_ITEMS: NavItem[] = [
  { label: 'My Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
  { label: 'My Tasks', href: '/employee/tasks', icon: KanbanSquare },
  { label: 'My Availability', href: '/employee/availability', icon: CalendarDays },
  { label: 'My Profile', href: '/employee/profile', icon: UserCheck },
];

export function Sidebar({ role }: { role?: 'MANAGER' | 'EMPLOYEE' }) {
  const pathname = usePathname();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  // Fallback to stored session role if not explicitly passed
  const currentRole = role || getStoredSession().role;
  const items = currentRole === 'MANAGER' ? MANAGER_ITEMS : EMPLOYEE_ITEMS;

  return (
    <aside
      className={cn(
        'border-r border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-300 flex flex-col justify-between select-none relative',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Navigation list */}
      <div className="p-3 space-y-1">
        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          {!sidebarCollapsed ? (currentRole === 'MANAGER' ? 'Manager Command' : 'Employee Portal') : 'Menu'}
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = Boolean(
              pathname &&
                (pathname === item.href ||
                  (item.href !== '/manager/tasks' && pathname.startsWith(item.href + '/')))
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Collapse trigger */}
      <div className="p-3 border-t border-border/60 flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="text-[11px] text-muted-foreground truncate">
            {currentRole === 'MANAGER' ? 'Manager Mode' : 'Employee Mode'}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-7 w-7 text-muted-foreground hover:text-foreground mx-auto"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
}
