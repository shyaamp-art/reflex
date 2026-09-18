'use client';

import React, { useState } from 'react';
import { Bell, AlertTriangle, UserMinus, PlusCircle, ArrowUpDown, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { INITIAL_EVENTS } from '@/lib/data/mockData';
import { AppEvent, EventType } from '@/lib/types';
import { useUiStore } from '@/lib/store/ui';

function getEventIcon(type: EventType) {
  switch (type) {
    case 'PERSON_UNAVAILABLE':
      return <UserMinus className="w-4 h-4 text-amber-500" />;
    case 'SLA_RISK':
      return <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />;
    case 'SKILL_GAP':
      return <Sparkles className="w-4 h-4 text-purple-500" />;
    case 'NEW_TASK':
      return <PlusCircle className="w-4 h-4 text-blue-500" />;
    case 'PRIORITY_CHANGE':
      return <ArrowUpDown className="w-4 h-4 text-orange-500" />;
    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
}

export function NotificationBell() {
  const [events] = useState<AppEvent[]>(INITIAL_EVENTS);
  const [unreadCount, setUnreadCount] = useState(INITIAL_EVENTS.length);
  const openDrawerModal = useUiStore((s) => s.openDrawerModal);

  const handleOpenEvent = (event: AppEvent) => {
    openDrawerModal('event-detail', { eventId: event.id, event });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-foreground hover:bg-accent"
          aria-label={`Notifications, ${unreadCount} unread`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="p-0 font-semibold text-sm">
            Live Event Feed
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <span className="text-[11px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {events.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No recent events.
            </div>
          ) : (
            events.slice(0, 20).map((evt) => (
              <DropdownMenuItem
                key={evt.id}
                onClick={() => handleOpenEvent(evt)}
                className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent focus:bg-accent"
              >
                <div className="mt-0.5 p-1.5 rounded-md bg-muted/60">
                  {getEventIcon(evt.type)}
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-xs font-medium leading-none text-foreground">
                    {evt.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {evt.related_task ? `Task: ${evt.related_task}` : evt.missing_skill ? `Missing: ${evt.missing_skill}` : 'Workforce update'}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80">
                    {formatDistanceToNow(new Date(evt.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="p-2 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setUnreadCount(0);
            }}
          >
            Mark all as read
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
