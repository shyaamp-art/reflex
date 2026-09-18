'use client';

import React, { useState } from 'react';
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
import { INITIAL_TASKS, INITIAL_EMPLOYEES } from '@/lib/data/mockData';
import { Chip } from '@/components/ui/chip';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';

export function TaskPickerDrawer() {
  const openDrawer = useUiStore((s) => s.openDrawer);
  const payload = useUiStore((s) => s.drawerPayload) as { employeeId?: string; onAllocate?: (taskId: string) => void } | undefined;
  const closeDrawer = useUiStore((s) => s.closeDrawer);

  const isOpen = openDrawer === 'task-picker';
  const employee = INITIAL_EMPLOYEES.find((e) => e.id === payload?.employeeId) || INITIAL_EMPLOYEES[0];

  const unassignedTasks = INITIAL_TASKS.filter((t) => t.status === 'UNASSIGNED');

  const handleAllocate = (taskId: string, taskTitle: string) => {
    payload?.onAllocate?.(taskId);
    toast.success(`Allocated ${employee?.name} to "${taskTitle}"`);
    closeDrawer();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <DrawerContent className="max-w-xl">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold">Assign Task to {employee?.name}</DrawerTitle>
          <DrawerDescription>
            Select an unassigned task from the backlog to allocate this engineer.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {unassignedTasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No unassigned tasks currently in backlog.
            </div>
          ) : (
            unassignedTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => handleAllocate(t.id, t.title)}
                className="border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{t.title}</h4>
                  <Chip variant={t.priority === 'CRITICAL' ? 'critical' : t.priority === 'HIGH' ? 'high' : 'medium'}>
                    {t.priority}
                  </Chip>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Effort: {t.estimated_effort}h</span>
                  <span>SLA: {formatDistanceToNow(new Date(t.sla_deadline), { addSuffix: true })}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <DrawerFooter className="border-t pt-4">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
