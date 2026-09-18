'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ListTodo,
  AlertTriangle,
  Users,
  Inbox,
  PlusCircle,
  GitPullRequest,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  INITIAL_TASKS,
  INITIAL_EMPLOYEES,
  INITIAL_EVENTS,
  INITIAL_SKILL_GAPS,
} from '@/lib/data/mockData';
import { useUiStore } from '@/lib/store/ui';

export default function ManagerDashboardPage() {
  const router = useRouter();
  const openDrawerModal = useUiStore((s) => s.openDrawerModal);

  // Derived KPIs
  const activeTasks = INITIAL_TASKS.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS');
  const atRiskTasks = INITIAL_TASKS.filter(
    (t) => t.status !== 'COMPLETED' && new Date(t.sla_deadline).getTime() < Date.now() + 4 * 3600000
  );
  const overloadedEmployees = INITIAL_EMPLOYEES.filter((e) => e.current_workload_percent > 85);
  const unassignedTasks = INITIAL_TASKS.filter((t) => t.status === 'UNASSIGNED');

  // Workload Heatmap grouping by team
  const teams = Array.from(new Set(INITIAL_EMPLOYEES.map((e) => e.team)));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manager Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Real-time workforce intelligence, SLA risk surveillance, and autonomous reallocations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push('/manager/tasks/new')}
            className="shadow-sm shadow-primary/25 font-semibold"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" /> Create Task
          </Button>
        </div>
      </div>

      {/* Row 1: 4 KPI Cards (3 cols each) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Tasks */}
        <Card
          onClick={() => router.push('/manager/tasks?status=active')}
          className="cursor-pointer hover:border-primary/50 transition-all shadow-sm hover:shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Active Tasks</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600">
              <ListTodo className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress & assigned</p>
          </CardContent>
        </Card>

        {/* KPI 2: At-Risk SLAs */}
        <Card
          onClick={() => router.push('/manager/tasks?sla=at-risk')}
          className="cursor-pointer hover:border-destructive/60 transition-all shadow-sm hover:shadow border-red-200 dark:border-red-950/80 bg-red-50/20"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-red-700 dark:text-red-400">At-Risk SLAs</CardTitle>
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-600 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{atRiskTasks.length}</div>
            <p className="text-xs text-red-600/80 mt-1">Deadline &lt; 4 hours</p>
          </CardContent>
        </Card>

        {/* KPI 3: Overloaded People */}
        <Card
          onClick={() => router.push('/manager/employees?workload=high')}
          className="cursor-pointer hover:border-amber-500/60 transition-all shadow-sm hover:shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Overloaded People</CardTitle>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{overloadedEmployees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Workload &gt; 85% capacity</p>
          </CardContent>
        </Card>

        {/* KPI 4: Unassigned Tasks */}
        <Card
          onClick={() => router.push('/manager/tasks?status=unassigned')}
          className="cursor-pointer hover:border-primary/50 transition-all shadow-sm hover:shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Unassigned Tasks</CardTitle>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Inbox className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires allocation</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Live Event Feed (7 cols) | SLA Risk Watchlist (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Event Feed */}
        <Card className="lg:col-span-7 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Event Feed
                </CardTitle>
                <CardDescription className="text-xs">Realtime Supabase stream of workforce state mutations</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/manager/reallocations')}
                className="text-xs"
              >
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60 flex-1 overflow-y-auto max-h-96">
            {INITIAL_EVENTS.map((evt) => (
              <div
                key={evt.id}
                onClick={() => openDrawerModal('event-detail', { eventId: evt.id, event: evt })}
                className="p-3.5 hover:bg-muted/50 cursor-pointer transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-md bg-muted text-muted-foreground group-hover:text-primary">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {evt.type.replace(/_/g, ' ')}
                      </span>
                      <Chip variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                        {evt.id}
                      </Chip>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {evt.related_task ? `Target: ${evt.related_task}` : evt.missing_skill ? `Missing Skill: ${evt.missing_skill}` : 'Workforce reassignment'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(evt.timestamp), { addSuffix: true })}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SLA Risk Watchlist */}
        <Card className="lg:col-span-5 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  SLA Risk Watchlist
                </CardTitle>
                <CardDescription className="text-xs">Tasks nearing deadline expiration (&lt; 4h)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60 flex-1 overflow-y-auto max-h-96">
            {atRiskTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Zero tasks currently breaching SLA threshold.
              </div>
            ) : (
              atRiskTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => router.push(`/manager/tasks/${t.id}`)}
                  className="p-3.5 hover:bg-muted/50 cursor-pointer transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground truncate">{t.title}</span>
                    <Chip variant={t.priority === 'CRITICAL' ? 'critical' : 'high'}>
                      {t.priority}
                    </Chip>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono text-[11px]">#{t.id}</span>
                    <span className="flex items-center gap-1 font-bold text-red-600 dark:text-red-400">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(t.sla_deadline), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Workload Heatmap (7 cols) | AI Recommendations (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workload Heatmap */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold">Workload Heatmap by Team</CardTitle>
            <CardDescription className="text-xs">
              Color coding: Green &lt; 60% · Amber 60-85% · Red &gt; 85%
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <TooltipProvider>
              {teams.map((teamName) => {
                const teamMembers = INITIAL_EMPLOYEES.filter((e) => e.team === teamName);
                const avgLoad = Math.round(
                  teamMembers.reduce((acc, curr) => acc + curr.current_workload_percent, 0) / teamMembers.length
                );

                return (
                  <div key={teamName} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{teamName} Team</span>
                      <span className="text-muted-foreground font-mono">Avg {avgLoad}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {teamMembers.map((member) => {
                          const load = member.current_workload_percent;
                          const color =
                            load > 85
                              ? 'bg-red-500 hover:bg-red-600'
                              : load >= 60
                              ? 'bg-amber-500 hover:bg-amber-600'
                              : 'bg-emerald-500 hover:bg-emerald-600';

                          return (
                            <Tooltip key={member.id}>
                              <TooltipTrigger asChild>
                                <div
                                  onClick={() => router.push(`/manager/employees/${member.id}`)}
                                  className={`w-7 h-7 rounded-md cursor-pointer transition-transform hover:scale-110 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${color}`}
                                >
                                  {load}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <p className="font-bold">{member.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{member.role_title}</p>
                                  <p className="font-mono">Workload: {member.current_workload_percent}%</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="lg:col-span-5 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Hiring & Allocation Suggestions
                </CardTitle>
                <CardDescription className="text-xs">Identified skill shortages & rebalancing advice</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/manager/skill-gaps')}
                className="text-xs"
              >
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60 flex-1 overflow-y-auto max-h-96">
            {INITIAL_SKILL_GAPS.map((gap) => (
              <div key={gap.skill_name} className="p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-muted px-2 py-0.5 rounded">
                    {gap.skill_name}
                  </span>
                  <span className="text-xs font-semibold text-amber-600">
                    Priority #{gap.suggested_hiring_priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Failed allocation match {gap.times_failed} times across competing sprint tasks.
                </p>
                <div className="flex justify-end pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => router.push('/manager/skill-gaps')}
                  >
                    Investigate Gap
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Quick Actions */}
      <Card className="p-4 bg-muted/20 border-dashed">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Quick Actions</h3>
            <p className="text-xs text-muted-foreground">Rapid workforce controls and navigation shortcuts</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => router.push('/manager/tasks/new')}>
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Create Task
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push('/manager/reallocations')}>
              <GitPullRequest className="w-4 h-4 mr-1.5" />
              View Reallocations
            </Button>
            <Button size="sm" variant="outline" onClick={() => router.push('/manager/skill-gaps')}>
              <GraduationCap className="w-4 h-4 mr-1.5" />
              View Skill Gaps
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
