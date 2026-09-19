import React, { useState } from 'react';
import { AllocationProposal, Employee } from '../../types/index.js';
import {
  X,
  Repeat,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  Shield,
  UserCheck,
} from 'lucide-react';

interface ReallocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: AllocationProposal | null;
  employees: Employee[];
  onApprove: (proposalId: string, note?: string) => void;
  onOverride: (proposalId: string, employeeIds: string[], reason: string) => void;
}

export const ReallocationModal: React.FC<ReallocationModalProps> = ({
  isOpen,
  onClose,
  proposal,
  employees,
  onApprove,
  onOverride,
}) => {
  const [decisionNote, setDecisionNote] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideEmployeeId, setOverrideEmployeeId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  if (!isOpen || !proposal) return null;

  const selectedItems = (proposal.items || []).filter((it) => it.selected);
  // Only PENDING proposals with recommended candidates can be approved.
  // NO_FEASIBLE_MATCH (or decided) proposals must go through an eligible
  // manual override or capacity relief — approving them always failed server
  // side, which made the whole flow look broken.
  const isActionable = proposal.status === 'PENDING' && selectedItems.length > 0;
  // Never present a rejected candidate as the "recommended target".
  const topItem = selectedItems[0];
  const topItemEmployee = topItem?.employee;
  const topCandidate = proposal.candidates?.[0] || (topItem
    ? {
        employeeName: topItemEmployee?.name || topItem.employee_id,
        roleTitle: topItemEmployee?.role_title || '',
        score: topItem.score,
        projectedWorkload: topItemEmployee?.current_workload_percent || 0,
        reason: topItem.reason,
        breakdown: {
          skillMatch: topItem.skill_match,
          availability: topItem.availability,
          workload: topItem.workload,
          performance: topItem.performance,
          slaSafety: topItem.sla_safety,
          location: topItem.location,
        },
      }
    : undefined);
  const triggerLabel = proposal.trigger_type || proposal.event?.type || proposal.proposal_type;
  const currentAssignee = proposal.current_allocations?.[0]?.employee;
  const task = proposal.task;

  // Ranked candidates with eligibility annotations. Proposal items carry the
  // engine rejection reason for ineligible staff; employees outside the
  // evaluated top-5 are selectable and validated server side.
  const rankedOptions = employees.map((emp) => {
    const item = (proposal.items || []).find((it) => it.employee_id === emp.id);
    const rawReason = item?.reason || '';
    const ineligibleReason = rawReason.startsWith('Ineligible')
      ? rawReason.replace(/^Ineligible:\s*/, '')
      : null;
    return { emp, item, ineligibleReason };
  });

  const handleConfirmApprove = () => {
    if (!isActionable) return;
    onApprove(proposal.id, decisionNote || 'AI Reallocation proposal approved by manager.');
  };

  const handleConfirmOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideEmployeeId) return alert('Please select a replacement engineer');
    if (!overrideReason) return alert('Please specify an override justification');
    onOverride(proposal.id, [overrideEmployeeId], overrideReason);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">Reallocation Proposal Review</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                   triggerLabel === 'PERSON_UNAVAILABLE'
                     ? 'bg-rose-100 text-rose-800'
                     : 'bg-amber-100 text-amber-800'
                 }`}>
                   {triggerLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500">Proposal ID: {proposal.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Context Banner */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
            <span className="font-bold text-slate-700 block uppercase tracking-wider mb-1">Impacted Task</span>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{task?.title || 'Unknown Task'}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Priority: <span className="font-semibold text-rose-600">{task?.priority}</span> &bull; SLA:{' '}
                  {task?.sla_deadline ? new Date(task.sla_deadline).toLocaleString() : 'N/A'}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-200 text-slate-800">
                {task?.status}
              </span>
            </div>
          </div>

          {/* Transfer Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Current Assignee */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-2">
                Releasing Capacity
              </span>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center border border-rose-200">
                  {currentAssignee?.name?.slice(0, 2) || 'N/A'}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{currentAssignee?.name || 'Unassigned / Released'}</p>
                  <p className="text-[11px] text-slate-500">{currentAssignee?.role_title || 'N/A'}</p>
                  <p className="text-[10px] text-rose-700 font-semibold mt-1">
                    Trigger: {triggerLabel?.replace('_', ' ') || 'SYSTEM EVENT'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Proposed Assignee */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 text-xs relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  AI Recommended Target
                </span>
                {topCandidate && (
                  <span className="bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {topCandidate.score.toFixed(1)} / 100
                  </span>
                )}
              </div>
              {topCandidate ? (
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200">
                    {topCandidate.employeeName?.slice(0, 2) || 'TG'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{topCandidate.employeeName}</p>
                    <p className="text-[11px] text-slate-500">{topCandidate.roleTitle}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                      Projected Load: {topCandidate.projectedWorkload}%
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic">No eligible candidate found</p>
              )}
            </div>
          </div>

          {/* Non-actionable notice: explains why Approve is disabled */}
          {!isActionable && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {proposal.status !== 'PENDING'
                    ? `Proposal already ${proposal.status.toLowerCase()} — no further approval possible.`
                    : 'No feasible replacement found under current hard constraints.'}
                </p>
                <p className="mt-1 text-amber-800">
                  Free capacity (release or complete another task for a skilled engineer), wait for leave to end,
                  or pick an eligible engineer below via Manual Override. Approval is disabled until candidates
                  satisfy skill, availability, workload (&le;100%), and work-mode rules.
                </p>
              </div>
            </div>
          )}

          {/* Gemini Rationale */}
          {topCandidate && (
            <div className="rounded-xl border border-indigo-100 bg-slate-50 p-3.5 text-xs">
              <span className="font-bold text-slate-700 block uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                Algorithmic Transition Justification
              </span>
              <p className="text-slate-600 leading-relaxed">{topCandidate.reason}</p>

              {/* Breakdown */}
              <div className="mt-3 pt-2 border-t border-slate-200/60 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px]">
                <div className="bg-white rounded p-1 border border-slate-200">
                  <span className="text-slate-400 block">Skill</span>
                  <span className="font-bold text-slate-800">{topCandidate.breakdown.skillMatch}%</span>
                </div>
                <div className="bg-white rounded p-1 border border-slate-200">
                  <span className="text-slate-400 block">Avail</span>
                  <span className="font-bold text-slate-800">{topCandidate.breakdown.availability}%</span>
                </div>
                <div className="bg-white rounded p-1 border border-slate-200">
                  <span className="text-slate-400 block">Workload</span>
                  <span className="font-bold text-slate-800">{topCandidate.breakdown.workload}%</span>
                </div>
                <div className="bg-white rounded p-1 border border-slate-200">
                  <span className="text-slate-400 block">Perf</span>
                  <span className="font-bold text-slate-800">{topCandidate.breakdown.performance}%</span>
                </div>
                <div className="bg-white rounded p-1 border border-slate-200">
                  <span className="text-slate-400 block">SLA</span>
                  <span className="font-bold text-slate-800">{topCandidate.breakdown.slaSafety}%</span>
                </div>
                <div className="bg-white rounded p-1 border border-slate-200">
                  <span className="text-slate-400 block">Location</span>
                  <span className="font-bold text-slate-800">{topCandidate.breakdown.location}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Full ranked evaluation so managers see why others were rejected */}
          {(proposal.items || []).length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
              <span className="font-bold text-slate-700 block uppercase tracking-wider mb-2">
                Candidate Evaluation ({(proposal.items || []).filter((it) => it.selected).length} recommended)
              </span>
              <div className="space-y-1.5">
                {(proposal.items || []).map((it) => {
                  const name = (it as any)?.employee?.name || it.employee_id;
                  const bad = (it.reason || '').startsWith('Ineligible');
                  return (
                    <div
                      key={it.id}
                      className={`rounded-lg border px-2.5 py-1.5 flex items-center justify-between gap-2 ${
                        it.selected ? 'border-indigo-300 bg-indigo-50/60' : 'border-slate-150 bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900">{name}</span>
                        {it.selected && (
                          <span className="ml-1.5 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            RECOMMENDED
                          </span>
                        )}
                        <p className={`truncate text-[11px] ${bad ? 'text-rose-700' : 'text-slate-500'}`}>
                          {it.reason}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold text-slate-800">{it.score.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Override Form Toggle */}
          {isOverriding ? (
            <form onSubmit={handleConfirmOverride} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Manager Manual Override Selection
                </span>
                <button
                  type="button"
                  onClick={() => setIsOverriding(false)}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Cancel Override
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Choose Replacement Engineer
                </label>
                <select
                  required
                  value={overrideEmployeeId}
                  onChange={(e) => setOverrideEmployeeId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none"
                >
                  <option value="">Select an engineer...</option>
                  {rankedOptions.map(({ emp, item, ineligibleReason }) => (
                    <option key={emp.id} value={emp.id} disabled={!!ineligibleReason}>
                      {emp.name} &bull; {emp.role_title} ({emp.current_workload_percent}% load)
                      {item
                        ? ineligibleReason
                          ? ` — INELIGIBLE: ${ineligibleReason}`
                          : ` — eligible (${item.score.toFixed(1)})`
                        : ' — not evaluated'}
                    </option>
                  ))}
                </select>
                {rankedOptions.some((o) => o.item) &&
                  !rankedOptions.some((o) => o.item && !o.ineligibleReason) && (
                    <p className="mt-1.5 text-[11px] text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      No evaluated engineer currently satisfies the hard constraints. Free capacity first, then retry.
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Override Justification Note *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explain why manager overrode AI recommendation..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
                >
                  Commit Manual Override
                </button>
              </div>
            </form>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Approval Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Approved. Assignee notified on Slack."
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {!isOverriding && (
            <button
              type="button"
              onClick={() => setIsOverriding(true)}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600"
            >
              Manual Override Instead
            </button>
          )}

          <div className="flex items-center space-x-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Close
            </button>
            {!isOverriding && (
              <button
                type="button"
                disabled={!isActionable}
                onClick={handleConfirmApprove}
                title={isActionable ? 'Approve the recommended transfer' : 'Approval requires a PENDING proposal with a recommended candidate'}
                className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve AI Reallocation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
