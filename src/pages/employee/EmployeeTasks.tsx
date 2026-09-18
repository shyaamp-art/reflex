import React, { useState, useEffect } from 'react';
import { UserSession, Task } from '../../types/index.js';
import { api } from '../../lib/api.js';
import { CheckSquare, Clock, CheckCircle2, Play, AlertCircle, Layers } from 'lucide-react';

interface EmployeeTasksProps {
  currentUser: UserSession;
}

export const EmployeeTasks: React.FC<EmployeeTasksProps> = ({ currentUser }) => {
  const [items, setItems] = useState<{ allocation: any; task: Task }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployeeTasks(currentUser.employeeId || undefined);
      setItems(res.items);
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

  const filtered = items.filter((i) =>
    activeTab === 'ACTIVE' ? i.task.status !== 'COMPLETED' : i.task.status === 'COMPLETED'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Assigned Work</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tasks allocated to you based on your verified skills, current capacity, and SLA commitments.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`rounded-lg px-3.5 py-1.5 transition ${
              activeTab === 'ACTIVE' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
            }`}
          >
            In Progress & Backlog ({items.filter((i) => i.task.status !== 'COMPLETED').length})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`rounded-lg px-3.5 py-1.5 transition ${
              activeTab === 'COMPLETED' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
            }`}
          >
            Completed ({items.filter((i) => i.task.status === 'COMPLETED').length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 text-xs">
          No tasks found in this view.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ task, allocation }) => {
            const diff = new Date(task.sla_deadline).getTime() - Date.now();
            const hoursLeft = Math.round(diff / (60 * 60 * 1000));
            const isUrgent = task.status !== 'COMPLETED' && hoursLeft <= 4 && hoursLeft > 0;

            return (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
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
                      <span className="text-sm font-bold text-slate-900">{task.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold flex items-center justify-end gap-1 ${
                        isUrgent ? 'text-amber-600 animate-pulse' : 'text-slate-600'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {task.status === 'COMPLETED' ? 'Completed' : `${hoursLeft}h until SLA`}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Deadline: {new Date(task.sla_deadline).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Footer details & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Effort: {task.estimated_effort}h
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    {task.skill_requirements?.map((req) => (
                      <span
                        key={req.id}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                      >
                        {req.skill_name} ({req.proficiency.slice(0, 3)})
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {task.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                        className="flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Play className="h-3.5 w-3.5 text-blue-600" />
                        <span>Start Work</span>
                      </button>
                    )}
                    {task.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                        className="flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark as Completed</span>
                      </button>
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
