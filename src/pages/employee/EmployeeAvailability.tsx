import React, { useState, useEffect } from 'react';
import { UserSession } from '../../types/index.js';
import { api } from '../../lib/api.js';
import { CalendarCheck, AlertTriangle, Plus, Trash2, CheckCircle2, Zap } from 'lucide-react';

interface EmployeeAvailabilityProps {
  currentUser: UserSession;
}

export const EmployeeAvailability: React.FC<EmployeeAvailabilityProps> = ({ currentUser }) => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState('Medical leave / Unplanned sickness');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'alert' } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployeeAvailability(currentUser.employeeId || undefined);
      setLeaves(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.employeeId) return;

    try {
      const res = await api.setEmployeeAvailability({
        employee_id: currentUser.employeeId,
        start_date: startDate,
        end_date: endDate,
        is_available: false,
        reason,
      });

      if (res.affected_tasks_count > 0) {
        setNotification({
          message: `Leave recorded. ${res.affected_tasks_count} active task(s) affected. Reflex automatically spawned ${res.created_proposals_count} reallocation proposal(s) for manager approval!`,
          type: 'alert',
        });
      } else {
        setNotification({
          message: 'Leave schedule recorded successfully. No active tasks impacted.',
          type: 'success',
        });
      }

      loadData();
      setTimeout(() => setNotification(null), 7000);
    } catch (err: any) {
      alert(err.message || 'Error reporting leave');
    }
  };

  const handleDeleteLeave = async (id: string) => {
    try {
      await api.deleteEmployeeAvailability(id, currentUser.employeeId || undefined);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave & Calendar Availability</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Mark planned vacations, medical leave, or emergency unavailabilities.
        </p>
      </div>

      {notification && (
        <div
          className={`rounded-2xl border p-4 text-xs flex items-start space-x-3 animate-in fade-in duration-200 ${
            notification.type === 'alert'
              ? 'border-indigo-300 bg-indigo-50 text-indigo-950'
              : 'border-emerald-300 bg-emerald-50 text-emerald-950'
          }`}
        >
          {notification.type === 'alert' ? (
            <Zap className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold">Autonomous Reflex Reallocation Activated</p>
            <p className="mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <CalendarCheck className="h-4 w-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">Submit Unavailability Window</h2>
        </div>

        <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason / Context *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Flu, bereavement, approved vacation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-indigo-600"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition active:scale-95 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Submit Leave Window</span>
            </button>
          </div>
        </form>
      </div>

      {/* Existing Leaves List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Scheduled Unavailabilities ({leaves.length})
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading availability...</div>
        ) : leaves.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No active leave windows on record.</p>
        ) : (
          <div className="space-y-2">
            {leaves.map((leave) => (
              <div
                key={leave.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{leave.reason}</span>
                    <span className="rounded bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold">
                      UNAVAILABLE
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {new Date(leave.start_date).toLocaleDateString()} &mdash;{' '}
                    {new Date(leave.end_date).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteLeave(leave.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Remove leave"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
