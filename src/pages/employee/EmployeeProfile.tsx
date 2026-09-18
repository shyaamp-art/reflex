import React, { useState, useEffect } from 'react';
import { UserSession, Employee, Proficiency } from '../../types/index.js';
import { api } from '../../lib/api.js';
import { User, Plus, Trash2, Check, Save, ShieldCheck } from 'lucide-react';

interface EmployeeProfileProps {
  currentUser: UserSession;
  availableSkills: string[];
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ currentUser, availableSkills }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [workMode, setWorkMode] = useState('REMOTE');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('');
  const [skills, setSkills] = useState<{ skill_name: string; proficiency: Proficiency; verified: boolean }[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadData = async () => {
    if (!currentUser.employeeId) return;
    try {
      setLoading(true);
      const res = await api.getEmployee(currentUser.employeeId);
      setEmployee(res.employee);
      setWorkMode(res.employee.work_mode);
      setLocation(res.employee.location);
      setTimezone(res.employee.timezone);
      setSkills(res.skills);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleAddSkill = () => {
    setSkills([
      ...skills,
      { skill_name: availableSkills[0] || 'typescript', proficiency: 'INTERMEDIATE', verified: true },
    ]);
  };

  const handleRemoveSkill = (idx: number) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.employeeId) return;
    try {
      await api.updateEmployee(currentUser.employeeId, {
        work_mode: workMode as any,
        location,
        timezone,
      });
      await api.updateEmployeeSkills(currentUser.employeeId, skills);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error saving profile');
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Engineer Profile & Competencies</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Your skills and work mode directly power Reflex's candidate matching algorithm.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <img
              src={employee?.avatar_url}
              alt=""
              className="h-14 w-14 rounded-full object-cover ring-2 ring-indigo-600"
            />
            <div>
              <h2 className="text-base font-bold text-slate-900">{employee?.name}</h2>
              <p className="text-xs text-slate-500">
                {employee?.role_title} &bull; {employee?.seniority} &bull; {employee?.team.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Work Mode
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-600"
              >
                <option value="REMOTE">REMOTE</option>
                <option value="HYBRID">HYBRID</option>
                <option value="ONSITE">ONSITE</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Competencies */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Verified Technical Skills</h2>
              <p className="text-xs text-slate-500">
                Used to evaluate hard constraints and skill match percentages (35% weight)
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSkill}
              className="flex items-center space-x-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Plus className="h-3 w-3" />
              <span>Add Skill</span>
            </button>
          </div>

          <div className="space-y-2">
            {skills.map((s, idx) => (
              <div key={idx} className="flex items-center space-x-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <input
                  type="text"
                  placeholder="Skill name"
                  value={s.skill_name}
                  onChange={(e) => {
                    const updated = [...skills];
                    updated[idx].skill_name = e.target.value;
                    setSkills(updated);
                  }}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                />

                <select
                  value={s.proficiency}
                  onChange={(e) => {
                    const updated = [...skills];
                    updated[idx].proficiency = e.target.value as Proficiency;
                    setSkills(updated);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium outline-none"
                >
                  <option value="BEGINNER">BEGINNER (L1)</option>
                  <option value="INTERMEDIATE">INTERMEDIATE (L2)</option>
                  <option value="ADVANCED">ADVANCED (L3)</option>
                  <option value="EXPERT">EXPERT (L4)</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemoveSkill(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition active:scale-95"
          >
            {savedSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            <span>{savedSuccess ? 'Profile Updated' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
