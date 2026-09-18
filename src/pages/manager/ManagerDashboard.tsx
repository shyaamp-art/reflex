import React from 'react';
import {
  Task,
  Employee,
  AllocationProposal,
  AppEvent,
  SkillGapEvent,
} from '../../types/index.js';
import {
  AlertTriangle,
  Clock,
  Repeat,
  CheckCircle2,
  Users,
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ManagerDashboardProps {
  tasks: Task[];
  employees: Employee[];
  reallocations: AllocationProposal[];
  events: AppEvent[];
  skillGaps: SkillGapEvent[];
  onNavigate: (tab: string) => void;
  onOpenReallocationModal: (proposal: AllocationProposal) => void;
  onNewTaskClick: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  tasks,
  employees,
  reallocations,
  events,
  skillGaps,
  onNavigate,
  onOpenReallocationModal,
  onNewTaskClick,
}) => {
  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const now = Date.now();
  const fourHoursMs = 4 * 60 * 60 * 1000;

  const atRiskTasks = activeTasks.filter((t) => {
    const diff = new Date(t.sla_deadline).getTime() - now;
    return diff > 0 && diff <= fourHoursMs;
  });

  const pendingReallocations = reallocations.filter((p) => p.status === 'PENDING');

  const avgWorkload =
    employees.length > 0
      ? Math.round(
          employees.reduce((acc, e) => acc + e.current_workload_percent, 0) / employees.length
        )
      : 0;

  const overallocatedCount = employees.filter((e) => e.current_workload_percent >= 85).length;
  const topSkillGap = skillGaps[0];

  return (
    <div className="space-y-6">
      {/* Top Welcome / Headline */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Workforce Command Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time deterministic allocation intelligence, capacity saturation, and automated SLA defenses.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('reallocations')}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Review Reallocation Queue ({pendingReallocations.length})
          </button>
          <button
            onClick={onNewTaskClick}
            className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            <span>Create New Task</span>
          </button>
        </div>
      </div>

      {/* SLA Alert Callout if at-risk tasks exist */}
      {atRiskTasks.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white font-bold shrink-0">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                SLA Breach Risk Detected ({atRiskTasks.length} Task{atRiskTasks.length > 1 ? 's' : ''})
              </h3>
              <p className="text-xs text-amber-900 mt-0.5">
                Tasks with deadlines under 4 hours require immediate capacity safeguards or priority escalation.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('tasks')}
            className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition shrink-0"
          >
            View At-Risk Tasks
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Active Demand */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Demand</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{activeTasks.length}</span>
            <span className="text-xs text-slate-500 font-medium">Tasks</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {tasks.filter((t) => t.status === 'COMPLETED').length} completed this cycle
          </span>
        </div>

        {/* SLA At Risk */}
        <div
          onClick={() => onNavigate('tasks')}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs cursor-pointer hover:border-amber-300 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">SLA Critical</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-600">{atRiskTasks.length}</span>
            <span className="text-xs text-amber-600 font-medium">&lt; 4 hrs</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Automated escalation enabled</span>
        </div>

        {/* Reallocation Queue */}
        <div
          onClick={() => onNavigate('reallocations')}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs cursor-pointer hover:border-indigo-300 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Reallocations</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-indigo-600">{pendingReallocations.length}</span>
            <span className="text-xs text-indigo-600 font-medium">Pending</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">1-click approve or override</span>
        </div>

        {/* Team Saturation */}
        <div
          onClick={() => onNavigate('employees')}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs cursor-pointer hover:border-slate-300 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team Capacity</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{avgWorkload}%</span>
            <span className="text-xs text-slate-500 font-medium">{employees.length} Eng</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {overallocatedCount} engineer(s) &gt; 85% load
          </span>
        </div>

        {/* Top Skill Shortage */}
        <div
          onClick={() => onNavigate('skill-gaps')}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs cursor-pointer hover:border-rose-300 transition col-span-2 md:col-span-1"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Top Skill Gap</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-base font-black text-slate-900 truncate">
              {topSkillGap?.skill_name || 'None'}
            </span>
            <span className="text-xs text-rose-600 font-bold">
              {topSkillGap ? `${topSkillGap.times_failed}x` : '0x'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Priority: {topSkillGap?.suggested_hiring_priority === 1 ? 'High' : 'Normal'}
          </span>
        </div>
      </div>

      {/* Main Grid: Reallocation Queue & Workforce Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Reallocations + Tasks at risk */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Reallocations Spotlight */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Urgent Reallocation Proposals</h3>
                <p className="text-xs text-slate-500">
                  AI-recommended candidate transfers triggered by sick leave or SLA risk
                </p>
              </div>
              <button
                onClick={() => onNavigate('reallocations')}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {pendingReallocations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                No pending reallocation proposals. Workload is balanced and SLAs are secured.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReallocations.slice(0, 3).map((prop) => {
                  const top = prop.candidates?.[0];
                  return (
                    <div
                      key={prop.id}
                      className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            prop.trigger_type === 'PERSON_UNAVAILABLE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {prop.trigger_type}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {prop.task?.title}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                          <span>Releasing: <strong className="text-slate-700">{prop.current_allocations?.[0]?.employee?.name || 'Assigned'}</strong></span>
                          <span>&rarr;</span>
                          <span>
                            Target:{' '}
                            <strong className="text-indigo-700">
                              {top?.employeeName} ({top?.score.toFixed(1)}/100)
                            </strong>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onOpenReallocationModal(prop)}
                        className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition shrink-0"
                      >
                        Review Proposal
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SLA At Risk List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tasks with Impending SLA Deadlines</h3>
                <p className="text-xs text-slate-500">Ordered by nearest deadline</p>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>All Tasks</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2">
              {tasks
                .filter((t) => t.status !== 'COMPLETED')
                .slice(0, 4)
                .map((task) => {
                  const diff = new Date(task.sla_deadline).getTime() - now;
                  const hoursLeft = Math.round(diff / (60 * 60 * 1000));
                  const isUrgent = hoursLeft <= 4;
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 flex items-center justify-between text-xs hover:bg-slate-100 transition"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                            task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            'bg-slate-200 text-slate-800'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="font-bold text-slate-900 truncate">{task.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-3">
                          <span>Effort: {task.estimated_effort}h</span>
                          <span>
                            Assignees:{' '}
                            {task.allocations && task.allocations.length > 0
                              ? task.allocations.map((a) => a.employee?.name).join(', ')
                              : 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-bold text-xs ${isUrgent ? 'text-amber-600 animate-pulse' : 'text-slate-600'}`}>
                          {hoursLeft > 0 ? `${hoursLeft}h left` : 'Overdue'}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {new Date(task.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Col: Workforce Saturation & Live Events */}
        <div className="space-y-6">
          {/* Workforce Capacity Meter */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Engineering Workload</h3>
              <button
                onClick={() => onNavigate('employees')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Directory
              </button>
            </div>

            <div className="space-y-3">
              {employees.slice(0, 6).map((emp) => (
                <div key={emp.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900">{emp.name}</span>
                      <span className="text-[10px] text-slate-400">({emp.team})</span>
                    </div>
                    <span className={`font-bold text-[11px] ${
                      emp.current_workload_percent >= 85 ? 'text-rose-600' :
                      emp.current_workload_percent >= 60 ? 'text-amber-600' : 'text-slate-700'
                    }`}>
                      {emp.current_workload_percent}%
                    </span>
                  </div>
                  {/* Meter Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        emp.current_workload_percent >= 85 ? 'bg-rose-500' :
                        emp.current_workload_percent >= 60 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(emp.current_workload_percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Event Audit Stream */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Operational Events</h3>
              <span className="text-[10px] text-slate-400 font-mono">LIVE FEED</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {events.slice(0, 6).map((ev) => (
                <div key={ev.id} className="text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px]">{ev.type}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                    {ev.payload?.title || ev.payload?.task_title || ev.payload?.reason || JSON.stringify(ev.payload)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
