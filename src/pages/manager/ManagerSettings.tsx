import React, { useState, useEffect } from 'react';
import { AgentSettings } from '../../types/index.js';
import { api } from '../../lib/api.js';
import { Sliders, Save, Plus, Check, Shield } from 'lucide-react';

interface ManagerSettingsProps {
  settings: AgentSettings;
  onUpdateSettings: (newSettings: Partial<AgentSettings>) => void;
  skills: string[];
  onAddSkill: (skill: string) => void;
}

export const ManagerSettings: React.FC<ManagerSettingsProps> = ({
  settings,
  onUpdateSettings,
  skills,
  onAddSkill,
}) => {
  const [slaLookahead, setSlaLookahead] = useState(settings.sla_lookahead_hours);
  const [slaInterval, setSlaInterval] = useState(settings.sla_scan_interval_minutes);
  const [softLimit, setSoftLimit] = useState(settings.workload_soft_limit);
  const [hardLimit, setHardLimit] = useState(settings.workload_hard_limit);
  const [newSkillName, setNewSkillName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setSlaLookahead(settings.sla_lookahead_hours);
    setSlaInterval(settings.sla_scan_interval_minutes);
    setSoftLimit(settings.workload_soft_limit);
    setHardLimit(settings.workload_hard_limit);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      sla_lookahead_hours: Number(slaLookahead),
      sla_scan_interval_minutes: Number(slaInterval),
      workload_soft_limit: Number(softLimit),
      workload_hard_limit: Number(hardLimit),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddNewSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    onAddSkill(newSkillName.trim().toLowerCase());
    setNewSkillName('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Agent Policy & Engine Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tune deterministic thresholds, SLA breach lookaheads, and manage enterprise competency taxonomies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Policy Thresholds Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sliders className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">SLA Defenses & Capacity Limits</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                SLA Lookahead Window (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="48"
                value={slaLookahead}
                onChange={(e) => setSlaLookahead(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-indigo-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tasks with deadlines under this threshold trigger SLA risk warnings and dynamic reallocation checks.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Cron Scan Interval (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={slaInterval}
                onChange={(e) => setSlaInterval(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-indigo-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                How often the background worker scans all active tasks for SLA drift.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Workload Soft Limit (%)
              </label>
              <input
                type="number"
                min="50"
                max="95"
                value={softLimit}
                onChange={(e) => setSoftLimit(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-indigo-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Above this load, candidate allocation score degrades sharply to prevent burnout.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Workload Hard Limit (%)
              </label>
              <input
                type="number"
                min="80"
                max="120"
                value={hardLimit}
                onChange={(e) => setHardLimit(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs outline-none focus:border-indigo-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Strict gatekeeper rejection: engineers at or above this projected load are completely disqualified.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              {savedSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              <span>{savedSuccess ? 'Settings Saved' : 'Save Policies'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Skills Catalog */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Master Skills Taxonomy</h2>
            <p className="text-xs text-slate-500">Official technical competencies recognized by the matcher</p>
          </div>
          <span className="text-xs font-bold text-slate-400">{skills.length} Registered</span>
        </div>

        <form onSubmit={handleAddNewSkill} className="flex gap-2">
          <input
            type="text"
            placeholder="Add new competency (e.g. rust, graphql, k8s)..."
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs outline-none focus:border-indigo-600"
          />
          <button
            type="submit"
            className="flex items-center space-x-1 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Skill</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5 pt-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
