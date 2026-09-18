import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  MapPin,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useWorkforce } from '../context/WorkforceContext';

export const EmployeeList = () => {
  const { employees, toggleEmployeeAvailability, setCurrentScreen } = useWorkforce();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.skills.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' ? true : emp.availability === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="sub-navbar">
        <div>
          <h1 className="page-headline">Employee Directory &amp; Capacity</h1>
          <div className="breadcrumb-trail">
            <span>Material Admin</span>
            <span>&gt;</span>
            <span>Personnel</span>
            <span>&gt;</span>
            <span className="active">Workforce Roster</span>
          </div>
        </div>

        <div className="sub-nav-actions">
          <button 
            className="action-pill-btn"
            style={{ background: '#4880FF', color: '#ffffff', border: 'none' }}
            onClick={() => setCurrentScreen('reallocation')}
          >
            <Sparkles size={14} />
            <span>Reallocation Center</span>
          </button>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div className="manual-search-bar" style={{ margin: 0, flex: 1, minWidth: '260px' }}>
            <Search size={18} color="#64748B" />
            <input 
              type="text" 
              placeholder="Search by name, skill (e.g. React, Stripe), or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#64748B' }}>Filter Status:</span>
            {['All', 'Available', 'Busy', 'Sick', 'On Leave'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? '#4880FF' : '#F1F5F9',
                  color: statusFilter === st ? '#ffffff' : '#475569',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Engineers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filtered.map(emp => {
          const isSickOrLeave = emp.availability === 'Sick' || emp.availability === 'On Leave';

          return (
            <div 
              key={emp.id} 
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                border: isSickOrLeave ? '1.5px dashed #CBD5E1' : '1px solid #E6EDF9',
                opacity: isSickOrLeave ? 0.85 : 1
              }}
            >
              {/* Header: Avatar, Name, Availability */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={emp.avatar} 
                    alt={emp.name} 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1E293B' }}>{emp.name}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748B' }}>{emp.role}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                      <MapPin size={11} />
                      <span>{emp.location}</span>
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: emp.availability === 'Available' ? '#E6F8F5' : emp.availability === 'Busy' ? '#FFF5EC' : '#FEEFEF',
                  color: emp.availability === 'Available' ? '#00B69B' : emp.availability === 'Busy' ? '#FF9F43' : '#EA5455'
                }}>
                  ● {emp.availability}
                </span>
              </div>

              {/* Skills */}
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                  Verified Skills
                </span>
                <div className="ai-skills-wrap" style={{ marginTop: '5px' }}>
                  {emp.skills.map(s => (
                    <span key={s.name} className="ai-skill-chip">
                      {s.name} • {s.proficiency}
                    </span>
                  ))}
                </div>
              </div>

              {/* Workload Progress Bar */}
              <div style={{ background: '#F8FAFD', padding: '12px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>Current Workload</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: '800', color: emp.workload > 80 ? '#EA5455' : emp.workload > 60 ? '#FF9F43' : '#00B69B' }}>
                    {emp.workload}% ({emp.currentAllocatedHours}/{emp.maxCapacityHours} hrs)
                  </span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${emp.workload}%`,
                      backgroundColor: emp.workload > 80 ? '#EA5455' : emp.workload > 60 ? '#FF9F43' : '#00B69B'
                    }} 
                  />
                </div>
              </div>

              {/* Performance & Active Tasks */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: '#64748B' }}>Historical Performance</span>
                <strong style={{ color: '#1E293B' }}>{emp.performanceScore}/100</strong>
              </div>

              {/* Quick Availability Simulation Controls */}
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Simulate Availability Change
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => toggleEmployeeAvailability(emp.id, 'Available')}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '0.6875rem',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: emp.availability === 'Available' ? '1.5px solid #00B69B' : '1px solid #CBD5E1',
                      background: emp.availability === 'Available' ? '#E6F8F5' : '#ffffff',
                      color: emp.availability === 'Available' ? '#00B69B' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Available
                  </button>

                  <button
                    onClick={() => toggleEmployeeAvailability(emp.id, 'Busy')}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '0.6875rem',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: emp.availability === 'Busy' ? '1.5px solid #FF9F43' : '1px solid #CBD5E1',
                      background: emp.availability === 'Busy' ? '#FFF5EC' : '#ffffff',
                      color: emp.availability === 'Busy' ? '#FF9F43' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Busy
                  </button>

                  <button
                    onClick={() => toggleEmployeeAvailability(emp.id, 'Sick')}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '0.6875rem',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: emp.availability === 'Sick' ? '1.5px solid #EA5455' : '1px solid #CBD5E1',
                      background: emp.availability === 'Sick' ? '#FEEFEF' : '#ffffff',
                      color: emp.availability === 'Sick' ? '#EA5455' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Sick (Out)
                  </button>

                  <button
                    onClick={() => toggleEmployeeAvailability(emp.id, 'On Leave')}
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      fontSize: '0.6875rem',
                      fontWeight: '700',
                      borderRadius: '6px',
                      border: emp.availability === 'On Leave' ? '1.5px solid #826AF9' : '1px solid #CBD5E1',
                      background: emp.availability === 'On Leave' ? '#F2EFFF' : '#ffffff',
                      color: emp.availability === 'On Leave' ? '#826AF9' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    On Leave
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
