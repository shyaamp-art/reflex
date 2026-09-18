'use client';

import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/lib/store/ui';
import { AllocationLog } from '@/lib/types';
import { INITIAL_ALLOCATION_LOGS } from '@/lib/data/mockData';
import { format } from 'date-fns';
import { Code, History, ShieldAlert } from 'lucide-react';

export function LogDetailDrawer() {
  const openDrawer = useUiStore((s) => s.openDrawer);
  const payload = useUiStore((s) => s.drawerPayload) as { logId?: string; log?: AllocationLog } | undefined;
  const closeDrawer = useUiStore((s) => s.closeDrawer);

  const isOpen = openDrawer === 'log-detail';
  const log = payload?.log || INITIAL_ALLOCATION_LOGS.find((l) => l.id === payload?.logId) || INITIAL_ALLOCATION_LOGS[0];

  if (!log) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <DrawerContent className="max-w-xl">
        <DrawerHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-blue-100 text-blue-800 text-xs font-bold">
              {log.action}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              #{log.id}
            </span>
          </div>
          <DrawerTitle className="text-xl font-bold">Audit Trail Snapshot</DrawerTitle>
          <DrawerDescription>
            Recorded {format(new Date(log.created_at), 'PPpp')} · Triggered by {log.triggered_by}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-4 text-sm overflow-y-auto max-h-[70vh]">
          {/* Reason */}
          <div className="rounded-lg border p-3.5 bg-muted/30 space-y-1">
            <h4 className="font-semibold text-xs uppercase text-muted-foreground">Action Reason</h4>
            <p className="text-xs text-foreground font-medium leading-relaxed">{log.reason}</p>
          </div>

          {/* Before State */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <History className="w-3.5 h-3.5 text-amber-500" />
              <span>Before State</span>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto border">
              {JSON.stringify(log.before_state || { status: 'UNASSIGNED', assignee: null }, null, 2)}
            </pre>
          </div>

          {/* After State */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Code className="w-3.5 h-3.5 text-emerald-500" />
              <span>After State</span>
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto border">
              {JSON.stringify(log.after_state || { status: 'ASSIGNED', assignee: log.new_employee_id }, null, 2)}
            </pre>
          </div>
        </div>

        <DrawerFooter className="border-t pt-4">
          <DrawerClose asChild>
            <Button variant="outline">Close Audit Log</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
