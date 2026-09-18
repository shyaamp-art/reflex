import React from 'react';
import { 
  Search, 
  Bell, 
  Mail, 
  CheckCircle2, 
  Sun, 
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { useWorkforce } from '../context/WorkforceContext';

export const Header = () => {
  const { 
    unreadCount, 
    setUnreadCount, 
    setCurrentScreen, 
    triggerUrgentTaskSimulation 
  } = useWorkforce();

  return (
    <header className="top-header">
      <div className="header-left">
        <div 
          className="logo-brand" 
          onClick={() => setCurrentScreen('dashboard')}
          title="Return to Dashboard"
        >
          Material Admin 3.0
          <span>• Reflex AI</span>
        </div>

        <div className="search-bar-container">
          <Search size={16} color="rgba(255, 255, 255, 0.85)" />
          <input 
            type="text" 
            placeholder="Search for tasks, skills, and engineers..." 
          />
          <span className="shortcut-badge">⌘K</span>
        </div>
      </div>

      <div className="header-right">
        {/* Quick Demo Trigger */}
        <button 
          className="header-icon-btn" 
          style={{ width: 'auto', padding: '0 12px', borderRadius: '20px', gap: '6px', background: 'rgba(255,255,255,0.18)' }}
          onClick={triggerUrgentTaskSimulation}
          title="Trigger P0 Production Incident to demonstrate instant dynamic AI reallocation"
        >
          <Sparkles size={15} color="#FFEB3B" />
          <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>Demo P0 Surge</span>
        </button>

        {/* Bell with notification dot/badge */}
        <button 
          className="header-icon-btn" 
          onClick={() => {
            setUnreadCount(0);
            setCurrentScreen('reallocation');
          }}
          title="Reallocation Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="badge-count">{unreadCount}</span>
          )}
        </button>

        <button className="header-icon-btn" title="Messages">
          <Mail size={18} />
        </button>

        <button 
          className="header-icon-btn" 
          title="Active SLA Guardrails"
          onClick={() => setCurrentScreen('task-board')}
        >
          <CheckCircle2 size={18} />
        </button>

        <button className="header-icon-btn" title="Theme Mode">
          <Sun size={18} />
        </button>

        <button 
          className="header-icon-btn" 
          title="Settings & Parameters"
          onClick={() => setCurrentScreen('skill-gaps')}
        >
          <SlidersHorizontal size={18} />
        </button>

        <div 
          className="profile-pill" 
          onClick={() => setCurrentScreen('dashboard')}
        >
          <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80" 
            alt="Malinda Hollaway" 
          />
          <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>Malinda H.</span>
        </div>
      </div>
    </header>
  );
};
