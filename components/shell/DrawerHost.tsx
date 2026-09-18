'use client';

import React from 'react';
import { useUiStore } from '@/lib/store/ui';
import { AiSuggestionDrawer } from '@/components/drawers/AiSuggestionDrawer';
import { ManualPickerDrawer } from '@/components/drawers/ManualPickerDrawer';
import { EventDetailDrawer } from '@/components/drawers/EventDetailDrawer';
import { ReasoningDrawer } from '@/components/drawers/ReasoningDrawer';
import { LogDetailDrawer } from '@/components/drawers/LogDetailDrawer';
import { ConfirmDialog } from '@/components/drawers/ConfirmDialog';
import { TaskPickerDrawer } from '@/components/drawers/TaskPickerDrawer';

export function DrawerHost() {
  const openDrawer = useUiStore((s) => s.openDrawer);

  return (
    <>
      <AiSuggestionDrawer />
      <ManualPickerDrawer />
      <EventDetailDrawer />
      <ReasoningDrawer />
      <LogDetailDrawer />
      <ConfirmDialog />
      <TaskPickerDrawer />
    </>
  );
}
