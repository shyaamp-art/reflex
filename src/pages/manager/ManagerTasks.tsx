import React, { useState } from 'react';
import { Task, Priority } from '../../types/index.js';
import {
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Filter,
  MoreVertical,
  Layers,
  Trash2,
  Play,
  Pause,
  UserPlus,
} from 'lucide-react';

interface ManagerTasksProps {
  tasks: Task[];
  onNewTaskClick: () => void;
  onSelectTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, status: string) => void;
  onDeleteTask: (taskId: string) => void;
  onRequestSuggestionsForTask: (task: Task) => void;
}

export const ManagerTasks: React.FC<ManagerTasksProps> = ({
  tasks,
  onNewTaskClick,
  onSelectTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onRequestSuggestionsForTask,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [slaFilterOnly, setSlaFilterOnly] = useState(false);

  const now = Date.now();
  const fourHoursMs = 4 * 60 * 60 * 1000;

  const filteredTasks = tasks.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));
      if (!matches) return false;
    }

    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

    if (slaFilterOnly) {
      const diff = new Date(t.sla_deadline).getTime() - now;
      if (t.status === 'COMPLETED' || diff <= 0 || diff > fourHoursMs) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Demand Backlog & Tasks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational demand queue with deterministic skill requirements and SLA deadline tracking.
          </p>
        </div>
        <button
          onClick={onNewTaskClick}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, description, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-1.5 text-xs outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* SLA At Risk Toggle */}
          <button
            onClick={() => setSlaFilterOnly(!slaFilterOnly)}
            className={`flex items-center space-x-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              slaFilterOnly
                ? 'border-amber-400 bg-amber-50 text-amber-900'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className={`h-3.5 w-3.5 ${slaFilterOnly ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>SLA &lt; 4h</span>
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Task Details</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">SLA Deadline</th>
              <th className="px-4 py-3">Assigned Engineers</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  No tasks found matching current filters.
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => {
                const diff = new Date(task.sla_deadline).getTime() - now;
                const hoursLeft = Math.round(diff / (60 * 60 * 1000));
                const isAtRisk = task.status !== 'COMPLETED' && diff > 0 && diff <= fourHoursMs;
                const isOverdue = task.status !== 'COMPLETED' && diff <= 0;

                return (
                  <tr key={task.id} className="hover:bg-slate-50/60 transition">
                    {/* Task Title & Skills */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <button
                          onClick={() => onSelectTask(task)}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-left text-xs transition"
                        >
                          {task.title}
                        </button>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{task.description}</p>
                        {/* Skills pills */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.skill_requirements?.map((req) => (
                            <span
                              key={req.id}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200/60"
                            >
                              {req.skill_name} ({req.proficiency.slice(0, 3)})
                            </span>
                          ))}
                          <span className="text-[10px] text-slate-400 ml-1">
                            &bull; {task.estimated_effort}h effort
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.priority === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : task.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : task.priority === 'MEDIUM'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : task.status === 'ASSIGNED'
                            ? 'bg-purple-100 text-purple-800'
                            : task.status === 'ON_HOLD'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>

                    {/* SLA Deadline */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span
                          className={`font-bold text-xs flex items-center gap-1 ${
                            isOverdue
                              ? 'text-rose-600'
                              : isAtRisk
                              ? 'text-amber-600 font-extrabold animate-pulse'
                              : 'text-slate-700'
                          }`}
                        >
                          {(isAtRisk || isOverdue) && <Clock className="h-3 w-3" />}
                          {isOverdue ? 'Overdue' : `${hoursLeft}h remaining`}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(task.sla_deadline).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Assigned Engineers */}
                    <td className="px-4 py-3.5">
                      {task.allocations && task.allocations.filter((a) => a.status === 'ACTIVE').length > 0 ? (
                        <div className="space-y-1">
                          {task.allocations
                            .filter((a) => a.status === 'ACTIVE')
                            .map((a) => (
                              <div key={a.id} className="flex items-center space-x-1.5 text-[11px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="font-semibold text-slate-800">{a.employee?.name}</span>
                                <span className="text-slate-400 text-[10px]">
                                  ({a.employee?.current_workload_percent}%)
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-semibold italic">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Quick Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        {/* If unassigned, show Quick AI Allocation */}
                        {task.status === 'UNASSIGNED' && (
                          <button
                            onClick={() => onRequestSuggestionsForTask(task)}
                            className="inline-flex items-center space-x-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition"
                            title="Run AI Suggestion Engine"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>AI Assign</span>
                          </button>
                        )}

                        {/* Status Toggle buttons */}
                        {task.status === 'ASSIGNED' && (
                          <button
                            onClick={() => onUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition"
                            title="Mark In Progress"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {task.status !== 'COMPLETED' && (
                          <button
                            onClick={() => onUpdateTaskStatus(task.id, 'COMPLETED')}
                            className="rounded-lg p-1.5 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
                            title="Mark Completed (releases capacity)"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Delete Task */}
                        <button
                          onClick={() => {
                            if (confirm(`Delete task "${task.title}"? This will release any active allocations.`)) {
                              onDeleteTask(task.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
