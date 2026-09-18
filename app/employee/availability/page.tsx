'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarDays, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Chip } from '@/components/ui/chip';
import { toast } from 'sonner';

const availabilitySchema = z.object({
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required'),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

export default function AvailabilityPage() {
  const [entries, setEntries] = useState([
    {
      id: 'avail-01',
      start_date: '2026-09-20',
      end_date: '2026-09-22',
      reason: 'Medical Leave (Emergency procedure)',
      is_available: false,
    },
    {
      id: 'avail-02',
      start_date: '2026-10-15',
      end_date: '2026-10-18',
      reason: 'Approved Annual PTO',
      is_available: false,
    },
  ]);

  const form = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      reason: 'Medical Leave',
    },
  });

  const onSubmit = (values: AvailabilityFormValues) => {
    setEntries((prev) => [
      {
        id: `avail-${Date.now()}`,
        start_date: values.start_date,
        end_date: values.end_date,
        reason: values.reason,
        is_available: false,
      },
      ...prev,
    ]);
    toast.success("You're marked unavailable. The team will be reallocated.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Availability & Leave Schedule</h1>
        <p className="text-sm text-muted-foreground">
          Submit unplanned leave or planned PTO. Submitting automatically triggers autonomous team reallocation.
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-500" />
            Report Unavailability Window
          </CardTitle>
          <CardDescription className="text-xs">
            Enter dates when you will be away from duties. Active tasks will be automatically redistributed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Unplanned Medical Leave / Sick Days" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full sm:w-auto font-semibold">
                <CalendarDays className="w-4 h-4 mr-1.5" />
                Mark Unavailable & Notify Workforce Agent
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Existing Entries Table */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-semibold">Upcoming & Past Schedules</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-bold uppercase text-muted-foreground border-b">
              <tr>
                <th className="p-3.5">Start Date</th>
                <th className="p-3.5">End Date</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {entries.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="p-3.5 font-mono text-xs">{item.start_date}</td>
                  <td className="p-3.5 font-mono text-xs">{item.end_date}</td>
                  <td className="p-3.5 text-xs text-foreground font-medium">{item.reason}</td>
                  <td className="p-3.5">
                    <Chip variant="high">UNAVAILABLE</Chip>
                  </td>
                  <td className="p-3.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        setEntries((prev) => prev.filter((x) => x.id !== item.id));
                        toast.info('Schedule window removed');
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
