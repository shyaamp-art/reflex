'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle,
  PauseCircle,
  Trash2,
  Edit,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  User,
  RotateCcw,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { INITIAL_TASKS, INITIAL_EMPLOYEES, INITIAL_ALLOCATION_LOGS, INITIAL_EVENTS } from '@/lib/data/mockData';
import { useUiStore } from '@/lib/store/ui';
import { toast } from 'sonner';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const openDrawerModal = useUiStore((s) => s.openDrawerModal);

  const taskId = (params?.id as string) || 'task-sla-01';
  const task = INITIAL_TASKS.find((t) => t.id === taskId) || INITIAL_TASKS[0];

  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);

  const handleMarkComplete = () => {
    setStatus('COMPLETED');
    toast.success('Task marked as COMPLETED');
  };

  const handleHold = () => {
    setStatus('ON_HOLD');
    toast.info('Task marked as ON_HOLD');
  };

  const handleDelete = () => {
    openDrawerModal('confirm', {
      title: 'Delete Task',
      description: `Permanently delete task "${task.title}"?`,
      tone: 'destructive',
      confirmLabel: 'Delete Permanently',
      onConfirm: () => {
        toast.success('Task deleted');
        router.push('/manager/tasks');
      },
    });
  };

  const handleReleaseEmployee = (empName: string) => {
    openDrawerModal('confirm', {
      title: 'Release Assignee',
      description: `Are you sure you want to release ${empName} from this task? This will trigger an automatic reallocation event.`,
      tone: 'destructive',
      confirmLabel: 'Release Employee',
      onConfirm: () => {
        toast.success(`Released ${empName}. Reallocation event fired.`);
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      {/* SECTION A: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground font-semibold">#{task.id}</span>
            <Chip
              variant={
                priority === 'CRITICAL'
                  ? 'critical'
                  : priority === 'HIGH'
                  ? 'high'
                  : priority === 'MEDIUM'
                  ? 'medium'
                  : 'low'
              }
            >
              {priority}
            </Chip>
            <Chip
              variant={
                status === 'UNASSIGNED'
                  ? 'unassigned'
                  : status === 'ASSIGNED'
                  ? 'assigned'
                  : status === 'IN_PROGRESS'
                  ? 'in_progress'
                  : status === 'ON_HOLD'
                  ? 'on_hold'
                  : 'completed'
              }
            >
              {status.replace(/_/g, ' ')}
            </Chip>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{task.title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleHold}>
            <PauseCircle className="w-4 h-4 mr-1.5" /> Hold
          </Button>
          <Button size="sm" variant="outline" onClick={handleMarkComplete}>
            <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-600" /> Complete
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete} className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* SLA & Time Countdown Banner */}
      <div className="p-4 rounded-xl border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-red-500" />
          <div>
            <span className="text-xs text-muted-foreground block">Hard SLA Deadline</span>
            <span className="text-sm font-semibold font-mono text-foreground">
              {format(new Date(task.sla_deadline), 'PPpp')} (
              {formatDistanceToNow(new Date(task.sla_deadline), { addSuffix: true })})
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground block">Estimated Effort</span>
          <span className="font-mono font-bold text-sm">{task.estimated_effort} hours</span>
        </div>
      </div>

      {/* SECTION B: Description */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Description & Acceptance Criteria</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {task.description || 'No extended description provided.'}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-3">
            {task.tags.map((t) => (
              <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                #{t}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SECTION C: Skill Requirements */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Required Skill Cart</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="divide-y divide-border/60 text-sm">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold font-mono">node.js</span>
                <span className="text-xs text-muted-foreground block">1 engineer required</span>
              </div>
              <div className="flex items-center gap-2">
                <Chip variant="critical">MUST_HAVE</Chip>
                <Chip variant="outline">EXPERT</Chip>
              </div>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-semibold font-mono">stripe</span>
                <span className="text-xs text-muted-foreground block">1 engineer required</span>
              </div>
              <div className="flex items-center gap-2">
                <Chip variant="critical">MUST_HAVE</Chip>
                <Chip variant="outline">EXPERT</Chip>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION D: Current Allocations */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Active Staffing Allocations</CardTitle>
          <CardDescription className="text-xs">Engineers currently assigned to deliver this task</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="p-3.5 border rounded-xl bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                V
              </div>
              <div>
                <h4 className="font-semibold text-sm">Vikram Malhotra</h4>
                <p className="text-xs text-muted-foreground">Staff Platform Engineer · Backend Team</p>
                <span className="text-[11px] font-mono text-primary bg-primary/10 px-1.5 py-0.2 rounded mt-1 inline-block">
                  Allocated by AI · Score 92/100
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openDrawerModal('manual-picker', { taskId: task.id })}
              >
                Reallocate
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleReleaseEmployee('Vikram Malhotra')}
              >
                Release
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION E: Allocation History Timeline */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Allocation Audit History</CardTitle>
          <CardDescription className="text-xs">Immutable trail of state changes and reallocations</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {INITIAL_ALLOCATION_LOGS.map((log) => (
            <div
              key={log.id}
              onClick={() => openDrawerModal('log-detail', { logId: log.id, log })}
              className="p-3 rounded-lg border hover:bg-muted/40 cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold font-mono text-primary">[{log.action}]</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-foreground">{log.reason}</p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>Triggered by: {log.triggered_by}</span>
                <span className="text-primary font-medium">View JSON Snapshot →</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SECTION G: Reasoning Panel */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" /> AI Allocation Rationale
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
          "Vikram Malhotra selected over top-ranked Arjun Mehta because Arjun is at 92% workload with 2 active critical tasks, risking SLA breach. Vikram possesses matching Node.js (Expert) and Stripe (Expert) skills with 70% available capacity."
        </CardContent>
      </Card>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t p-3 z-40 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/manager/tasks')}>
            Back to Board
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => openDrawerModal('manual-picker', { taskId: task.id })}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Reallocate
            </Button>
            <Button
              onClick={() => {
                setPriority(priority === 'CRITICAL' ? 'HIGH' : 'CRITICAL');
                toast.success('Priority escalated');
              }}
            >
              Change Priority
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
