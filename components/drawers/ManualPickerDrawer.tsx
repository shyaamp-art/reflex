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
import { Input } from '@/components/ui/input';
import { useUiStore } from '@/lib/store/ui';
import { INITIAL_EMPLOYEES } from '@/lib/data/mockData';
import { Employee } from '@/lib/types';
import { Search, UserCheck, Check } from 'lucide-react';
import { toast } from 'sonner';

export function ManualPickerDrawer() {
  const openDrawer = useUiStore((s) => s.openDrawer);
  const payload = useUiStore((s) => s.drawerPayload) as { taskId?: string; onSelect?: (emp: Employee) => void } | undefined;
  const closeDrawer = useUiStore((s) => s.closeDrawer);

  const isOpen = openDrawer === 'manual-picker';
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const filtered = INITIAL_EMPLOYEES.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role_title?.toLowerCase().includes(search.toLowerCase()) ||
      e.team.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = () => {
    if (!selectedEmp) {
      toast.error('Please select an employee first');
      return;
    }
    payload?.onSelect?.(selectedEmp);
    toast.success(`Manually assigned ${selectedEmp.name}`);
    closeDrawer();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <DrawerContent className="max-w-xl">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold">Manual Employee Picker</DrawerTitle>
          <DrawerDescription>
            Select an active engineer to allocate to the task.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employee by name, role, or team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-2 divide-y divide-border/40">
            {filtered.map((emp) => (
              <div
                key={emp.id}
                onClick={() => setSelectedEmp(emp)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedEmp?.id === emp.id ? 'bg-primary/10 border-primary border' : 'hover:bg-accent'
                }`}
              >
                <div>
                  <p className="font-semibold text-sm">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {emp.role_title} · {emp.team} · {emp.location}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-medium block">
                      {emp.current_workload_percent}% load
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Available</span>
                  </div>
                  {selectedEmp?.id === emp.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DrawerFooter className="flex-row justify-end gap-2 border-t pt-4">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
          <Button onClick={handleConfirm} disabled={!selectedEmp}>
            <UserCheck className="w-4 h-4 mr-1.5" />
            Confirm Manual Allocation
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
