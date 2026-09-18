import React from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  GraduationCap, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useWorkforce } from '../context/WorkforceContext';

export const SkillGapAnalysis = () => {
  const { employees, tasks, setCurrentScreen } = useWorkforce();

  const skillDemands = [
    {
      skill: 'Node.js+Stripe Payments',
      demandHours: 120,
      supplyHours: 56,
      deficitHours: 64,
      riskLevel: 'Critical',
      impact: 'High risk of delivery bottleneck on upcoming Q4 checkout expansion.',
      recommendation: 'Cross-train Devon Miles with Marcus Vance; Sponsor Stripe Certified Developer exam.',
      actionType: 'Upskill'
    },
    {
      skill: 'Distributed Kafka Streams',
      demandHours: 90,
      supplyHours: 40,
      deficitHours: 50,
      riskLevel: 'Moderate',
      impact: 'Webhook ingestion scaling may require contractor support if volume doubles.',
      recommendation: 'Pair Aarav Patel with senior distributed systems mentor.',
      actionType: 'Mentorship'
    },
    {
      skill: 'React Micro-Frontend Architecture',
      demandHours: 140,
      supplyHours: 150,
      deficitHours: 0,
      riskLevel: 'Healthy',
      impact: 'Sufficient senior frontend coverage across Elena Rostova & Sarah Chen.',
      recommendation: 'Maintain current rotation; encourage peer code reviews.',
      actionType: 'Sustained'
    },
    {
      skill: 'Cloud Security & Compliance (SOC2/PCI-DSS)',
      demandHours: 80,
      supplyHours: 40,
      deficitHours: 40,
      riskLevel: 'High',
      impact: 'Single point of failure on Leila Farhat for security signoffs.',
      recommendation: 'Urgent need to recruit 1 Senior FinTech Security Engineer or hire external auditor.',
      actionType: 'Hiring'
    }
  ];

  return (
    <div>
      <div className="sub-navbar">
        <div>
          <h1 className="page-headline">Skill Gap Recommendations</h1>
          <div className="breadcrumb-trail">
            <span>Material Admin</span>
            <span>&gt;</span>
            <span>Analytics</span>
            <span>&gt;</span>
            <span className="active">Competency &amp; Upskilling</span>
          </div>
        </div>

        <div className="sub-nav-actions">
          <button 
            className="action-pill-btn"
            style={{ background: '#4880FF', color: '#ffffff', border: 'none' }}
            onClick={() => setCurrentScreen('create-task')}
          >
            <Lightbulb size={14} />
            <span>Create Task with New Skills</span>
          </button>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-val" style={{ color: '#EA5455' }}>2</span>
            <span className="metric-pill danger">Critical</span>
          </div>
          <span className="metric-label">High-Risk Skill Bottlenecks</span>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            Payments &amp; Cloud Security
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-val">154 hrs</span>
            <span className="metric-pill warning">Weekly Deficit</span>
          </div>
          <span className="metric-label">Unfulfilled Technical Demand</span>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            Calculated against Q3 backlog
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-val">87%</span>
            <span className="metric-pill success">+4.2%</span>
          </div>
          <span className="metric-label">Team Agility Index</span>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            Multi-discipline competency score
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-val">3</span>
            <span className="metric-pill success">Active</span>
          </div>
          <span className="metric-label">Recommended Upskill Tracks</span>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            Cross-functional pairing in progress
          </div>
        </div>
      </div>

      {/* DETAILED SKILL GAP MATRIX TABLE */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Team Skill Demand vs. Capacity Matrix</div>
            <div className="card-subtitle">
              Continuous gap detection powered by queued task skill requirements vs engineer proficiency rosters
            </div>
          </div>
        </div>

        <table className="manual-emp-table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Skill Competency</th>
              <th style={{ width: '15%' }}>Demand vs Supply</th>
              <th style={{ width: '12%' }}>Gap Deficit</th>
              <th style={{ width: '12%' }}>Risk Status</th>
              <th style={{ width: '26%' }}>AI Upskilling / Hiring Action</th>
              <th style={{ width: '10%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {skillDemands.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <strong style={{ color: '#1E293B', display: 'block' }}>{item.skill}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.impact}</span>
                </td>
                <td>
                  <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#1E293B' }}>
                    {item.demandHours}h req / {item.supplyHours}h cap
                  </div>
                  <div className="progress-bar-bg" style={{ marginTop: '4px' }}>
                    <div 
                      className="progress-bar-fill" 
                      style={{
                        width: `${Math.min(100, (item.supplyHours / item.demandHours) * 100)}%`,
                        background: item.riskLevel === 'Critical' ? '#EA5455' : item.riskLevel === 'Moderate' ? '#FF9F43' : '#00B69B'
                      }} 
                    />
                  </div>
                </td>
                <td>
                  <span style={{
                    fontSize: '0.8125rem',
                    fontWeight: '800',
                    color: item.deficitHours > 0 ? '#EA5455' : '#00B69B'
                  }}>
                    {item.deficitHours > 0 ? `-${item.deficitHours} hrs/wk` : 'Balanced'}
                  </span>
                </td>
                <td>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: item.riskLevel === 'Critical' ? '#FEEFEF' : item.riskLevel === 'Moderate' ? '#FFF5EC' : '#E6F8F5',
                    color: item.riskLevel === 'Critical' ? '#EA5455' : item.riskLevel === 'Moderate' ? '#FF9F43' : '#00B69B'
                  }}>
                    ● {item.riskLevel}
                  </span>
                </td>
                <td>
                  <p style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: '1.4' }}>
                    {item.recommendation}
                  </p>
                </td>
                <td>
                  <button 
                    className="action-pill-btn"
                    style={{ fontSize: '0.6875rem', padding: '4px 8px' }}
                    onClick={() => alert(`Initiated upskilling initiative for ${item.skill}`)}
                  >
                    Initiate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CROSS-TRAINING & PAIRING RECOMMENDATIONS */}
      <div className="dash-grid-split">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} color="#4880FF" />
                <span>Recommended Peer-Mentorship Pairings</span>
              </div>
              <div className="card-subtitle">
                Autonomous pairing suggestions to bridge skill deficits through sprint collaboration
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#FAFBFD', border: '1px solid #E6EDF9', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#1E293B' }}>Marcus Vance (Mentor) ➔ Devon Miles (Mentee)</strong>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  Target: Advance Stripe Elements &amp; Webhook Idempotency from Intermediate to Advanced.
                </p>
              </div>
              <span className="metric-pill success">Match 98%</span>
            </div>

            <div style={{ background: '#FAFBFD', border: '1px solid #E6EDF9', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '0.875rem', color: '#1E293B' }}>Sarah Chen (Mentor) ➔ Aarav Patel (Mentee)</strong>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  Target: React Performance profiling &amp; Next.js SSR state hydration.
                </p>
              </div>
              <span className="metric-pill success">Match 95%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} color="#00B69B" />
                <span>Headcount &amp; Hiring Forecast</span>
              </div>
              <div className="card-subtitle">
                Long-term capacity prediction for Q4 roadmap commitments
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#F8FAFD', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: '700' }}>
                <span>1x Senior FinTech Security Engineer</span>
                <span style={{ color: '#EA5455' }}>High Urgency</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                Required to de-risk single point of failure before ISO-27001 audit.
              </p>
            </div>

            <div style={{ background: '#F8FAFD', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: '700' }}>
                <span>1x Full-Stack Node/React Engineer</span>
                <span style={{ color: '#FF9F43' }}>Medium Urgency</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                To absorb sprint spillover as user volume expands 2.4x.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
