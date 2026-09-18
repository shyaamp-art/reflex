'use client';

import React, { useState } from 'react';
import {
  KanbanSquare,
  Clock,
  CheckCircle2,
  PlayCircle,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { INITIAL_TASKS } from '@/lib/data/mockData';
import { Task, TaskStatus } from '@/lib/types';
import { toast } from 'sonner';

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS.slice(0, 4));

  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    toast.success(`Deliverable status marked as ${newStatus}`);
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Assigned Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Deliverables assigned to you. Track SLA countdowns and update delivery progress.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-bold uppercase text-muted-foreground border-b">
              <tr>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">SLA / Deadline</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Role Note</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3.5 font-semibold text-foreground max-w-xs truncate">
                    {t.title}
                  </td>
                  <td className="p-3.5">
                    <Chip variant={t.priority === 'CRITICAL' ? 'critical' : 'high'}>
                      {t.priority}
                    </Chip>
                  </td>
                  <td className="p-3.5 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(t.sla_deadline), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <Chip variant={t.status === 'COMPLETED' ? 'completed' : 'in_progress'}>
                      {t.status.replace(/_/g, ' ')}
                    </Chip>
                  </td>
                  <td className="p-3.5 text-xs text-muted-foreground">
                    Backend Lead / Payments
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    {t.status !== 'IN_PROGRESS' && t.status !== 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8"
                        onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                      >
                        <PlayCircle className="w-3.5 h-3.5 mr-1 text-primary" /> Start
                      </Button>
                    )}
                    {t.status !== 'COMPLETED' && (
                      <Button
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Done
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
