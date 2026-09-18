'use client';

import React from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { DrawerHost } from './DrawerHost';

export function AppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: 'MANAGER' | 'EMPLOYEE';
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar role={role} />
        <main className="flex-1 overflow-y-auto p-6 bg-background/50">
          {children}
        </main>
      </div>
      <DrawerHost />
    </div>
  );
}
