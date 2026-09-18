'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { getStoredSession } from '@/lib/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const session = getStoredSession();
    if (!session || !session.email) {
      router.replace('/login');
    } else if (session.role !== 'MANAGER') {
      router.replace('/employee/dashboard');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="h-screen w-screen flex flex-col p-6 space-y-4 bg-background">
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="flex-1 flex gap-4">
          <Skeleton className="h-full w-60 rounded-lg" />
          <Skeleton className="h-full flex-1 rounded-lg" />
        </div>
      </div>
    );
  }

  return <AppShell role="MANAGER">{children}</AppShell>;
}
