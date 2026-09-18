'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  User,
  LogOut,
  RefreshCw,
  CheckCircle2,
  ListTodo,
  Users,
  Code2,
  Menu,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationBell } from './NotificationBell';
import { getStoredSession, setStoredSession, DEMO_MANAGER, DEMO_EMPLOYEE } from '@/lib/auth';
import { useUiStore } from '@/lib/store/ui';
import { INITIAL_TASKS, INITIAL_EMPLOYEES, INITIAL_SKILLS } from '@/lib/data/mockData';
import { toast } from 'sonner';

export function TopBar() {
  const router = useRouter();
  const [session, setSession] = useState(getStoredSession());
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  useEffect(() => {
    setSession(getStoredSession());
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchRole = () => {
    const nextSession = session.role === 'MANAGER' ? DEMO_EMPLOYEE : DEMO_MANAGER;
    setStoredSession(nextSession);
    setSession(nextSession);
    toast.success(`Switched role to ${nextSession.role}`);
    if (nextSession.role === 'MANAGER') {
      router.push('/manager/dashboard');
    } else {
      router.push('/employee/dashboard');
    }
  };

  const handleLogout = () => {
    setStoredSession(null);
    toast.info('Signed out successfully');
    router.push('/login');
  };

  // Grouped search results
  const q = query.trim().toLowerCase();
  const matchingTasks = q
    ? INITIAL_TASKS.filter(
        (t) => t.title.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q))
      ).slice(0, 3)
    : [];
  const matchingEmployees = q
    ? INITIAL_EMPLOYEES.filter(
        (e) => e.name.toLowerCase().includes(q) || e.team.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];
  const matchingSkills = q
    ? INITIAL_SKILLS.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const hasResults = matchingTasks.length > 0 || matchingEmployees.length > 0 || matchingSkills.length > 0;

  return (
    <header className="h-14 border-b border-border/60 bg-card/95 backdrop-blur-md px-4 flex items-center justify-between gap-4 z-40 sticky top-0">
      {/* Left: Brand & Sidebar toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground md:flex"
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div
          onClick={() => router.push(session.role === 'MANAGER' ? '/manager/dashboard' : '/employee/dashboard')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-sm tracking-tight text-foreground">AI-04 Workforce</span>
            <span className="text-[10px] text-muted-foreground block -mt-1 font-mono">Resource Allocator</span>
          </div>
        </div>
      </div>

      {/* Center: Global Search with Debounced Dropdown */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search tasks, employees, skills... (300ms)"
            className="pl-9 h-9 text-xs bg-muted/40 border-border/70 focus-visible:ring-1"
          />
        </div>

        {isOpen && query.trim().length > 0 && (
          <div className="absolute top-10 left-0 right-0 bg-popover text-popover-foreground border border-border shadow-xl rounded-lg overflow-hidden z-50 divide-y divide-border/60">
            {!hasResults ? (
              <div className="p-4 text-xs text-center text-muted-foreground">
                No matching tasks, employees, or skills found.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto p-1.5 space-y-2">
                {matchingTasks.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                      <ListTodo className="w-3 h-3 text-primary" /> Tasks
                    </div>
                    {matchingTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/manager/tasks/${t.id}`);
                        }}
                        className="px-2.5 py-1.5 text-xs hover:bg-accent rounded-md cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-medium truncate mr-2">{t.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{t.priority}</span>
                      </div>
                    ))}
                  </div>
                )}

                {matchingEmployees.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-emerald-500" /> Employees
                    </div>
                    {matchingEmployees.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/manager/employees/${e.id}`);
                        }}
                        className="px-2.5 py-1.5 text-xs hover:bg-accent rounded-md cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-medium">{e.name}</span>
                        <span className="text-[10px] text-muted-foreground">{e.team}</span>
                      </div>
                    ))}
                  </div>
                )}

                {matchingSkills.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                      <Code2 className="w-3 h-3 text-purple-500" /> Skills
                    </div>
                    {matchingSkills.map((s) => (
                      <div
                        key={s.name}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/manager/skill-gaps`);
                        }}
                        className="px-2.5 py-1.5 text-xs hover:bg-accent rounded-md cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-mono text-[11px]">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground">Directory</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Notifications, Role Badge, Avatar dropdown */}
      <div className="flex items-center gap-2">
        <NotificationBell />

        {/* Role Badge */}
        <div className="hidden sm:flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase border bg-primary/10 text-primary border-primary/20">
          {session.role}
        </div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full border border-border p-0 hover:ring-2 hover:ring-primary/40"
              aria-label="User profile menu"
            >
              <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {session.name ? session.name.charAt(0) : 'U'}
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 shadow-lg">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{session.name}</p>
                <p className="text-xs text-muted-foreground leading-none">{session.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push(session.role === 'MANAGER' ? '/manager/settings' : '/employee/profile')}
              className="cursor-pointer text-xs"
            >
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Profile & Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleSwitchRole} className="cursor-pointer text-xs">
              <RefreshCw className="mr-2 h-4 w-4 text-amber-500" />
              <span>Switch Role (Demo: {session.role === 'MANAGER' ? 'Employee' : 'Manager'})</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-xs text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
