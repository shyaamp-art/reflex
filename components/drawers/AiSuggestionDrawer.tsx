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
import { AiSuggestion } from '@/lib/types';
import { Sparkles, CheckCheck, X } from 'lucide-react';
import { toast } from 'sonner';

export function AiSuggestionDrawer() {
  const openDrawer = useUiStore((s) => s.openDrawer);
  const payload = useUiStore((s) => s.drawerPayload) as {
    taskId?: string;
    suggestions?: AiSuggestion[];
    onAcceptAll?: () => void;
  } | undefined;
  const closeDrawer = useUiStore((s) => s.closeDrawer);

  const isOpen = openDrawer === 'ai-suggestion';
  const suggestions = payload?.suggestions || [];

  const handleAcceptAll = () => {
    payload?.onAcceptAll?.();
    toast.success('Accepted all AI recommendations for task allocation');
    closeDrawer();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <DrawerContent className="max-w-xl">
        <DrawerHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Recommendations
            </span>
          </div>
          <DrawerTitle className="text-xl font-bold">Recommended Candidates</DrawerTitle>
          <DrawerDescription>
            Engineers evaluated against task requirements, workload capacity, and SLA risk.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[70vh]">
          {suggestions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No recommendations generated yet.
            </div>
          ) : (
            suggestions.map((s, idx) => (
              <div key={s.employee.id || idx} className="border rounded-lg p-3.5 space-y-2 bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{s.employee.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {s.employee.role_title} · {s.employee.team}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {s.score} / 100
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{s.reason}</p>
                <div className="grid grid-cols-5 gap-1 pt-1 text-[10px] text-center">
                  <div className="bg-muted p-1 rounded">
                    <span className="block text-muted-foreground">Skill</span>
                    <span className="font-bold">{s.breakdown.skillMatch}%</span>
                  </div>
                  <div className="bg-muted p-1 rounded">
                    <span className="block text-muted-foreground">Load</span>
                    <span className="font-bold">{s.breakdown.workload}%</span>
                  </div>
                  <div className="bg-muted p-1 rounded">
                    <span className="block text-muted-foreground">SLA</span>
                    <span className="font-bold">{s.breakdown.slaSafety}%</span>
                  </div>
                  <div className="bg-muted p-1 rounded">
                    <span className="block text-muted-foreground">Perf</span>
                    <span className="font-bold">{s.breakdown.performance}%</span>
                  </div>
                  <div className="bg-muted p-1 rounded">
                    <span className="block text-muted-foreground">Loc</span>
                    <span className="font-bold">{s.breakdown.location}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DrawerFooter className="flex-row justify-end gap-2 border-t pt-4">
          <DrawerClose asChild>
            <Button variant="outline">
              <X className="w-4 h-4 mr-1.5" /> Cancel
            </Button>
          </DrawerClose>
          <Button onClick={handleAcceptAll}>
            <CheckCheck className="w-4 h-4 mr-1.5" /> Accept All
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
