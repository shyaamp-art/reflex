import React, { useState } from 'react';
import { AllocationLog } from '../../types/index.js';
import { History, Download, Filter, ShieldCheck, UserCheck, Bot } from 'lucide-react';

interface ManagerAuditProps {
  logs: AllocationLog[];
}

export const ManagerAudit: React.FC<ManagerAuditProps> = ({ logs }) => {
  const [actionFilter, setActionFilter] = useState('ALL');
  const [triggerFilter, setTriggerFilter] = useState('ALL');

  const filtered = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (triggerFilter !== 'ALL' && log.triggered_by !== triggerFilter) return false;
    return true;
  });

  const exportCsv = () => {
    const headers = ['Timestamp', 'Action', 'Triggered By', 'Actor', 'Task Title', 'Employee', 'Reason'];
    const rows = filtered.map((l) => [
      l.created_at,
      l.action,
      l.triggered_by,
      `"${l.actor_name || ''}"`,
      `"${l.task_title || ''}"`,
      `"${l.employee_name || ''}"`,
      `"${l.reason || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reflex_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Log & Provenance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of every automated allocation, manual override, capacity release, and priority escalation.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <Download className="h-4 w-4" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="ALL">All Actions ({logs.length})</option>
          <option value="ALLOCATED">ALLOCATED</option>
          <option value="REALLOCATED">REALLOCATED</option>
          <option value="RELEASED">RELEASED</option>
          <option value="SLA_RISK">SLA_RISK</option>
          <option value="PRIORITY_ESCALATED">PRIORITY_ESCALATED</option>
        </select>

        <select
          value={triggerFilter}
          onChange={(e) => setTriggerFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
        >
          <option value="ALL">All Triggers</option>
          <option value="AI">AI Autonomous Engine</option>
          <option value="MANAGER">Human Manager</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Actor / Provenance</th>
              <th className="px-5 py-3">Target Subject</th>
              <th className="px-5 py-3">Operational Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  No audit logs matching current criteria.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                    {new Date(log.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'ALLOCATED'
                          ? 'bg-indigo-100 text-indigo-800'
                          : log.action === 'REALLOCATED'
                          ? 'bg-purple-100 text-purple-800'
                          : log.action === 'RELEASED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'SLA_RISK'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      {log.triggered_by === 'AI' ? (
                        <Bot className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5 text-slate-600" />
                      )}
                      <span className="font-semibold text-slate-800 text-xs">
                        {log.actor_name || (log.triggered_by === 'AI' ? 'Reflex Engine' : 'Manager')}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-slate-900">{log.task_title || log.task_id}</p>
                      {log.employee_name && (
                        <p className="text-[11px] text-slate-500">Assignee: {log.employee_name}</p>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-slate-600 text-[11px] max-w-md">
                    {log.reason}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
