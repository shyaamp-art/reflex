import React from 'react';
import { 
  TrendingUp, 
  Info, 
  MoreVertical, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  Shuffle,
  Clock,
  ArrowUpRight,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { useWorkforce } from '../context/WorkforceContext';

export const ManagerDashboard = () => {
  const { 
    stats, 
    setCurrentScreen, 
    reallocationHistory, 
    triggerUrgentTaskSimulation,
    setActiveReasoning
  } = useWorkforce();

  return (
    <div>
      {/* Sub-navbar with breadcrumb matching screenshot */}
      <div className="sub-navbar">
        <div>
          <h1 className="page-headline">Website Analytics</h1>
          <div className="breadcrumb-trail">
            <span>Material Admin</span>
            <span>&gt;</span>
            <span className="active">Dashboards</span>
          </div>
        </div>

        <div className="sub-nav-actions">
          <button className="action-pill-btn">
            <span>Accounts</span>
          </button>
          <button className="action-pill-btn" style={{ borderColor: '#4880FF', color: '#4880FF' }}>
            <span>Analytics</span>
          </button>
          <button className="action-pill-btn">
            <span>Reports ▾</span>
          </button>
          <button 
            className="action-pill-btn" 
            style={{ background: '#4880FF', color: '#ffffff', border: 'none' }}
            onClick={() => setCurrentScreen('create-task')}
          >
            <Sparkles size={14} />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* TOP METRIC CARDS (PAGE VIEWS & UNIQUE VISITORS REMOVED) */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {/* Card 1: Total Employees */}
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-val">142</span>
            <span className="metric-pill success">
              <TrendingUp size={12} />
              +4.61%
            </span>
          </div>
          <span className="metric-label">Total Employees</span>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            Full-time &amp; Contract Staff ({stats.availableEmployees}/{stats.totalEmployees} in Active Squad)
          </div>
        </div>

        {/* Card 2: Active Recruitment Openings */}
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-val">14</span>
            <span className="metric-pill warning">
              8 in Final Loop
            </span>
          </div>
          <span className="metric-label">Active Recruitment Openings</span>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            75% of Q3 Tech Hiring Target Completed (21d Avg Time-to-Hire)
          </div>
        </div>

        {/* Card 3: Current Employees Average Working Workload */}
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-val">{stats.avgWorkload}%</span>
            <span className={`metric-pill ${stats.avgWorkload > 75 ? 'danger' : stats.avgWorkload > 55 ? 'warning' : 'success'}`}>
              {stats.avgWorkload > 75 ? 'High Load' : 'Balanced'}
            </span>
          </div>
          <span className="metric-label">Current Employees Average Workload</span>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '6px' }}>
            Target Threshold: &lt; 75% Capacity Headroom
          </div>
        </div>
      </div>

      {/* ROW 2: CURRENT WORKING TEAMS (TOP 3) + RECRUITMENT PROGRESS + HR DEPARTMENT UPDATES */}
      <div className="dash-grid-tri">
        {/* Widget 1: Current Working Teams (Top 3 by Highest Progress) */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="card-title">Current Working Teams</div>
                <span className="metric-pill success" style={{ fontSize: '0.6875rem', padding: '2px 6px' }}>
                  Top 3 Highest Progress
                </span>
              </div>
              <div className="card-subtitle">Highest completion progress &amp; team leads</div>
            </div>
            <div className="card-header-icons">
              <button><Info size={15} /></button>
              <button><MoreVertical size={15} /></button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              {
                rank: 1,
                team: 'Mobile & Realtime Apps',
                lead: 'Devon Miles',
                task: 'Mobile Push Notification Service',
                progress: 90,
                color: '#826AF9'
              },
              {
                rank: 2,
                team: 'Frontend Architecture Squad',
                lead: 'Elena Rostova',
                task: 'Design System Tokens & Micro-Frontends',
                progress: 82,
                color: '#00B69B'
              },
              {
                rank: 3,
                team: 'Security & Compliance',
                lead: 'Leila Farhat',
                task: 'PCI-DSS 4.0 Compliance Audit',
                progress: 74,
                color: '#EA5455'
              }
            ].map((t) => (
              <div 
                key={t.team} 
                style={{ 
                  background: '#F8FAFD', 
                  border: '1px solid #EEF2FA', 
                  borderRadius: '12px', 
                  padding: '14px' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: t.color,
                      color: '#ffffff',
                      fontSize: '0.6875rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      #{t.rank}
                    </span>
                    <div>
                      <strong style={{ fontSize: '0.875rem', color: '#1E293B', display: 'block' }}>{t.team}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#4880FF', fontWeight: '700' }}>
                        Team Lead: <span>{t.lead}</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: '800', color: t.color }}>
                    {t.progress}%
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Current Task: <strong>{t.task}</strong>
                </div>

                <div style={{ height: '7px', background: '#EEF2F6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${t.progress}%`, 
                      height: '100%', 
                      background: t.color, 
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: Recruitment Progress & Current Industry Requirements Skills */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recruitment Progress</div>
              <div className="card-subtitle">Current industry in-demand skills &amp; hiring targets</div>
            </div>
            <div className="card-header-icons">
              <button><Info size={15} /></button>
              <button><MoreVertical size={15} /></button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              {
                skill: 'Generative AI & LLM Systems',
                demand: 'High Demand',
                status: '12 Screened • 3 In Interview',
                progress: 78,
                color: '#4880FF'
              },
              {
                skill: 'Cloud-Native Kubernetes & Go',
                demand: 'Critical Priority',
                status: '8 in Tech Loops',
                progress: 85,
                color: '#00B69B'
              },
              {
                skill: 'Stripe & FinTech Architecture',
                demand: 'Offer Stage',
                status: '2 Offers Pending Acceptance',
                progress: 94,
                color: '#826AF9'
              },
              {
                skill: 'Event-Driven Kafka Streams',
                demand: 'Active Sourcing',
                status: '6 In Preliminary Round',
                progress: 60,
                color: '#FF9F43'
              }
            ].map((s) => (
              <div key={s.skill}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#1E293B' }}>{s.skill}</span>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: '700',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: s.color === '#00B69B' ? '#E6F8F5' : s.color === '#4880FF' ? '#EEF4FE' : '#FFF5EC',
                    color: s.color
                  }}>
                    {s.demand}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: '5px' }}>
                  <span>{s.status}</span>
                  <strong style={{ color: s.color }}>{s.progress}%</strong>
                </div>
                <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${s.progress}%`, height: '100%', background: s.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #EEF2F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600' }}>Overall Q3 Target:</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: '800', color: '#4880FF' }}>18 / 24 Roles Filled (75%)</span>
          </div>
        </div>

        {/* Widget 3: HR Department Updates */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">HR Department Updates</div>
              <div className="card-subtitle">Live recruitment announcements &amp; hiring activity</div>
            </div>
            <div className="card-header-icons">
              <button><Info size={15} /></button>
              <button><MoreVertical size={15} /></button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              {
                tag: 'OFFER ACCEPTED',
                badgeBg: '#E6F8F5',
                badgeColor: '#00B69B',
                title: 'Staff React Native Architect Hired',
                desc: 'Candidate accepted offer for Mobile Tribe. Onboarding begins next sprint.',
                time: '2 hours ago'
              },
              {
                tag: 'INTERVIEW LOOP',
                badgeBg: '#EEF4FE',
                badgeColor: '#4880FF',
                title: '4 Final Rounds for Distributed Systems',
                desc: 'Technical evaluations completed with 94%+ score index.',
                time: '5 hours ago'
              },
              {
                tag: 'REFERRAL BONUS',
                badgeBg: '#FFF5EC',
                badgeColor: '#FF9F43',
                title: '$3,500 FinTech Security Referral Active',
                desc: 'Special referral incentive for Senior Cloud Security roles.',
                time: 'Yesterday'
              },
              {
                tag: 'ONBOARDING',
                badgeBg: '#F2EFFF',
                badgeColor: '#826AF9',
                title: '5 New Engineers Orientation Cohort',
                desc: 'Dev environment setup and mentor pairing scheduled for Monday.',
                time: '2 days ago'
              }
            ].map((hr, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: '#F8FAFD', 
                  border: '1px solid #EEF2FA', 
                  borderRadius: '10px', 
                  padding: '10px 12px' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '0.625rem',
                    fontWeight: '800',
                    background: hr.badgeBg,
                    color: hr.badgeColor,
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {hr.tag}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{hr.time}</span>
                </div>
                <strong style={{ fontSize: '0.8125rem', color: '#1E293B', display: 'block', marginBottom: '2px' }}>
                  {hr.title}
                </strong>
                <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.3' }}>
                  {hr.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: REAL-TIME REALLOCATION STREAM + ACTIVE USERS TIMELINE */}
      <div className="dash-grid-split">
        {/* Dynamic Reallocation Center Preview */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shuffle size={18} color="#FF9F43" />
                <span>Live Dynamic Reallocation Stream</span>
              </div>
              <div className="card-subtitle">
                Autonomous system adjustments responding to priority changes and resource availability
              </div>
            </div>
            <button 
              className="action-pill-btn"
              onClick={() => setCurrentScreen('reallocation')}
            >
              <span>View Full Center →</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reallocationHistory.map((item) => (
              <div 
                key={item.id}
                style={{
                  background: '#FAFBFD',
                  border: '1px solid #E6EDF9',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ background: '#FFF5EC', color: '#FF9F43', fontSize: '0.6875rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>
                      {item.trigger}
                    </span>
                    <strong style={{ fontSize: '0.875rem', color: '#1E293B' }}>{item.taskTitle}</strong>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: '1.4' }}>
                    {item.reasoning}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: '#00B69B', fontWeight: '700', marginTop: '6px' }}>
                    ✓ {item.slaImpact}
                  </div>
                </div>

                <button
                  className="action-pill-btn"
                  style={{ flexShrink: 0, padding: '6px 12px', fontSize: '0.75rem' }}
                  onClick={() => setActiveReasoning(item)}
                >
                  Inspect Reasoning
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Average Attendance Rate Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Daily Average Attendance Rate</div>
              <div className="card-subtitle">Rolling 14-day employee active attendance &amp; check-ins</div>
            </div>
            <div className="card-header-icons">
              <button><Info size={15} /></button>
            </div>
          </div>

          {/* Bar Chart Visualization matching screenshot */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '10px 0 0 0', borderBottom: '1px solid #EEF2F6' }}>
            {[92, 95, 96, 98, 94, 97, 95, 99, 93, 97, 98, 96, 100, 95, 97, 98, 94, 96, 97].map((rate, i) => (
              <div 
                key={i} 
                title={`Day ${i+1}: ${rate}% Attendance`}
                style={{
                  width: '6px',
                  height: `${(rate - 50) * 2.6}px`,
                  backgroundColor: '#4880FF',
                  borderRadius: '3px 3px 0 0',
                  opacity: i === 15 ? 1 : 0.78
                }}
              />
            ))}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Sprint Average Attendance</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B' }}>96.4% On-Duty</div>
            </div>
            <span className="metric-pill success">+2.1% adherence</span>
          </div>
        </div>
      </div>
    </div>
  );
};
