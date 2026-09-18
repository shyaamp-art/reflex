'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  Filter,
  Search,
  Code,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Chip } from '@/components/ui/chip';
import { INITIAL_ALLOCATION_LOGS } from '@/lib/data/mockData';
import { useUiStore } from '@/lib/store/ui';
import { toast } from 'sonner';

export default function AuditLogsPage() {
  const openDrawerModal = useUiStore((s) => s.openDrawerModal);
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = INITIAL_ALLOCATION_LOGS.filter((log) =>
    actionFilter === 'ALL' ? true : log.action === actionFilter
  );

  const handleExportCsv = () => {
    const csv =
      'Timestamp,Task ID,Action,Reason,Triggered By\n' +
      filteredLogs.map((l) => `"${l.created_at}","${l.task_id}","${l.action}","${l.reason}","${l.triggered_by}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'workforce_audit_trail.csv');
    a.click();
    toast.success('Audit trail exported to CSV');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Allocation Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Complete, immutable audit logs of autonomous reassignments, overrides, and SLA escalations.
          </p>
        </div>

        <Button variant="outline" onClick={handleExportCsv} className="shadow-sm">
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 bg-card p-3 rounded-xl border max-w-sm">
        <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Filter Action:</label>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Actions</SelectItem>
            <SelectItem value="ALLOCATED">ALLOCATED</SelectItem>
            <SelectItem value="REALLOCATED">REALLOCATED</SelectItem>
            <SelectItem value="RELEASED">RELEASED</SelectItem>
            <SelectItem value="PRIORITY_ESCALATED">PRIORITY_ESCALATED</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Audit Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-bold uppercase text-muted-foreground border-b">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Task ID</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Reason</th>
                <th className="p-3.5">Triggered By</th>
                <th className="p-3.5 text-right">State Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => openDrawerModal('log-detail', { logId: log.id, log })}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="p-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm')}
                  </td>
                  <td className="p-3.5 font-mono text-xs font-semibold text-foreground">
                    #{log.task_id}
                  </td>
                  <td className="p-3.5">
                    <Chip
                      variant={
                        log.action === 'REALLOCATED'
                          ? 'high'
                          : log.action === 'PRIORITY_ESCALATED'
                          ? 'critical'
                          : 'assigned'
                      }
                    >
                      {log.action}
                    </Chip>
                  </td>
                  <td className="p-3.5 text-xs text-foreground max-w-md truncate">
                    {log.reason}
                  </td>
                  <td className="p-3.5">
                    <span className="font-mono text-xs font-semibold bg-muted px-2 py-0.5 rounded">
                      {log.triggered_by}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary font-medium">
                      Inspect JSON →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
