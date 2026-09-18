import React, { useState } from 'react';
import { 
  Kanban, 
  ListFilter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Shuffle, 
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { useWorkforce } from '../context/WorkforceContext';

export const TaskBoard = () => {
  const { tasks, employees, setCurrentScreen, setActiveReasoning } = useWorkforce();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [filterPriority, setFilterPriority] = useState('All');

  const columns = ['Backlog', 'Allocated', 'In Progress', 'Completed'];

  const filteredTasks = tasks.filter(t => 
    filterPriority === 'All' ? true : t.priority === filterPriority
  );

  return (
    <div>
      <div className="sub-navbar">
        <div>
          <h1 className="page-headline">Task Board &amp; Schedule</h1>
          <div className="breadcrumb-trail">
            <span>Material Admin</span>
            <span>&gt;</span>
            <span>Tasks</span>
            <span>&gt;</span>
            <span className="active">Workforce Allocations</span>
          </div>
        </div>

        <div className="sub-nav-actions">
          <div style={{ display: 'flex', background: '#ffffff', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '3px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                border: 'none',
                background: viewMode === 'kanban' ? '#4880FF' : 'transparent',
                color: viewMode === 'kanban' ? '#ffffff' : '#64748B',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Kanban size={14} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                border: 'none',
                background: viewMode === 'list' ? '#4880FF' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : '#64748B',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ListFilter size={14} />
              <span>List</span>
            </button>
          </div>

          <select 
            className="form-select" 
            style={{ width: '130px', padding: '6px 12px', fontSize: '0.8125rem' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">🚨 Urgent</option>
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>

          <button 
            className="action-pill-btn"
            style={{ background: '#4880FF', color: '#ffffff', border: 'none', fontWeight: '700' }}
            onClick={() => setCurrentScreen('create-task')}
          >
            <Plus size={15} />
            <span>Create / Allocate</span>
          </button>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
          gap: '20px',
          alignItems: 'start'
        }}>
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col);
            return (
              <div 
                key={col} 
                style={{
                  background: '#F8FAFD',
                  border: '1px solid #E6EDF9',
                  borderRadius: '16px',
                  padding: '16px',
                  minHeight: '520px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: col === 'Urgent' || col === 'In Progress' ? '#4880FF' : col === 'Completed' ? '#00B69B' : '#94A3B8'
                    }} />
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: '800', color: '#1E293B' }}>{col}</h3>
                  </div>
                  <span style={{
                    background: '#ffffff',
                    border: '1px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#64748B'
                  }}>
                    {colTasks.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {colTasks.map(task => {
                    const assignedList = task.assignedTo.map(id => employees.find(e => e.id === id)).filter(Boolean);
                    const isUrgent = task.priority === 'Urgent';

                    return (
                      <div 
                        key={task.id} 
                        className="card"
                        style={{
                          padding: '16px',
                          border: isUrgent ? '1.5px solid #EA5455' : '1px solid #E6EDF9',
                          boxShadow: isUrgent ? '0 4px 14px rgba(234, 84, 85, 0.15)' : 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{
                            fontSize: '0.6875rem',
                            fontWeight: '800',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: isUrgent ? '#FEEFEF' : task.priority === 'High' ? '#FFF5EC' : '#EEF4FE',
                            color: isUrgent ? '#EA5455' : task.priority === 'High' ? '#FF9F43' : '#4880FF'
                          }}>
                            {task.priority}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '700' }}>
                            {task.id}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '0.9375rem', fontWeight: '800', color: '#1E293B', marginBottom: '6px', lineHeight: '1.3' }}>
                          {task.title}
                        </h4>

                        <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '12px', lineHeight: '1.4' }}>
                          {task.description.slice(0, 75)}...
                        </p>

                        {/* Skill pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                          {task.skillsRequired.map((s, idx) => (
                            <span 
                              key={idx} 
                              style={{
                                fontSize: '0.625rem',
                                fontWeight: '700',
                                background: '#F1F5F9',
                                color: '#475569',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              {s.skill}
                            </span>
                          ))}
                        </div>

                        {/* Footer: SLA & Assignees */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: isUrgent ? '#EA5455' : '#64748B', fontWeight: '600' }}>
                            <Clock size={12} />
                            <span>{new Date(task.slaDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {assignedList.length === 0 ? (
                              <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontStyle: 'italic' }}>Unassigned</span>
                            ) : (
                              assignedList.map((emp, i) => (
                                <img 
                                  key={emp.id} 
                                  src={emp.avatar} 
                                  alt={emp.name} 
                                  title={emp.name}
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    border: '2px solid #ffffff',
                                    marginLeft: i > 0 ? '-6px' : 0,
                                    objectFit: 'cover'
                                  }}
                                />
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="manual-emp-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Task Details</th>
                <th>Priority</th>
                <th>SLA Deadline</th>
                <th>Required Skills</th>
                <th>Assigned Engineers</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => {
                const assignedList = task.assignedTo.map(id => employees.find(e => e.id === id)).filter(Boolean);
                return (
                  <tr key={task.id}>
                    <td>
                      <strong style={{ color: '#4880FF' }}>{task.id}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#1E293B', display: 'block' }}>{task.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{task.description.slice(0, 65)}...</span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: task.priority === 'Urgent' ? '#FEEFEF' : task.priority === 'High' ? '#FFF5EC' : '#EEF4FE',
                        color: task.priority === 'Urgent' ? '#EA5455' : task.priority === 'High' ? '#FF9F43' : '#4880FF'
                      }}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: '600' }}>
                        {new Date(task.slaDeadline).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {task.skillsRequired.map((s, idx) => (
                          <span key={idx} className="ai-skill-chip" style={{ fontSize: '0.625rem' }}>
                            {s.skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {assignedList.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Unassigned</span>
                        ) : (
                          assignedList.map(emp => (
                            <img 
                              key={emp.id} 
                              src={emp.avatar} 
                              alt={emp.name} 
                              title={`${emp.name} (${emp.workload}% Load)`}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ))
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: task.status === 'In Progress' ? '#EEF4FE' : '#E6F8F5',
                        color: task.status === 'In Progress' ? '#4880FF' : '#00B69B'
                      }}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
