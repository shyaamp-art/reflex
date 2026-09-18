'use client';

import React from 'react';
import {
  GraduationCap,
  Download,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { INITIAL_SKILL_GAPS } from '@/lib/data/mockData';
import { toast } from 'sonner';

export default function SkillGapsPage() {
  const severeGaps = INITIAL_SKILL_GAPS.filter((g) => g.times_failed >= 5);

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Skill,Times Failed,Strength,Hiring Priority,Last Seen\n' +
      INITIAL_SKILL_GAPS.map(
        (g) =>
          `${g.skill_name},${g.times_failed},${g.recommendation_strength},${g.suggested_hiring_priority},${g.last_occurred || 'recent'}`
      ).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'skill_gaps_report.csv');
    document.body.appendChild(link);
    link.click();
    toast.success('Skill gaps exported to CSV');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Skill Gap & Hiring Analysis</h1>
          <p className="text-sm text-muted-foreground">
            Aggregated allocation failures, capacity bottlenecks, and prioritized recruiting recommendations.
          </p>
        </div>

        <Button variant="outline" onClick={handleExportCsv} className="shadow-sm">
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Top Banner if times_failed >= 5 per Spec Section 5.9 */}
      {severeGaps.length > 0 && (
        <div className="p-4 rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold">Critical Staffing Bottlenecks Identified</h4>
              <p className="text-xs text-red-700/80 dark:text-red-300/80">
                ⚠ {severeGaps.length} skills (including &ldquo;stripe&rdquo;) have caused 5+ allocation failures across recent sprints.
              </p>
            </div>
          </div>
          <Button size="sm" variant="destructive" onClick={() => toast.info('Opening hiring requisition form')}>
            Open Requisition
          </Button>
        </div>
      )}

      {/* Table of Skill Gaps */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-bold uppercase text-muted-foreground border-b">
              <tr>
                <th className="p-3.5">Skill Name</th>
                <th className="p-3.5">Times Failed</th>
                <th className="p-3.5">Recommendation Strength</th>
                <th className="p-3.5">Hiring Priority</th>
                <th className="p-3.5">Last Occurred</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {INITIAL_SKILL_GAPS.map((gap) => (
                <tr key={gap.skill_name} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-sm bg-muted px-2.5 py-1 rounded">
                      {gap.skill_name}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`font-mono font-bold text-sm ${
                        gap.times_failed >= 5 ? 'text-red-600 dark:text-red-400' : 'text-amber-600'
                      }`}
                    >
                      {gap.times_failed} failures
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2 max-w-xs">
                      <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${(gap.recommendation_strength || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold">
                        {Math.round((gap.recommendation_strength || 0.5) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <Chip variant={gap.suggested_hiring_priority === 1 ? 'critical' : 'high'}>
                      Priority #{gap.suggested_hiring_priority}
                    </Chip>
                  </td>
                  <td className="p-3.5 text-xs text-muted-foreground font-mono">
                    {gap.last_occurred
                      ? formatDistanceToNow(new Date(gap.last_occurred), { addSuffix: true })
                      : 'Just now'}
                  </td>
                  <td className="p-3.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => toast.success(`Marked ${gap.skill_name} as reviewed`)}
                    >
                      Mark Reviewed
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
