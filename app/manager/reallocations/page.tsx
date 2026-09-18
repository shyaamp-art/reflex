'use client';

import React, { useState } from 'react';
import {
  GitPullRequest,
  ArrowRight,
  Check,
  SlidersHorizontal,
  Sparkles,
  AlertTriangle,
  UserMinus,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INITIAL_EVENTS } from '@/lib/data/mockData';
import { useUiStore } from '@/lib/store/ui';
import { toast } from 'sonner';

export default function ReallocationCenterPage() {
  const openDrawerModal = useUiStore((s) => s.openDrawerModal);
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');

  const filteredEvents = INITIAL_EVENTS.filter((e) =>
    eventTypeFilter === 'ALL' ? true : e.type === eventTypeFilter
  );

  const handleApprove = (eventId: string) => {
    toast.success(`Autonomous reallocation proposal approved for event #${eventId}`);
  };

  const handleOverride = (taskTarget?: string) => {
    openDrawerModal('manual-picker', { taskId: taskTarget });
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Reallocation Center</h1>
        <p className="text-sm text-muted-foreground">
          Autonomous event surveillance, before-and-after reallocation proposals, and manual overrides.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (col-span-4): Filters */}
        <Card className="lg:col-span-4 h-fit">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Event Type</label>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Event Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Event Types</SelectItem>
                  <SelectItem value="PERSON_UNAVAILABLE">PERSON_UNAVAILABLE</SelectItem>
                  <SelectItem value="SLA_RISK">SLA_RISK</SelectItem>
                  <SelectItem value="SKILL_GAP">SKILL_GAP</SelectItem>
                  <SelectItem value="NEW_TASK">NEW_TASK</SelectItem>
                  <SelectItem value="PRIORITY_CHANGE">PRIORITY_CHANGE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Triggered By</label>
              <Select defaultValue="ALL">
                <SelectTrigger>
                  <SelectValue placeholder="All Triggers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Triggers</SelectItem>
                  <SelectItem value="AI">AI Agent</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Right Column (col-span-8): Event Feed with Before/After Diff */}
        <div className="lg:col-span-8 space-y-4">
          {filteredEvents.map((evt) => (
            <Card key={evt.id} className="p-5 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold">
                    {evt.type}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground font-semibold">#{evt.id}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(evt.timestamp), { addSuffix: true })}
                </span>
              </div>

              {/* Summary */}
              <p className="text-xs text-foreground font-medium">
                {evt.type === 'PERSON_UNAVAILABLE'
                  ? 'Priya Sharma reported unavailable for 2 days due to medical leave. Automatic cascade reallocation triggered.'
                  : evt.type === 'SLA_RISK'
                  ? 'Task deadline is under 2 hours with pending confirmation. Priority escalated to CRITICAL.'
                  : `Workforce system state mutation: ${evt.type}`}
              </p>

              {/* Before -> After Diff per Spec Rule 7 */}
              <div className="p-3.5 bg-muted/40 rounded-xl border space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Reallocation Differential (Before → After)
                </span>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Before</span>
                    <p className="text-sm font-semibold text-destructive">Priya Sharma</p>
                    <span className="text-xs text-muted-foreground">Status: UNAVAILABLE</span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-muted-foreground" />

                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Proposed</span>
                    <p className="text-sm font-semibold text-emerald-600">Vikram Malhotra</p>
                    <span className="text-xs text-muted-foreground">Score: 92/100 · 30% Load</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOverride(evt.related_task)}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" /> Override
                </Button>
                <Button size="sm" onClick={() => handleApprove(evt.id)}>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Approve Reallocation
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
