import React from 'react';
import { 
  BarChart3, 
  PlusCircle, 
  Kanban, 
  Users, 
  Shuffle, 
  Lightbulb, 
  LogIn, 
  ChevronRight,
  Sparkles,
  UserX,
  AlertTriangle
} from 'lucide-react';
import { useWorkforce } from '../context/WorkforceContext';

export const Sidebar = () => {
  const { 
    currentScreen, 
    setCurrentScreen, 
    reallocationHistory, 
    triggerUrgentTaskSimulation,
    toggleEmployeeAvailability,
    employees
  } = useWorkforce();

  // Find an available employee to trigger sick leave simulation
  const availableEmp = employees.find(e => e.availability === 'Available');

  return (
    <aside className="sidebar">
      {/* User Card matching template */}
      <div 
        className="sidebar-user-card" 
        onClick={() => setCurrentScreen('dashboard')}
      >
        <img 
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80" 
          alt="Malinda Hollaway" 
          className="sidebar-user-avatar"
        />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">Malinda Hollaway</div>
          <div className="sidebar-user-email">malinda-h@zmail.zh</div>
        </div>
        <ChevronRight size={14} color="#94A3B8" />
      </div>

      {/* DASHBOARDS SECTION */}
      <div className="nav-section-title">Dashboards</div>
      <ul className="nav-list">
        <li>
          <button 
            className={`nav-item-btn ${currentScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('dashboard')}
          >
            <div className="nav-item-left">
              <BarChart3 size={18} />
              <span>Manager Dashboard</span>
            </div>
          </button>
        </li>
      </ul>

      {/* APPLICATION VIEWS SECTION */}
      <div className="nav-section-title" style={{ marginTop: '12px' }}>Application Views</div>
      <ul className="nav-list">
        <li>
          <button 
            className={`nav-item-btn ${currentScreen === 'create-task' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('create-task')}
          >
            <div className="nav-item-left">
              <PlusCircle size={18} color={currentScreen === 'create-task' ? '#4880FF' : '#64748B'} />
              <span>Create / Allocate Task</span>
            </div>
            <span className="nav-badge-pill core">CORE</span>
          </button>
        </li>

        <li>
          <button 
            className={`nav-item-btn ${currentScreen === 'task-board' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('task-board')}
          >
            <div className="nav-item-left">
              <Kanban size={18} />
              <span>Task Board / List</span>
            </div>
          </button>
        </li>

        <li>
          <button 
            className={`nav-item-btn ${currentScreen === 'employees' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('employees')}
          >
            <div className="nav-item-left">
              <Users size={18} />
              <span>Employee List</span>
            </div>
          </button>
        </li>

        <li>
          <button 
            className={`nav-item-btn ${currentScreen === 'reallocation' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('reallocation')}
          >
            <div className="nav-item-left">
              <Shuffle size={18} />
              <span>Reallocation Center</span>
            </div>
            {reallocationHistory.length > 0 && (
              <span className="nav-badge-pill alert">{reallocationHistory.length}</span>
            )}
          </button>
        </li>

        <li>
          <button 
            className={`nav-item-btn ${currentScreen === 'skill-gaps' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('skill-gaps')}
          >
            <div className="nav-item-left">
              <Lightbulb size={18} />
              <span>Skill Gap Analysis</span>
            </div>
          </button>
        </li>
      </ul>

      {/* MISCELLANEOUS */}
      <div className="nav-section-title" style={{ marginTop: '12px' }}>Miscellaneous</div>
      <ul className="nav-list">
        <li>
          <button 
            className={`nav-item-btn ${currentScreen === 'landing' ? 'active' : ''}`}
            onClick={() => setCurrentScreen('landing')}
          >
            <div className="nav-item-left">
              <LogIn size={18} />
              <span>Landing & Auth</span>
            </div>
          </button>
        </li>
      </ul>

      {/* DYNAMIC REALLOCATION SIMULATION SANDBOX */}
      <div className="simulation-box">
        <div className="simulation-box-title">
          <AlertTriangle size={14} color="#EA5455" />
          <span>Dynamic Live Sandbox</span>
        </div>
        <p style={{ fontSize: '0.6875rem', color: '#64748B', marginBottom: '8px', lineHeight: '1.3' }}>
          Test adaptive reallocation when conditions change continuously:
        </p>

        <button 
          className="sim-btn"
          onClick={triggerUrgentTaskSimulation}
        >
          <Sparkles size={14} color="#4880FF" />
          <span>Simulate P0 Task Surge</span>
        </button>

        {availableEmp && (
          <button 
            className="sim-btn danger"
            onClick={() => toggleEmployeeAvailability(availableEmp.id, 'Sick')}
          >
            <UserX size={14} color="#EA5455" />
            <span>Mark {availableEmp.name.split(' ')[0]} Sick</span>
          </button>
        )}
      </div>
    </aside>
  );
};
