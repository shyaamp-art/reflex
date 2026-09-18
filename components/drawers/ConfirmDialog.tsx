'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/lib/store/ui';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogPayload {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'destructive' | 'primary';
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog() {
  const openDrawer = useUiStore((s) => s.openDrawer);
  const payload = useUiStore((s) => s.drawerPayload) as ConfirmDialogPayload | undefined;
  const closeDrawer = useUiStore((s) => s.closeDrawer);

  const isOpen = openDrawer === 'confirm';

  const handleConfirm = () => {
    payload?.onConfirm?.();
    closeDrawer();
  };

  const handleCancel = () => {
    payload?.onCancel?.();
    closeDrawer();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-2">
          <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg font-semibold">
            {payload?.title || 'Are you sure?'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {payload?.description || 'This action cannot be undone. Please confirm to proceed.'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={handleCancel}>
            {payload?.cancelLabel || 'Cancel'}
          </Button>
          <Button
            variant={payload?.tone === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {payload?.confirmLabel || 'Confirm Action'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
