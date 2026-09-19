import React, { useState } from 'react';
import { AllocationProposal, Employee } from '../../types/index.js';
import {
  Repeat,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  UserX,
} from 'lucide-react';

interface ManagerReallocationsProps {
  proposals: AllocationProposal[];
  employees: Employee[];
  onOpenModal: (proposal: AllocationProposal) => void;
  onApproveDirect: (proposalId: string) => void;
}

export const ManagerReallocations: React.FC<ManagerReallocationsProps> = ({
  proposals,
  employees,
  onOpenModal,
  onApproveDirect,
}) => {
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = proposals.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reallocations Hub</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated proposal queue generated when engineers report leave or tasks enter high SLA risk.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Proposals ({proposals.length})</option>
            <option value="PENDING">Pending Approval ({proposals.filter((p) => p.status === 'PENDING').length})</option>
            <option value="APPROVED">Approved ({proposals.filter((p) => p.status === 'APPROVED').length})</option>
            <option value="OVERRIDDEN">Overridden ({proposals.filter((p) => p.status === 'OVERRIDDEN').length})</option>
          </select>
        </div>
      </div>

      {/* Proposals Feed */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          No reallocation proposals found matching the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((prop) => {
            const selectedItems = (prop.items || []).filter((it) => it.selected);
            const topItem = selectedItems[0] || prop.items?.[0];
            const topItemEmployee = (topItem as any)?.employee;
            const top = prop.candidates?.[0] || (topItem
              ? {
                  employeeName: topItemEmployee?.name || (topItem as any).employee_id,
                  roleTitle: topItemEmployee?.role_title || '',
                  score: (topItem as any).score || 0,
                  projectedWorkload: topItemEmployee?.current_workload_percent,
                }
              : undefined);
            const triggerLabel = (prop as any).trigger_type || prop.event?.type || prop.proposal_type;
            const currentAlloc = prop.current_allocations?.[0];
            const isPending = prop.status === 'PENDING';

            return (
              <div
                key={prop.id}
                className={`rounded-2xl border p-5 transition shadow-2xs ${
                  isPending
                    ? 'border-indigo-200 bg-white hover:border-indigo-300'
                    : 'border-slate-200 bg-slate-50/50 opacity-80'
                }`}
              >
                {/* Proposal Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        triggerLabel === 'PERSON_UNAVAILABLE'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200/60'
                          : 'bg-amber-100 text-amber-800 border border-amber-200/60'
                      }`}
                    >
                      {triggerLabel === 'PERSON_UNAVAILABLE' ? 'UNAVAILABILITY LEAVE' : 'SLA RISK ESCALATION'}
                    </span>
                    <span className="text-xs font-bold text-slate-800">Proposal #{prop.id.slice(-6)}</span>
                    <span className="text-[10px] text-slate-400">
                      &bull; {new Date(prop.created_at).toLocaleString()}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      prop.status === 'PENDING'
                        ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                        : prop.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    STATUS: {prop.status}
                  </span>
                </div>

                {/* Main Body: Task & Transition */}
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Task Column */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Impacted Task
                    </span>
                    <p className="font-bold text-slate-900 text-sm leading-tight">{prop.task?.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Priority: <strong className="text-rose-600">{prop.task?.priority}</strong> &bull; Effort:{' '}
                      {prop.task?.estimated_effort}h
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      SLA: {prop.task?.sla_deadline ? new Date(prop.task.sla_deadline).toLocaleString() : 'N/A'}
                    </p>
                  </div>

                  {/* Transfer Column */}
                  <div className="lg:col-span-2 rounded-xl bg-slate-50 p-4 border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* From */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                        Releasing Assignee
                      </span>
                      <p className="font-bold text-slate-800 text-xs">
                        {currentAlloc?.employee?.name || 'Unassigned / Released'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {currentAlloc?.employee?.role_title || 'N/A'}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-400 hidden sm:block shrink-0" />

                    {/* To AI Recommended Target */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          Target Candidate
                        </span>
                        {top && (
                          <span className="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-1.5 rounded">
                            {top.score.toFixed(1)}/100
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{top?.employeeName || 'No candidate'}</p>
                      <p className="text-[10px] text-slate-500">
                        {top?.roleTitle} &bull; Proj: {top?.projectedWorkload}% load
                      </p>
                    </div>

                    {/* Action Buttons */}
                    {isPending ? (
                      <div className="flex items-center space-x-2 mt-2 sm:mt-0 ml-auto shrink-0">
                        <button
                          onClick={() => onOpenModal(prop)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                          Review & Override
                        </button>
                        <button
                          onClick={() => onApproveDirect(prop.id)}
                          className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-95"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approve Transfer</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-[11px] text-slate-500 ml-auto">
                        <p className="font-semibold text-slate-700">Executed by Alex Rivera</p>
                        <p className="text-[10px]">{prop.decision_note || 'Completed'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
