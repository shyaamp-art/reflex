import React from 'react';
import { SkillGapEvent } from '../../types/index.js';
import { AlertTriangle, Download, CheckCircle, TrendingUp, Sparkles, UserPlus } from 'lucide-react';

interface ManagerSkillGapsProps {
  skillGaps: SkillGapEvent[];
  onReviewSkillGap: (skillName: string) => void;
}

export const ManagerSkillGaps: React.FC<ManagerSkillGapsProps> = ({ skillGaps, onReviewSkillGap }) => {
  const exportCsv = () => {
    const headers = ['Skill Name', 'Times Failed', 'Hiring Priority', 'Impact Level', 'Recommendation'];
    const rows = skillGaps.map((g) => [
      g.skill_name,
      g.times_failed,
      g.suggested_hiring_priority === 1 ? 'CRITICAL' : 'MEDIUM',
      g.impact_level,
      `"${g.recommendation}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reflex_skill_gaps_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Skill Gap Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic aggregation of recurrent allocation failures to inform engineering hiring & upskilling.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
        >
          <Download className="h-4 w-4" />
          <span>Export Gap Report (CSV)</span>
        </button>
      </div>

      {/* Info Callout */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 to-slate-50 p-4 text-xs text-slate-700 flex items-start space-x-3">
        <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-900">Reflex Closed-Loop Skill Gap Analysis</p>
          <p className="mt-0.5 text-slate-600">
            Whenever an unassigned task fails greedy allocation due to insufficient qualified headcount or required
            proficiency, Reflex automatically tallies the occurrence and recalculates hiring priority weights.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Missing Competency</th>
              <th className="px-4 py-3">Allocation Failures</th>
              <th className="px-4 py-3">Hiring Priority</th>
              <th className="px-4 py-3">Business Impact</th>
              <th className="px-5 py-3">Actionable Recommendation</th>
              <th className="px-4 py-3 text-right">Review Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {skillGaps.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No persistent skill gaps recorded. Workforce capability is optimal.
                </td>
              </tr>
            ) : (
              skillGaps.map((gap) => (
                <tr key={gap.skill_name} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900 text-xs">
                    <span className="font-mono bg-slate-100 text-slate-800 px-2 py-1 rounded">
                      {gap.skill_name}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-black text-slate-900 text-sm">{gap.times_failed}</span>
                    <span className="text-[10px] text-slate-400 ml-1">incidents</span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        gap.suggested_hiring_priority === 1
                          ? 'bg-rose-100 text-rose-800'
                          : gap.suggested_hiring_priority === 2
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {gap.suggested_hiring_priority === 1 ? 'P1 - CRITICAL' : 'P2 - MEDIUM'}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-700">
                    {gap.impact_level}
                  </td>

                  <td className="px-5 py-3.5 text-slate-600 text-[11px] max-w-sm">
                    {gap.recommendation}
                  </td>

                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    {gap.reviewed_at ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Reviewed
                      </span>
                    ) : (
                      <button
                        onClick={() => onReviewSkillGap(gap.skill_name)}
                        className="rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition"
                      >
                        Mark Reviewed
                      </button>
                    )}
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
