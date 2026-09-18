'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  GraduationCap,
  ListTodo,
  UserCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { getStoredSession } from '@/lib/auth';
import { INITIAL_TASKS } from '@/lib/data/mockData';

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const session = getStoredSession();

  // Priya's tasks
  const myTasks = INITIAL_TASKS.slice(0, 3);
  const myWorkload = 45; // %
  const atRiskCount = myTasks.filter(
    (t) => new Date(t.sla_deadline).getTime() < Date.now() + 4 * 3600000
  ).length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {session.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Employee Portal · Manage assigned commitments, report availability, and track progress.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/employee/availability')}
            className="border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600 font-medium"
          >
            <CalendarDays className="w-4 h-4 mr-1.5" /> Mark Unavailable
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">My Workload</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{myWorkload}%</div>
            <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${myWorkload}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">18 of 40 weekly hours allocated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Tasks</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600">
              <ListTodo className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in flight</p>
          </CardContent>
        </Card>

        <Card className={atRiskCount > 0 ? 'border-red-200 dark:border-red-950/80 bg-red-50/20' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">SLA Watchlist</CardTitle>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${atRiskCount > 0 ? 'text-red-600' : ''}`}>
              {atRiskCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tasks due within 4 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Tasks List */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">My Assigned Tasks</CardTitle>
              <CardDescription className="text-xs">Active sprint deliverables assigned to you</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/employee/tasks')}
              className="text-xs"
            >
              View all <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {myTasks.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{t.title}</h4>
                  <Chip variant={t.priority === 'CRITICAL' ? 'critical' : 'high'}>
                    {t.priority}
                  </Chip>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDistanceToNow(new Date(t.sla_deadline), { addSuffix: true })}
                </span>
                <Button size="sm" variant="outline" onClick={() => router.push('/employee/tasks')}>
                  Update Progress
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start gap-1 text-left"
          onClick={() => router.push('/employee/availability')}
        >
          <div className="flex items-center gap-2 font-semibold text-sm">
            <CalendarDays className="w-4 h-4 text-amber-500" /> Mark Unavailable
          </div>
          <p className="text-xs text-muted-foreground">Submit planned leave or medical emergency</p>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start gap-1 text-left"
          onClick={() => router.push('/employee/profile')}
        >
          <div className="flex items-center gap-2 font-semibold text-sm">
            <GraduationCap className="w-4 h-4 text-primary" /> Update Skills
          </div>
          <p className="text-xs text-muted-foreground">Add new proficiencies and certifications</p>
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start gap-1 text-left"
          onClick={() => router.push('/employee/profile')}
        >
          <div className="flex items-center gap-2 font-semibold text-sm">
            <UserCheck className="w-4 h-4 text-emerald-500" /> View Profile
          </div>
          <p className="text-xs text-muted-foreground">Inspect workload, timezone, and rating</p>
        </Button>
      </div>
    </div>
  );
}
