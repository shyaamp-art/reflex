import React, { useState } from 'react';
import { CandidateScore, AllocationSuggestionResult } from '../../types/index.js';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Zap,
  Info,
  Check,
  ShieldCheck,
  Clock,
  Layers,
} from 'lucide-react';

interface AiSuggestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  result: AllocationSuggestionResult | null;
  isLoading: boolean;
  onConfirmSelection: (selectedEmployeeIds: string[]) => void;
  taskTitle: string;
}

export const AiSuggestionDrawer: React.FC<AiSuggestionDrawerProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  onConfirmSelection,
  taskTitle,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initialize selection when result arrives: prefer the server's selected
  // plan (which covers the full required headcount), not just top-1.
  React.useEffect(() => {
    if (result?.suggestions) {
      const serverSelected = (result.selected || [])
        .map((c) => c.employeeId)
        .filter((id) => result.suggestions.some((s) => s.employeeId === id && s.eligible));
      if (serverSelected.length > 0) {
        setSelectedIds(serverSelected);
        return;
      }
      const headcount = result.total_headcount_required || 1;
      const topN = result.suggestions
        .filter((c) => c.eligible)
        .slice(0, headcount)
        .map((c) => c.employeeId);
      setSelectedIds(topN);
    }
  }, [result]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAllRecommended = () => {
    if (!result?.suggestions) return;
    const eligible = result.suggestions.filter((c) => c.eligible).map((c) => c.employeeId);
    setSelectedIds(eligible);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">AI Decision Engine Recommendation</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic 6-factor candidate ranking for: <span className="font-semibold text-slate-800">"{taskTitle}"</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
              <p className="text-sm font-semibold text-slate-700">Evaluating Workforce Hard Constraints...</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Calculating skill proficiencies, projected capacity thresholds, SLA risk buffers, and Gemini operational rationale.
              </p>
            </div>
          ) : !result ? (
            <div className="text-center py-12 text-slate-400">No suggestions generated yet.</div>
          ) : (
            <>
              {/* Gemini AI Explanation Card */}
              {result.explanation && (
                <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30 p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      Executive Explainability Justification
                    </span>
                    <span className="text-[10px] bg-indigo-100/80 text-indigo-800 font-semibold px-2 py-0.5 rounded-full">
                      {result.explanation.source === 'gemini'
                        ? (result.explanation.model_used ? `Gemini Verified (${result.explanation.model_used.replace('gemini-', '')})` : 'Gemini AI Verified')
                        : 'Deterministic 6-Factor Verified'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {result.explanation.summary}
                  </p>

                  {result.explanation.risk_flags && result.explanation.risk_flags.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-indigo-100 space-y-1">
                      <p className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        Operational Observations:
                      </p>
                      {result.explanation.risk_flags.map((flag, i) => (
                        <p key={i} className="text-[11px] text-amber-900 pl-4">
                          &bull; {flag}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Status Alert for Uncovered Requirements */}
              {result.uncovered_requirements && result.uncovered_requirements.some((u) => u.covered_count < u.required_count) && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Headcount / Skill Coverage Bottleneck Detected</p>
                    <p className="mt-1 text-rose-800">
                      The engineering pool lacks available qualified engineers for:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.uncovered_requirements
                        .filter((u) => u.covered_count < u.required_count)
                        .map((u) => (
                          <span
                            key={u.skill_name}
                            className="bg-rose-200/80 text-rose-900 font-mono px-2 py-0.5 rounded text-[11px]"
                          >
                            {u.skill_name} ({u.covered_count}/{u.required_count} covered)
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Candidates List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Candidate Evaluation Rankings ({result.eligible_count} eligible)
                  </h3>
                  <button
                    onClick={handleSelectAllRecommended}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    Select All Recommended
                  </button>
                </div>

                {result.suggestions.map((candidate, idx) => {
                  const isSelected = selectedIds.includes(candidate.employeeId);
                  return (
                    <div
                      key={candidate.employeeId}
                      onClick={() => candidate.eligible && toggleSelect(candidate.employeeId)}
                      className={`rounded-xl border p-4 transition cursor-pointer ${
                        !candidate.eligible
                          ? 'border-slate-200 bg-slate-50/60 opacity-70'
                          : isSelected
                          ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-md border text-white transition ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold text-slate-900">
                                {candidate.employeeName}
                              </span>
                              <span className="text-xs text-slate-500">
                                &bull; {candidate.roleTitle} ({candidate.seniority})
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5">
                              <span>Team: {candidate.team}</span>
                              <span>Mode: {candidate.workMode}</span>
                              <span>
                                Projected Load:{' '}
                                <strong
                                  className={
                                    candidate.projectedWorkload > 85 ? 'text-amber-600' : 'text-slate-800'
                                  }
                                >
                                  {candidate.projectedWorkload}%
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Score Tag */}
                        <div className="text-right">
                          {candidate.eligible ? (
                            <div className="inline-flex items-center space-x-1 rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-900">
                              <Zap className="h-3.5 w-3.5 text-indigo-600" />
                              <span>{candidate.score.toFixed(1)} / 100</span>
                            </div>
                          ) : (
                            <span className="inline-block rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800">
                              Ineligible
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Operational Reason */}
                      <p className="text-xs text-slate-600 mt-2.5 bg-slate-50/80 rounded-lg p-2 border border-slate-100">
                        {candidate.reason}
                      </p>

                      {/* Rejection notice if ineligible */}
                      {!candidate.eligible && candidate.rejectionReasons.length > 0 && (
                        <div className="mt-2 text-xs text-rose-700 flex items-start space-x-1.5 font-medium">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>Disqualified: {candidate.rejectionReasons.join(' &bull; ')}</span>
                        </div>
                      )}

                      {/* 6-Factor Breakdown Grid */}
                      {candidate.eligible && (
                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px]">
                          <div className="rounded bg-slate-50 p-1.5">
                            <span className="text-slate-400 block font-medium">Skill (35%)</span>
                            <span className="font-bold text-slate-800">{candidate.breakdown.skillMatch}%</span>
                          </div>
                          <div className="rounded bg-slate-50 p-1.5">
                            <span className="text-slate-400 block font-medium">Avail (15%)</span>
                            <span className="font-bold text-slate-800">{candidate.breakdown.availability}%</span>
                          </div>
                          <div className="rounded bg-slate-50 p-1.5">
                            <span className="text-slate-400 block font-medium">Workload (20%)</span>
                            <span className="font-bold text-slate-800">{candidate.breakdown.workload}%</span>
                          </div>
                          <div className="rounded bg-slate-50 p-1.5">
                            <span className="text-slate-400 block font-medium">Perf (10%)</span>
                            <span className="font-bold text-slate-800">{candidate.breakdown.performance}%</span>
                          </div>
                          <div className="rounded bg-slate-50 p-1.5">
                            <span className="text-slate-400 block font-medium">SLA (10%)</span>
                            <span className="font-bold text-slate-800">{candidate.breakdown.slaSafety}%</span>
                          </div>
                          <div className="rounded bg-slate-50 p-1.5">
                            <span className="text-slate-400 block font-medium">Location (10%)</span>
                            <span className="font-bold text-slate-800">{candidate.breakdown.location}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Selected for assignment:{' '}
            <strong className="text-slate-900">{selectedIds.length} engineer(s)</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              disabled={selectedIds.length === 0}
              onClick={() => onConfirmSelection(selectedIds)}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4" />
              <span>Confirm & Allocate Selected</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
