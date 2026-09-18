import React, { useState, useEffect } from 'react';
import { Task, AllocationLog, AppEvent } from '../../types/index.js';
import { api } from '../../lib/api.js';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  UserX,
  History,
  Layers,
} from 'lucide-react';

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
  onUpdateStatus: (taskId: string, status: string) => void;
  onReleaseAllocation: (taskId: string, allocationId: string) => void;
  onRequestSuggestions: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  onClose,
  onUpdateStatus,
  onReleaseAllocation,
  onRequestSuggestions,
}) => {
  const [data, setData] = useState<{
    task: Task;
    requirements: any[];
    allocations: any[];
    audit_logs: AllocationLog[];
    events: AppEvent[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const res = await api.getTask(taskId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [taskId]);

  if (!taskId) return null;

  const task = data?.task;
  const now = Date.now();
  const diff = task ? new Date(task.sla_deadline).getTime() - now : 0;
  const hoursLeft = Math.round(diff / (60 * 60 * 1000));
  const isUrgent = task && task.status !== 'COMPLETED' && hoursLeft <= 4;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                task?.priority === 'CRITICAL'
                  ? 'bg-rose-100 text-rose-800'
                  : task?.priority === 'HIGH'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {task?.priority}
            </span>
            <h2 className="text-base font-bold text-slate-900 truncate max-w-md">{task?.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading || !task ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading task telemetry...</div>
        ) : (
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
            {/* Description & Context */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Description
              </span>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {task.description || 'No additional description provided.'}
              </p>
            </div>

            {/* SLA & Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">{task.status}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Effort</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">{task.estimated_effort} Hours</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Location Req</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">{task.required_location}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">SLA Clock</span>
                <span className={`font-bold text-xs mt-0.5 block ${isUrgent ? 'text-amber-600 font-black animate-pulse' : 'text-slate-900'}`}>
                  {hoursLeft > 0 ? `${hoursLeft}h remaining` : 'Overdue'}
                </span>
              </div>
            </div>

            {/* Active Allocations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Allocated Staff
                </span>
                {task.status === 'UNASSIGNED' && (
                  <button
                    onClick={() => {
                      onClose();
                      onRequestSuggestions(task);
                    }}
                    className="flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:underline"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Run AI Allocation Suggestions</span>
                  </button>
                )}
              </div>

              {data.allocations.filter((a) => a.status === 'ACTIVE').length === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-center text-amber-800 font-medium">
                  Currently Unassigned. Reflex engine is ready to match optimal candidates.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.allocations
                    .filter((a) => a.status === 'ACTIVE')
                    .map((alloc) => (
                      <div
                        key={alloc.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={alloc.employee?.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{alloc.employee?.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {alloc.employee?.role_title} &bull; Load: {alloc.employee?.current_workload_percent}%
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (confirm(`Release ${alloc.employee?.name} from task? This will free capacity and can trigger reallocation.`)) {
                              onReleaseAllocation(task.id, alloc.id);
                              load();
                            }
                          }}
                          className="flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          <span>Release Assignee</span>
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Audit Logs Specific to this Task */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Task Decision Provenance
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {data.audit_logs.length === 0 ? (
                  <p className="text-slate-400 italic">No audit records for this task yet.</p>
                ) : (
                  data.audit_logs.map((log) => (
                    <div key={log.id} className="rounded-lg bg-slate-50 p-2 border border-slate-100 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{log.reason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {task && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {task.status === 'ASSIGNED' && (
                <button
                  onClick={() => {
                    onUpdateStatus(task.id, 'IN_PROGRESS');
                    load();
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Mark In Progress
                </button>
              )}
              {task.status !== 'COMPLETED' && (
                <button
                  onClick={() => {
                    onUpdateStatus(task.id, 'COMPLETED');
                    load();
                  }}
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  Mark Completed
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
