import React, { useState } from 'react';
import { Priority, WorkMode, Proficiency } from '../../types/index.js';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeSuggestions: (formData: any) => void;
  availableSkills: string[];
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeSuggestions,
  availableSkills,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [estimatedEffort, setEstimatedEffort] = useState(12);
  const [requiredLocation, setRequiredLocation] = useState<WorkMode>('REMOTE');
  const [tagsInput, setTagsInput] = useState('stripe, payments');

  // Default SLA: 24h from now
  const defaultSla = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [slaDeadline, setSlaDeadline] = useState(defaultSla);

  const [skills, setSkills] = useState<
    { skill_name: string; proficiency: Proficiency; people_required: number; requirement_type: 'MUST_HAVE' | 'NICE_TO_HAVE' }[]
  >([
    { skill_name: 'stripe', proficiency: 'ADVANCED', people_required: 1, requirement_type: 'MUST_HAVE' },
  ]);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    setSkills([
      ...skills,
      { skill_name: availableSkills[0] || 'typescript', proficiency: 'INTERMEDIATE', people_required: 1, requirement_type: 'MUST_HAVE' },
    ]);
  };

  const handleRemoveSkill = (idx: number) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  const getPayload = () => {
    const tags = tagsInput.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    return {
      title,
      description,
      priority,
      sla_deadline: new Date(slaDeadline).toISOString(),
      estimated_effort: Number(estimatedEffort),
      tags,
      required_location: requiredLocation,
      skill_requirements: skills,
    };
  };

  const handleRunAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert('Task title is required');
    onAnalyzeSuggestions(getPayload());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Define New Task & Demand</h2>
              <p className="text-xs text-slate-500">Configure SLA, effort, and hard skill constraints</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleRunAi} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">Assignment method</span>
            <p className="mt-1 text-xs text-slate-600">Reflex will evaluate eligible employees and recommend assignments using the configured decision engine.</p>
          </div>
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Lock Contention in Payment Gateway"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Context
            </label>
            <textarea
              rows={2}
              placeholder="Describe failure symptoms, target outcome, and environment details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 outline-none"
            />
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-indigo-600 outline-none"
              >
                <option value="CRITICAL">CRITICAL (Immediate)</option>
                <option value="HIGH">HIGH (Urgent)</option>
                <option value="MEDIUM">MEDIUM (Standard)</option>
                <option value="LOW">LOW (Backlog)</option>
              </select>
            </div>

            {/* Estimated Effort */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Effort (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={estimatedEffort}
                onChange={(e) => setEstimatedEffort(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 outline-none"
              />
            </div>

            {/* Required Work Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Work Mode
              </label>
              <select
                value={requiredLocation}
                onChange={(e) => setRequiredLocation(e.target.value as WorkMode)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-indigo-600 outline-none"
              >
                <option value="REMOTE">REMOTE (Anywhere)</option>
                <option value="HYBRID">HYBRID (Office Optional)</option>
                <option value="ONSITE">ONSITE (Physical)</option>
              </select>
            </div>
          </div>

          {/* SLA Deadline & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                SLA Deadline (Local UTC) *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  value={slaDeadline}
                  onChange={(e) => setSlaDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tags (Comma-Separated)
              </label>
              <input
                type="text"
                placeholder="e.g. stripe, redis, payments"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          {/* Required Skills Section */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Required Skill Capabilities
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Enforces deterministic matching: MUST_HAVE skills are hard rejection gates.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddSkill}
                className="inline-flex items-center space-x-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
              >
                <Plus className="h-3 w-3" />
                <span>Add Skill</span>
              </button>
            </div>

            <div className="space-y-2">
              {skills.map((skill, idx) => (
                <div key={idx} className="flex items-center space-x-2 rounded-xl bg-slate-50 p-2 border border-slate-200">
                  <input
                    type="text"
                    placeholder="Skill name (e.g. stripe)"
                    value={skill.skill_name}
                    onChange={(e) => {
                      const updated = [...skills];
                      updated[idx].skill_name = e.target.value;
                      setSkills(updated);
                    }}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
                  />

                  <select
                    value={skill.proficiency}
                    onChange={(e) => {
                      const updated = [...skills];
                      updated[idx].proficiency = e.target.value as Proficiency;
                      setSkills(updated);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium outline-none"
                  >
                    <option value="BEGINNER">BEGINNER (L1)</option>
                    <option value="INTERMEDIATE">INTERMEDIATE (L2)</option>
                    <option value="ADVANCED">ADVANCED (L3)</option>
                    <option value="EXPERT">EXPERT (L4)</option>
                  </select>

                  <select
                    value={skill.requirement_type}
                    onChange={(e) => {
                      const updated = [...skills];
                      updated[idx].requirement_type = e.target.value as any;
                      setSkills(updated);
                    }}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-bold outline-none ${
                      skill.requirement_type === 'MUST_HAVE'
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <option value="MUST_HAVE">MUST HAVE</option>
                    <option value="NICE_TO_HAVE">NICE TO HAVE</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    disabled={skills.length === 1}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button type="button" onClick={onClose} className="text-xs text-slate-600 font-semibold hover:underline">Cancel</button>

            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Get AI Candidate Suggestions</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
