import React, { useState } from 'react';
import { Employee } from '../../types/index.js';
import { Search, Filter, MapPin, Globe, CheckCircle2, AlertCircle, Briefcase } from 'lucide-react';

interface ManagerEmployeesProps {
  employees: Employee[];
  onSelectEmployee?: (emp: Employee) => void;
}

export const ManagerEmployees: React.FC<ManagerEmployeesProps> = ({ employees, onSelectEmployee }) => {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [workloadFilter, setWorkloadFilter] = useState('ALL');

  const filtered = employees.filter((emp) => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        emp.name.toLowerCase().includes(q) ||
        emp.role_title.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.skills.some((s) => s.skill_name.toLowerCase().includes(q));
      if (!matches) return false;
    }

    if (teamFilter !== 'ALL' && emp.team !== teamFilter) return false;
    if (workloadFilter === 'high' && emp.current_workload_percent < 80) return false;
    if (workloadFilter === 'normal' && emp.current_workload_percent >= 80) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Engineering Workforce Directory</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time workload saturation, verified skill proficiencies, and operational capacity.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by engineer name, role, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-1.5 text-xs outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Teams</option>
            <option value="CORE_BACKEND">Core Backend</option>
            <option value="INFRA_CLOUD">Infra & Cloud</option>
            <option value="FRONTEND_ENG">Frontend Eng</option>
            <option value="SECURITY">Security</option>
          </select>

          <select
            value={workloadFilter}
            onChange={(e) => setWorkloadFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Workloads</option>
            <option value="high">High Saturation (&ge; 80%)</option>
            <option value="normal">Normal Capacity (&lt; 80%)</option>
          </select>
        </div>
      </div>

      {/* Grid of Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((emp) => {
          const isHigh = emp.current_workload_percent >= 85;
          const isMedium = emp.current_workload_percent >= 60;
          return (
            <div
              key={emp.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                {/* Top User Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={emp.avatar_url}
                      alt={emp.name}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                      <p className="text-xs text-slate-500">{emp.role_title}</p>
                      <span className="text-[10px] text-indigo-700 font-semibold uppercase">
                        {emp.seniority} &bull; {emp.team.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                      emp.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {emp.status}
                  </span>
                </div>

                {/* Location & Timezone */}
                <div className="mt-3 flex items-center space-x-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    {emp.location} ({emp.work_mode})
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-slate-400" />
                    {emp.timezone}
                  </span>
                </div>

                {/* Workload Meter */}
                <div className="mt-4 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium text-[11px]">Allocated Load</span>
                    <span
                      className={`font-bold text-xs ${
                        isHigh ? 'text-rose-600' : isMedium ? 'text-amber-600' : 'text-slate-800'
                      }`}
                    >
                      {emp.current_workload_percent}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(emp.current_workload_percent, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Active tasks: {(emp as any).activeAllocationsCount || 0}</span>
                    <span>Soft limit: 80%</span>
                  </div>
                </div>

                {/* Skills Badges */}
                <div className="mt-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Verified Competencies
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {emp.skills.map((s) => (
                      <span
                        key={s.id}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200"
                      >
                        {s.skill_name} <strong className="text-indigo-700">({s.proficiency.slice(0, 3)})</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unavailability warning if any */}
              {emp.availability && emp.availability.some((a) => !a.is_available) && (
                <div className="mt-3 rounded-lg bg-rose-50 p-2 text-[10px] text-rose-800 border border-rose-100 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <span>Has scheduled leave on calendar</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
