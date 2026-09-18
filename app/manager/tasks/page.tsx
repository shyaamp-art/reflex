'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Kanban,
  Table as TableIcon,
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Chip } from '@/components/ui/chip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { INITIAL_TASKS, INITIAL_EMPLOYEES } from '@/lib/data/mockData';
import { Task, TaskStatus } from '@/lib/types';
import { useUiStore } from '@/lib/store/ui';
import { toast } from 'sonner';

export default function TasksPage() {
  const router = useRouter();
  const openDrawerModal = useUiStore((s) => s.openDrawerModal);

  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchPriority && matchStatus;
  });

  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t))
    );
    toast.success(`Task status updated to ${newStatus}`);
  };

  const handleDeleteTask = (task: Task) => {
    openDrawerModal('confirm', {
      title: 'Delete Task',
      description: `Are you sure you want to delete "${task.title}"? This cannot be undone.`,
      tone: 'destructive',
      confirmLabel: 'Delete Task',
      onConfirm: () => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        toast.success(`Deleted task #${task.id}`);
      },
    });
  };

  const columns: { key: TaskStatus; label: string }[] = [
    { key: 'UNASSIGNED', label: 'Unassigned' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'ON_HOLD', label: 'On Hold' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Task Board & Registry</h1>
          <p className="text-sm text-muted-foreground">
            Manage sprint tasks, track SLA deadlines, and inspect staffing allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="border rounded-lg p-0.5 flex bg-muted/30">
            <Button
              variant={viewMode === 'TABLE' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('TABLE')}
              className="h-8 text-xs font-semibold"
            >
              <TableIcon className="w-3.5 h-3.5 mr-1.5" /> Table
            </Button>
            <Button
              variant={viewMode === 'KANBAN' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('KANBAN')}
              className="h-8 text-xs font-semibold"
            >
              <Kanban className="w-3.5 h-3.5 mr-1.5" /> Kanban
            </Button>
          </div>

          <Button onClick={() => router.push('/manager/tasks/new')} className="shadow-sm">
            <PlusCircle className="w-4 h-4 mr-1.5" /> Create Task
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-card p-4 rounded-xl border">
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, tags (e.g. stripe)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="sm:col-span-3">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="CRITICAL">CRITICAL</SelectItem>
              <SelectItem value="HIGH">HIGH</SelectItem>
              <SelectItem value="MEDIUM">MEDIUM</SelectItem>
              <SelectItem value="LOW">LOW</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'TABLE' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs font-bold uppercase text-muted-foreground border-b">
                <tr>
                  <th className="p-3.5">Task ID</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">SLA / Deadline</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Effort</th>
                  <th className="p-3.5">Tags</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTasks.map((t) => {
                  const isSlaRisk =
                    t.status !== 'COMPLETED' && new Date(t.sla_deadline).getTime() < Date.now() + 4 * 3600000;

                  return (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-mono text-xs font-semibold text-muted-foreground">
                        #{t.id}
                      </td>
                      <td className="p-3.5">
                        <div
                          onClick={() => router.push(`/manager/tasks/${t.id}`)}
                          className="font-semibold text-foreground hover:text-primary cursor-pointer max-w-xs truncate"
                        >
                          {t.title}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <Chip
                          variant={
                            t.priority === 'CRITICAL'
                              ? 'critical'
                              : t.priority === 'HIGH'
                              ? 'high'
                              : t.priority === 'MEDIUM'
                              ? 'medium'
                              : 'low'
                          }
                        >
                          {t.priority}
                        </Chip>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-xs flex items-center gap-1 font-mono font-medium ${
                            isSlaRisk ? 'text-red-600 dark:text-red-400 font-bold' : 'text-muted-foreground'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {formatDistanceToNow(new Date(t.sla_deadline), { addSuffix: true })}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <Chip
                          variant={
                            t.status === 'UNASSIGNED'
                              ? 'unassigned'
                              : t.status === 'ASSIGNED'
                              ? 'assigned'
                              : t.status === 'IN_PROGRESS'
                              ? 'in_progress'
                              : t.status === 'ON_HOLD'
                              ? 'on_hold'
                              : 'completed'
                          }
                        >
                          {t.status.replace(/_/g, ' ')}
                        </Chip>
                      </td>
                      <td className="p-3.5 text-xs text-muted-foreground font-mono">
                        {t.estimated_effort}h
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {t.tags.map((tag) => (
                            <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/manager/tasks/${t.id}`)}>
                              View Deep Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}>
                              Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}>
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(t.id, 'ON_HOLD')}>
                              Hold Task
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteTask(t)}
                              className="text-destructive focus:text-destructive"
                            >
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="bg-muted/30 p-3 rounded-xl border space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground">{col.label}</h3>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono font-bold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colTasks.map((t) => (
                    <Card
                      key={t.id}
                      onClick={() => router.push(`/manager/tasks/${t.id}`)}
                      className="p-3.5 hover:border-primary/50 cursor-pointer shadow-sm hover:shadow transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground font-semibold">#{t.id}</span>
                        <Chip
                          variant={
                            t.priority === 'CRITICAL'
                              ? 'critical'
                              : t.priority === 'HIGH'
                              ? 'high'
                              : 'medium'
                          }
                          className="text-[10px] py-0 px-1.5"
                        >
                          {t.priority}
                        </Chip>
                      </div>

                      <h4 className="font-semibold text-xs leading-snug line-clamp-2 text-foreground">
                        {t.title}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        <span className="font-mono">{t.estimated_effort}h</span>
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(t.sla_deadline), { addSuffix: true })}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
