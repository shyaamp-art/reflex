import React, { useState, useEffect } from 'react';
import { UserSession, Employee, Task } from '../../types/index.js';
import { api } from '../../lib/api.js';
import {
  CheckSquare,
  Clock,
  CalendarCheck,
  Zap,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface EmployeeDashboardProps {
  currentUser: UserSession;
  onNavigate: (tab: string) => void;
  onOpenLeaveModal: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  onNavigate,
  onOpenLeaveModal,
}) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assignedItems, setAssignedItems] = useState<{ allocation: any; task: Task }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployeeTasks(currentUser.employeeId || undefined);
      setEmployee(res.employee);
      setAssignedItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await api.updateEmployeeTaskStatus(taskId, status, currentUser.name);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
        <p className="text-xs text-slate-500 mt-2">Loading engineer workspace...</p>
      </div>
    );
  }

  const activeAssigned = assignedItems.filter((i) => i.task.status !== 'COMPLETED');
  const completedAssigned = assignedItems.filter((i) => i.task.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {employee?.role_title} &bull; {employee?.team.replace('_', ' ')} &bull; {employee?.location}
          </p>
        </div>
        <button
          onClick={onOpenLeaveModal}
          className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-95 shrink-0"
        >
          <CalendarCheck className="h-4 w-4" />
          <span>Report Leave / Unavailability</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active Assigned Tasks
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-black text-slate-900">{activeAssigned.length}</span>
            <span className="text-xs text-slate-500">In Sprint</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {completedAssigned.length} completed recently
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Current Workload Saturation
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-black text-indigo-600">
              {employee?.current_workload_percent || 0}%
            </span>
            <span className="text-xs text-slate-500">Target: 80%</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mt-2">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${Math.min(employee?.current_workload_percent || 0, 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Calendar Availability
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold text-slate-900">
              {employee?.availability && employee.availability.some((a) => !a.is_available)
                ? 'Leave Scheduled'
                : 'Available for Work'}
            </span>
          </div>
          <button
            onClick={() => onNavigate('availability')}
            className="text-[11px] text-indigo-600 font-semibold hover:underline mt-2 block"
          >
            Manage leave calendar &rarr;
          </button>
        </div>
      </div>

      {/* Active Work Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">My Assigned Tasks</h2>
            <p className="text-xs text-slate-500">Tasks allocated to you by the Reflex Decision Engine</p>
          </div>
          <button
            onClick={() => onNavigate('my-tasks')}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            View all
          </button>
        </div>

        {activeAssigned.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No active tasks currently assigned. Capacity is ready for new allocations!
          </div>
        ) : (
          <div className="space-y-3">
            {activeAssigned.map(({ task, allocation }) => {
              const diff = new Date(task.sla_deadline).getTime() - Date.now();
              const hoursLeft = Math.round(diff / (60 * 60 * 1000));
              const isUrgent = hoursLeft <= 4;

              return (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.priority === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : task.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{task.title}</span>
                    </div>
                    <p className="text-xs text-slate-600">{task.description}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span>Effort: {task.estimated_effort} hours</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        SLA: <strong className={isUrgent ? 'text-amber-600' : 'text-slate-700'}>{hoursLeft}h left</strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {task.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                        className="flex items-center space-x-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Play className="h-3.5 w-3.5 text-blue-600" />
                        <span>Start Work</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                      className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Complete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
