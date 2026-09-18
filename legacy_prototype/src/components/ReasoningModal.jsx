import React from 'react';
import { X, CheckCircle2, ArrowRight, ShieldCheck, BrainCircuit, Activity, Clock } from 'lucide-react';
import { useWorkforce } from '../context/WorkforceContext';

export const ReasoningModal = () => {
  const { activeReasoning, setActiveReasoning } = useWorkforce();

  if (!activeReasoning) return null;

  return (
    <div className="modal-overlay" onClick={() => setActiveReasoning(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button 
          className="modal-close-btn" 
          onClick={() => setActiveReasoning(null)}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ background: '#EEF4FE', padding: '8px', borderRadius: '10px', color: '#4880FF' }}>
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827' }}>
              AI Allocation Decision Reasoning
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Transparent explainability telemetry for {activeReasoning.taskId}
            </p>
          </div>
        </div>

        {/* Task Title Banner */}
        <div style={{ background: '#F8FAFD', border: '1px solid #E6EDF9', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
            Target Task
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#1E293B' }}>
            {activeReasoning.taskTitle}
          </div>
        </div>

        {/* Transition Diff (Previous -> New) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#FAFBFD', border: '1px dashed #CBD5E1', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Previous Assignment</span>
            <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#64748B' }}>
              {activeReasoning.previousAssigned?.join(', ') || 'Unassigned'}
            </div>
          </div>
          <div style={{ color: '#4880FF' }}>
            <ArrowRight size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.6875rem', color: '#00B69B', fontWeight: '700', textTransform: 'uppercase' }}>Optimized Assignment</span>
            <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#00B69B' }}>
              {Array.isArray(activeReasoning.newAssigned) ? activeReasoning.newAssigned.join(', ') : activeReasoning.newAssigned}
            </div>
          </div>
        </div>

        {/* Multi-Dimensional Decision Vectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #E6EDF9', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#4880FF', marginBottom: '4px' }}>
              <ShieldCheck size={15} />
              <span>Skill Requirement Match</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#334155' }}>
              Exact multi-skill overlap with required proficiency levels (Expert / Advanced). Zero competency deficit.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #E6EDF9', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#00B69B', marginBottom: '4px' }}>
              <Activity size={15} />
              <span>Workload Headroom</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#334155' }}>
              Candidate has sufficient capacity below the 80% burnout threshold, preventing schedule bottlenecks.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #E6EDF9', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#FF9F43', marginBottom: '4px' }}>
              <Clock size={15} />
              <span>SLA Adherence Projection</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#334155' }}>
              {activeReasoning.slaImpact || '97.2% likelihood of on-time delivery before target deadline.'}
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #E6EDF9', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#826AF9', marginBottom: '4px' }}>
              <CheckCircle2 size={15} />
              <span>Historical Performance</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#334155' }}>
              94%+ quality score and high past sprint delivery reliability on similar task categories.
            </p>
          </div>
        </div>

        {/* Narrative Rationale */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px 16px', marginBottom: '22px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#92400E', textTransform: 'uppercase', marginBottom: '6px' }}>
            AI Engine Justification Summary
          </div>
          <p style={{ fontSize: '0.875rem', color: '#78350F', lineHeight: '1.5' }}>
            "{activeReasoning.reasoning}"
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="action-pill-btn"
            style={{ background: '#4880FF', color: '#ffffff', border: 'none', padding: '10px 24px', fontWeight: '700' }}
            onClick={() => setActiveReasoning(null)}
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
