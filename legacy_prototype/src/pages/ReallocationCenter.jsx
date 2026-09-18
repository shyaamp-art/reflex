import React from 'react';
import { 
  Shuffle, 
  Sparkles, 
  UserX, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  BrainCircuit, 
  Clock, 
  ShieldAlert,
  Activity
} from 'lucide-react';
import { useWorkforce } from '../context/WorkforceContext';

export const ReallocationCenter = () => {
  const { 
    reallocationHistory, 
    triggerUrgentTaskSimulation, 
    toggleEmployeeAvailability,
    employees,
    setActiveReasoning,
    setCurrentScreen
  } = useWorkforce();

  const availableEmp = employees.find(e => e.availability === 'Available');

  return (
    <div>
      <div className="sub-navbar">
        <div>
          <h1 className="page-headline">Dynamic Reallocation Center</h1>
          <div className="breadcrumb-trail">
            <span>Material Admin</span>
            <span>&gt;</span>
            <span>Autonomous Intelligence</span>
            <span>&gt;</span>
            <span className="active">Continuous Adjustment Pipeline</span>
          </div>
        </div>

        <div className="sub-nav-actions">
          <button 
            className="action-pill-btn"
            style={{ background: '#4880FF', color: '#ffffff', border: 'none' }}
            onClick={triggerUrgentTaskSimulation}
          >
            <Sparkles size={14} />
            <span>Simulate P0 Task Influx</span>
          </button>
        </div>
      </div>

      {/* TOP SIMULATION PROMPT BANNER */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        color: '#ffffff',
        padding: '24px 28px',
        marginBottom: '24px',
        border: 'none',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', fontSize: '0.8125rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
              <BrainCircuit size={16} />
              <span>Real-Time Autonomous Re-Optimization Engine</span>
            </div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: '800', marginBottom: '8px' }}>
              Dynamic Workforce Adaptation Under Shifting Circumstances
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: '1.5' }}>
              When high-priority tasks arrive or engineers become unavailable, Reflex AI recomputes the optimal allocation plan in milliseconds, balancing skills, workload, and SLA risk without human bottlenecks.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="action-pill-btn"
              style={{ background: '#4880FF', color: '#ffffff', border: 'none', padding: '10px 18px', fontWeight: '700' }}
              onClick={triggerUrgentTaskSimulation}
            >
              <Sparkles size={16} />
              <span>1. Ingest Urgent P0 Task</span>
            </button>

            {availableEmp && (
              <button 
                className="action-pill-btn"
                style={{ background: '#EA5455', color: '#ffffff', border: 'none', padding: '10px 18px', fontWeight: '700' }}
                onClick={() => toggleEmployeeAvailability(availableEmp.id, 'Sick')}
              >
                <UserX size={16} />
                <span>2. Mark {availableEmp.name.split(' ')[0]} Sick</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* REALLOCATION EVENTS FEED WITH BEFORE -> AFTER VISUAL DIFF */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#1E293B' }}>
            Live Reallocation Event Stream ({reallocationHistory.length})
          </h3>
          <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            Telemetry synced to team schedule
          </span>
        </div>

        {reallocationHistory.map((item, idx) => (
          <div 
            key={item.id || idx}
            className="card"
            style={{
              borderLeft: '5px solid #FF9F43',
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{
                    background: '#FFF5EC',
                    color: '#FF9F43',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '3px 10px',
                    borderRadius: '6px'
                  }}>
                    TRIGGER: {item.trigger}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600' }}>
                    {item.timestamp}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#1E293B', marginBottom: '8px' }}>
                  {item.taskTitle}
                </h3>

                {/* BEFORE -> AFTER ALLOCATION DIFF */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: '#F8FAFD',
                  border: '1px solid #E6EDF9',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  margin: '12px 0'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>
                      Previous Assignment
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#64748B' }}>
                      {item.previousAssigned.join(', ')}
                    </div>
                  </div>

                  <div style={{ color: '#4880FF' }}>
                    <ArrowRight size={22} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#00B69B', textTransform: 'uppercase' }}>
                      Dynamically Reallocated Assignment
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: '800', color: '#00B69B' }}>
                      {item.newAssigned.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Reasoning text */}
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.5' }}>
                  {item.reasoning}
                </p>

                {/* SLA Impact */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '0.8125rem', color: '#00B69B', fontWeight: '700' }}>
                  <ShieldAlert size={16} />
                  <span>{item.slaImpact}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="action-pill-btn"
                  style={{ background: '#EEF4FE', color: '#4880FF', border: '1px solid #C4D9FF', fontWeight: '700' }}
                  onClick={() => setActiveReasoning(item)}
                >
                  <BrainCircuit size={15} />
                  <span>View Full Reasoning</span>
                </button>

                <button
                  className="action-pill-btn"
                  onClick={() => setCurrentScreen('task-board')}
                >
                  <span>Verify on Board →</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
