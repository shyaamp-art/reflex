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
import { AppEvent } from '@/lib/types';
import { INITIAL_EVENTS } from '@/lib/data/mockData';
import { formatDistanceToNow, format } from 'date-fns';
import { AlertCircle, ArrowRight, Check, SlidersHorizontal, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

export function EventDetailDrawer() {
  const openDrawer = useUiStore((s) => s.openDrawer);
  const payload = useUiStore((s) => s.drawerPayload) as { eventId?: string; event?: AppEvent } | undefined;
  const closeDrawer = useUiStore((s) => s.closeDrawer);
  const openDrawerModal = useUiStore((s) => s.openDrawerModal);

  const isOpen = openDrawer === 'event-detail';
  const event = payload?.event || INITIAL_EVENTS.find((e) => e.id === payload?.eventId) || INITIAL_EVENTS[0];

  const handleApprove = () => {
    toast.success('AI Reallocation plan approved successfully');
    closeDrawer();
  };

  const handleOverride = () => {
    closeDrawer();
    openDrawerModal('manual-picker', { taskId: event?.related_task });
  };

  if (!event) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <DrawerContent className="max-w-lg">
        <DrawerHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-amber-100 text-amber-800 text-xs font-bold">
              {event.type}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              #{event.id}
            </span>
          </div>
          <DrawerTitle className="text-xl font-bold">Event Audit Detail</DrawerTitle>
          <DrawerDescription>
            Occurred {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })} ({format(new Date(event.timestamp), 'PPpp')})
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-4 text-sm overflow-y-auto max-h-[70vh]">
          {/* Summary Card */}
          <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
            <h4 className="font-semibold text-xs uppercase text-muted-foreground">Impacted Entity</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block">Related Task:</span>
                <span className="font-mono font-medium">{event.related_task || 'None'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Related Employee:</span>
                <span className="font-mono font-medium">{event.related_employee || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Before -> After Diff per Spec Rule 7 */}
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-semibold text-xs uppercase text-muted-foreground">Allocation Transition (Before → After)</h4>
            <div className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Previous</span>
                <p className="font-semibold text-destructive">Priya Sharma</p>
                <span className="text-xs text-muted-foreground">Marked Unavailable</span>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
              <div className="space-y-1 text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Recommended</span>
                <p className="font-semibold text-emerald-600">Vikram Malhotra</p>
                <span className="text-xs text-muted-foreground">Score 92 · 30% Load</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              "Vikram has matching Stripe & Node.js skills, 30% current workload, and zero conflicting SLA commitments."
            </p>
          </div>
        </div>

        <DrawerFooter className="flex-row justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={handleOverride}>
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
            Override Manual
          </Button>
          <Button onClick={handleApprove}>
            <Check className="w-4 h-4 mr-1.5" />
            Approve AI Reallocation
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
